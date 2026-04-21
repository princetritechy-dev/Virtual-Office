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
        { success: false, message: "Missing config or admin token." },
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

    // Fetch Chargebee subscription stats
    let totalSubscriptions = 0;
    let activeSubscriptions = 0;
    let cancelledSubscriptions = 0;
    let totalMRR = 0;
    const subscriptionsByPlan: Record<string, number> = {};
    const recentSubscriptions: any[] = [];

    try {
      const subResult = await chargebee.subscription.list({ limit: 100 });
      const subList = Array.isArray(subResult?.list) ? subResult.list : [];

      totalSubscriptions = subList.length;

      for (const entry of subList) {
        const sub = entry?.subscription || {};
        const status = sub.status || "";

        if (status === "active" || status === "in_trial") {
          activeSubscriptions++;
          totalMRR += sub.mrr || 0;
        } else if (status === "cancelled") {
          cancelledSubscriptions++;
        }

        const planId = sub.plan_id || entry?.subscription_items?.[0]?.item_price_id || "Unknown";
        subscriptionsByPlan[planId] = (subscriptionsByPlan[planId] || 0) + 1;

        if (recentSubscriptions.length < 10) {
          recentSubscriptions.push({
            id: sub.id,
            customer_id: sub.customer_id,
            status: sub.status,
            plan: planId,
            mrr: sub.mrr || 0,
            created_at: sub.created_at || null,
            currency_code: sub.currency_code || "GBP",
          });
        }
      }
    } catch (err) {
      console.error("Chargebee subscription fetch error:", err);
    }

    // Fetch Chargebee customer stats
    let totalCustomers = 0;
    try {
      const custResult = await chargebee.customer.list({ limit: 100 });
      const custList = Array.isArray(custResult?.list) ? custResult.list : [];
      totalCustomers = custList.length;
    } catch (err) {
      console.error("Chargebee customer fetch error:", err);
    }

    // Fetch verification stats from WordPress
    let verificationStats = {
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
      not_uploaded: 0,
    };

    try {
      const usersRes = await fetch(
        `${wpBaseUrl.replace(/\/$/, "")}/wp-json/custom/v1/admin/users-verification?status=`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          cache: "no-store",
        }
      );

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData?.users || [];
        verificationStats.total = users.length;

        for (const u of users) {
          const s = u.status || "not_uploaded";
          if (s === "pending") verificationStats.pending++;
          else if (s === "verified") verificationStats.verified++;
          else if (s === "rejected") verificationStats.rejected++;
          else verificationStats.not_uploaded++;
        }
      }
    } catch (err) {
      console.error("WordPress users fetch error:", err);
    }

    return NextResponse.json({
      success: true,
      reports: {
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions,
          mrr: totalMRR,
          by_plan: subscriptionsByPlan,
          recent: recentSubscriptions,
        },
        customers: {
          total: totalCustomers,
        },
        verification: verificationStats,
      },
    });
  } catch (error: any) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to generate reports." },
      { status: 500 }
    );
  }
}
