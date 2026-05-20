import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    const customerResult = await chargebee.customer.list({
      limit: 100,
      email: {
        is: email,
      },
    });

    const customerList = Array.isArray(customerResult?.list)
      ? customerResult.list
      : [];

    if (customerList.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
      });
    }

    // Aggregate subscriptions across ALL matching Chargebee customers
    // (a user may have multiple customer records from different checkouts)
    const allOrders: any[] = [];

    for (const customerEntry of customerList) {
      const customer = customerEntry?.customer;
      const customerId = customer?.id;

      if (!customerId) continue;

      const subscriptionResult = await chargebee.subscription.list({
        limit: 100,
        customer_id: {
          is: customerId,
        },
      });

      const subscriptionList = Array.isArray(subscriptionResult?.list)
        ? subscriptionResult.list
        : [];

      for (const entry of subscriptionList) {
        const subscription: any = entry?.subscription || {};
        const item: any =
          Array.isArray(subscription.subscription_items) &&
          subscription.subscription_items.length > 0
            ? subscription.subscription_items[0]
            : {};

        allOrders.push({
          subscription_id: subscription.id || "",
          customer_id: subscription.customer_id || customerId,
          customer_email: customer?.email || email,
          status: subscription.status || "",
          plan_name: item?.item_price_id || subscription?.plan_id || "Plan",
          item_price_id: item?.item_price_id || "",
          amount: item?.unit_price ?? subscription?.mrr ?? 0,
          currency_code: subscription?.currency_code || "GBP",
          billing_period:
            item?.billing_period || subscription?.billing_period || null,
          billing_period_unit:
            item?.billing_period_unit ||
            subscription?.billing_period_unit ||
            "",
          next_billing_at: subscription?.next_billing_at || null,
          created_at: subscription?.created_at || null,
        });
      }
    }

    const orders = allOrders.sort(
      (a, b) => (b.created_at || 0) - (a.created_at || 0)
    );

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("Chargebee orders fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch Chargebee orders.",
      },
      { status: 500 }
    );
  }
}