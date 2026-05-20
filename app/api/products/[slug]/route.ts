import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const wpApi = process.env.WP_API_URL || process.env.NEXT_PUBLIC_WP_API;

    if (!wpApi) {
      return new Response("WP API URL is missing", { status: 500 });
    }

    const res = await fetch(
      `${wpApi}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      return new Response(text || "Failed to fetch product", {
        status: res.status,
      });
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return new Response("Product not found", { status: 404 });
    }

    return Response.json(data[0]);
  } catch (error) {
    return new Response("Server error while fetching product", {
      status: 500,
    });
  }
}
