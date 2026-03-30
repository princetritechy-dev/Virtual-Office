import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const wpUrl = process.env.NEXT_PUBLIC_WP_API;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!wpUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { message: "Missing WooCommerce environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId, email } = body;

    if (!orderId || !email) {
      return NextResponse.json(
        { message: "Order ID and email are required." },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    // First fetch the order
    const orderRes = await fetch(`${wpUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const orderText = await orderRes.text();

    if (!orderRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch order.", details: orderText },
        { status: orderRes.status }
      );
    }

    const order = JSON.parse(orderText);

    // Security check: only owner can cancel
    if (
      !order?.billing?.email ||
      order.billing.email.toLowerCase() !== String(email).toLowerCase()
    ) {
      return NextResponse.json(
        { message: "You are not allowed to cancel this order." },
        { status: 403 }
      );
    }

    const allowedStatuses = ["pending", "processing", "on-hold"];
    if (!allowedStatuses.includes((order.status || "").toLowerCase())) {
      return NextResponse.json(
        { message: "This order cannot be cancelled." },
        { status: 400 }
      );
    }

    const updateRes = await fetch(`${wpUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled",
      }),
      cache: "no-store",
    });

    const updateText = await updateRes.text();

    if (!updateRes.ok) {
      return NextResponse.json(
        { message: "Failed to cancel order.", details: updateText },
        { status: updateRes.status }
      );
    }

    const updatedOrder = JSON.parse(updateText);

    return NextResponse.json({
      message: "Order cancelled successfully.",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Cancel order API error:", error);
    return NextResponse.json(
      {
        message: "Internal server error.",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}