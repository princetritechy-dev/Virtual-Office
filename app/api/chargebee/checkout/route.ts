import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, item_price_id, quantity } = body;

    if (!email || !item_price_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and item_price_id are required.",
        },
        { status: 400 }
      );
    }

    const result = await chargebee.hostedPage.checkoutNewForItems({
      subscription_items: [
        {
          item_price_id,
          quantity: quantity || 1,
        },
      ],
      customer: {
        first_name: firstName || "",
        last_name: lastName || "",
        email,
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
    });

    return NextResponse.json({
      success: true,
      checkout_url: result?.hosted_page?.url || "",
      hosted_page_id: result?.hosted_page?.id || "",
    });
  } catch (error: any) {
    console.error("Chargebee checkout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}