import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

function escapeCsv(val: any): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(timestamp?: number | null): string {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

interface SubscriptionItem {
  unit_price?: number;
  item_price_id?: string;
  billing_period?: number;
  billing_period_unit?: string;
  [key: string]: any;
}

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
    const type = searchParams.get("type") || "subscriptions";

    let csvContent = "";

    if (type === "subscriptions") {
      const subResult = await chargebee.subscription.list({ limit: 100 });
      const subList = Array.isArray(subResult?.list) ? subResult.list : [];

      csvContent =
        "Subscription ID,Customer ID,Status,Plan,Amount (pence),Currency,Billing Period,Created Date,Next Billing\n";

      for (const entry of subList) {
        const sub: any = entry?.subscription || {};
        const item: SubscriptionItem =
          Array.isArray(sub.subscription_items) && sub.subscription_items.length > 0
            ? sub.subscription_items[0]
            : {};

        csvContent +=
          [
            escapeCsv(sub.id),
            escapeCsv(sub.customer_id),
            escapeCsv(sub.status),
            escapeCsv(item?.item_price_id || sub.plan_id || ""),
            escapeCsv(item?.unit_price ?? sub.mrr ?? 0),
            escapeCsv(sub.currency_code || "GBP"),
            escapeCsv(
              `${item?.billing_period || sub.billing_period || ""} ${
                item?.billing_period_unit || sub.billing_period_unit || ""
              }`
            ),
            escapeCsv(formatDate(sub.created_at)),
            escapeCsv(formatDate(sub.next_billing_at)),
          ].join(",") + "\n";
      }
    } else if (type === "customers") {
      const custResult = await chargebee.customer.list({ limit: 100 });
      const custList = Array.isArray(custResult?.list) ? custResult.list : [];

      csvContent =
        "Customer ID,Email,First Name,Last Name,Company,Created Date\n";

      for (const entry of custList) {
        const cust: any = entry?.customer || {};

        csvContent +=
          [
            escapeCsv(cust.id),
            escapeCsv(cust.email),
            escapeCsv(cust.first_name),
            escapeCsv(cust.last_name),
            escapeCsv(cust.company),
            escapeCsv(formatDate(cust.created_at)),
          ].join(",") + "\n";
      }
    } else if (type === "users") {
      // Export WordPress users + verification status
      const usersRes = await fetch(
        `${wpBaseUrl.replace(/\/$/, "")}/wp-json/custom/v1/admin/users-verification?status=`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          cache: "no-store",
        }
      );

      if (!usersRes.ok) {
        return NextResponse.json(
          { success: false, message: "Failed to fetch users from WordPress." },
          { status: 502 }
        );
      }

      const usersData = await usersRes.json();
      const users = Array.isArray(usersData?.users) ? usersData.users : [];

      csvContent =
        "User ID,Username,Email,First Name,Last Name,Verification Status,Registered Date\n";

      for (const u of users) {
        csvContent +=
          [
            escapeCsv(u.id ?? u.ID ?? ""),
            escapeCsv(u.username ?? u.user_login ?? ""),
            escapeCsv(u.email ?? u.user_email ?? ""),
            escapeCsv(u.first_name ?? ""),
            escapeCsv(u.last_name ?? ""),
            escapeCsv(u.status ?? "not_uploaded"),
            escapeCsv(u.registered ?? u.user_registered ?? ""),
          ].join(",") + "\n";
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid export type." },
        { status: 400 }
      );
    }

    const filename = `taj-export-${type}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Export failed." },
      { status: 500 }
    );
  }
}