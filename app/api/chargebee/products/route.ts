import { NextResponse } from "next/server";

export async function GET() {
  try {
    const site = process.env.CHARGEBEE_SITE;
    const apiKey = process.env.CHARGEBEE_API_KEY;

    if (!site || !apiKey) {
      return NextResponse.json(
        { success: false, message: "Missing Chargebee env variables." },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${apiKey}:`).toString("base64");

    const res = await fetch(
      `https://${site}.chargebee.com/api/v2/item_prices?limit=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Failed to fetch Chargebee products.",
          error: data,
        },
        { status: res.status }
      );
    }

    const products =
      data?.list
        ?.map((row: any) => row.item_price)
        ?.filter((itemPrice: any) => itemPrice?.item_type === "plan")
        ?.map((itemPrice: any) => ({
                id: itemPrice.id,
                name: itemPrice.name || itemPrice.external_name || itemPrice.id,
                price: itemPrice.price ?? 0,
                currency_code: itemPrice.currency_code || "",
                period_unit: itemPrice.period_unit || "",
                period: itemPrice.period || 1,
                item_id: itemPrice.item_id || "",
                description: itemPrice.description || "",
                }))

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.error("Chargebee products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch Chargebee products.",
      },
      { status: 500 }
    );
  }
}