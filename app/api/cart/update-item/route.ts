import { NextRequest } from "next/server";

const wpApi = process.env.WP_API_URL || process.env.NEXT_PUBLIC_WP_API;

export async function POST(req: NextRequest) {
  try {
    if (!wpApi) {
      return new Response("WP API URL missing", { status: 500 });
    }

    const body = await req.json();
    const cartToken = req.headers.get("cart-token") || "";

    const res = await fetch(`${wpApi}/wp-json/wc/store/v1/cart/update-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cartToken ? { "Cart-Token": cartToken } : {}),
      },
      body: JSON.stringify({
        key: body.key,
        quantity: body.quantity,
      }),
      cache: "no-store",
    });

    const data = await res.json();
    const nextRes = Response.json(data, { status: res.status });

    const returnedCartToken = res.headers.get("Cart-Token");
    if (returnedCartToken) {
      nextRes.headers.set("Cart-Token", returnedCartToken);
    }

    return nextRes;
  } catch (error) {
    console.error("Failed to update item:", error);
    return new Response("Failed to update item", { status: 500 });
  }
}