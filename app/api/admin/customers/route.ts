import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

export async function GET(req: NextRequest) {
  try {
    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const authHeader = req.headers.get("authorization");
    const adminToken = authHeader?.replace("Bearer ", "").trim();

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        { success: false, message: "Missing config." },
        { status: 500 }
      );
    }

    // Verify admin
    const meRes = await fetch(
      `${wpBaseUrl.replace(/\/$/, "")}/wp-json/wp/v2/users/me?context=edit`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        cache: "no-store",
      }
    );

    if (!meRes.ok) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const meData = await meRes.json();
    if (!meData?.roles?.includes("administrator")) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    // Fetch Chargebee customers
    const listParams: any = { limit: 100 };
    if (search) {
      listParams.email = { contains: search };
    }

    const custResult = await chargebee.customer.list(listParams);
    const custList = Array.isArray(custResult?.list) ? custResult.list : [];

    // Fetch subscriptions for customer enrichment
    const subResult = await chargebee.subscription.list({ limit: 100 });
    const subList = Array.isArray(subResult?.list) ? subResult.list : [];

    // Build subscription map by customer_id
    const subsByCustomer: Record<string, any[]> = {};
    for (const entry of subList) {
      const sub = entry?.subscription || {};
      const custId = sub.customer_id;
      if (!custId) continue;
      if (!subsByCustomer[custId]) subsByCustomer[custId] = [];

      const item =
        Array.isArray(entry?.subscription_items) && entry.subscription_items.length > 0
          ? entry.subscription_items[0]
          : {};

      subsByCustomer[custId].push({
        id: sub.id,
        status: sub.status,
        plan: item?.item_price_id || sub.plan_id || "",
        amount: item?.unit_price ?? sub.mrr ?? 0,
        currency_code: sub.currency_code || "GBP",
        created_at: sub.created_at,
        next_billing_at: sub.next_billing_at,
      });
    }

    const customers = custList.map((entry: any) => {
      const cust = entry?.customer || {};
      const subs = subsByCustomer[cust.id] || [];

      return {
        id: cust.id,
        email: cust.email || "",
        first_name: cust.first_name || "",
        last_name: cust.last_name || "",
        company: cust.company || "",
        created_at: cust.created_at || null,
        subscriptions: subs,
        active_subscriptions: subs.filter(
          (s: any) => s.status === "active" || s.status === "in_trial"
        ).length,
        total_subscriptions: subs.length,
      };
    });

    // If searching by name/company too (email search might miss)
    let finalCustomers = customers;
    if (search && !customers.length) {
      // Try fetching all and filtering client-side
      const allResult = await chargebee.customer.list({ limit: 100 });
      const allList = Array.isArray(allResult?.list) ? allResult.list : [];

      const searchLower = search.toLowerCase();
      finalCustomers = allList
        .filter((entry: any) => {
          const c = entry?.customer || {};
          return (
            (c.email || "").toLowerCase().includes(searchLower) ||
            (c.first_name || "").toLowerCase().includes(searchLower) ||
            (c.last_name || "").toLowerCase().includes(searchLower) ||
            (c.company || "").toLowerCase().includes(searchLower) ||
            (c.id || "").toLowerCase().includes(searchLower)
          );
        })
        .map((entry: any) => {
          const cust = entry?.customer || {};
          const subs = subsByCustomer[cust.id] || [];

          return {
            id: cust.id,
            email: cust.email || "",
            first_name: cust.first_name || "",
            last_name: cust.last_name || "",
            company: cust.company || "",
            created_at: cust.created_at || null,
            subscriptions: subs,
            active_subscriptions: subs.filter(
              (s: any) => s.status === "active" || s.status === "in_trial"
            ).length,
            total_subscriptions: subs.length,
          };
        });
    }

    return NextResponse.json({
      success: true,
      customers: finalCustomers,
    });
  } catch (error: any) {
    console.error("Admin customers error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch customers." },
      { status: 500 }
    );
  }
}
