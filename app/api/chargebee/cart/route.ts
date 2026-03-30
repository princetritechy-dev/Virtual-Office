import { NextResponse } from "next/server";
import ChargebeeModule from "chargebee";

const Chargebee =
  (ChargebeeModule as any).default || ChargebeeModule;

const chargebee = new Chargebee({
  apiKey: process.env.CHARGEBEE_API_KEY!,
  site: process.env.CHARGEBEE_SITE!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, item_price_id, quantity } = body;

    const result = await chargebee.hosted_page
      .checkout_new_for_items({
        subscription_items: [
          {
            item_price_id,
            quantity: quantity || 1,
          },
        ],
        customer: {
          first_name: firstName || "",
          last_name: lastName || "",
          email: email || "",
        },
      })
      .request();

    return NextResponse.json({
      success: true,
      checkout_url: result.hosted_page.url,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Chargebee checkout failed",
      },
      { status: 500 }
    );
  }
}