import { NextRequest } from "next/server";

const wpApi = process.env.WP_API_URL || process.env.NEXT_PUBLIC_WP_API;

export async function POST(req: NextRequest) {
  try {
    if (!wpApi) {
      return new Response("WP API URL missing", { status: 500 });
    }

    const body = await req.json();
    const cartToken = req.headers.get("cart-token") || "";

    const res = await fetch(`${wpApi}/wp-json/wc/store/v1/cart/remove-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cart-Token": cartToken,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const nextRes = Response.json(data, { status: res.status });

    const returnedCartToken = res.headers.get("Cart-Token");
    if (returnedCartToken) {
      nextRes.headers.set("Cart-Token", returnedCartToken);
    }

    return nextRes;
  } catch {
    return new Response("Failed to remove item", { status: 500 });
  }
}