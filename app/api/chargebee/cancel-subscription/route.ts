import { NextRequest, NextResponse } from "next/server";
import Chargebee from "chargebee";

const chargebee = new Chargebee({
  site: process.env.CHARGEBEE_SITE as string,
  apiKey: process.env.CHARGEBEE_API_KEY as string,
});

type CancelBody = {
  subscription_id: string;
  cancel_option?: "immediately" | "end_of_term";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CancelBody;

    const subscriptionId = body.subscription_id?.trim();
    const cancelOption = body.cancel_option || "end_of_term";

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, message: "subscription_id is required." },
        { status: 400 }
      );
    }

    if (!["immediately", "end_of_term"].includes(cancelOption)) {
      return NextResponse.json(
        { success: false, message: "Invalid cancel_option." },
        { status: 400 }
      );
    }

    const result = await chargebee.subscription.cancelForItems(subscriptionId, {
      cancel_option: cancelOption,
    });

    return NextResponse.json({
      success: true,
      message:
        cancelOption === "immediately"
          ? "Subscription cancelled successfully."
          : "Subscription will be cancelled at end of billing term.",
      subscription: result?.subscription || null,
    });
  } catch (error: any) {
    console.error("Chargebee cancel error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to cancel subscription.",
      },
      { status: 500 }
    );
  }
}