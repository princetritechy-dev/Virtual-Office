import { NextRequest } from "next/server";

const wpApi = process.env.WP_API_URL || process.env.NEXT_PUBLIC_WP_API;

export async function POST(req: NextRequest) {
  try {
    if (!wpApi) {
      return new Response("WP API URL missing", { status: 500 });
    }

    const body = await req.json();
    const cartToken = req.headers.get("cart-token") || "";

    const res = await fetch(`${wpApi}/wp-json/wc/store/v1/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cart-Token": cartToken,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    const nextRes = new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
      },
    });

    const returnedCartToken = res.headers.get("Cart-Token");
    if (returnedCartToken) {
      nextRes.headers.set("Cart-Token", returnedCartToken);
    }

    return nextRes;
  } catch {
    return new Response("Checkout failed", { status: 500 });
  }
}