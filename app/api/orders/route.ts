import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const wpUrl = process.env.NEXT_PUBLIC_WP_API;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wpUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        {
          message:
            "Missing environment variables. Check NEXT_PUBLIC_WP_API, WC_CONSUMER_KEY, and WC_CONSUMER_SECRET.",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "User email is required." },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await fetch(`${wpUrl}/wp-json/wc/v3/orders?per_page=100`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("WooCommerce API error:", text);
      return NextResponse.json(
        {
          message: "Failed to fetch WooCommerce orders",
          details: text,
        },
        { status: response.status }
      );
    }

    const orders = JSON.parse(text);

    const filteredOrders = Array.isArray(orders)
      ? orders.filter((order: any) => {
          return (
            order?.billing?.email &&
            order.billing.email.toLowerCase() === email.toLowerCase()
          );
        })
      : [];

    return NextResponse.json(filteredOrders);
  } catch (error: any) {
    console.error("Orders route error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
