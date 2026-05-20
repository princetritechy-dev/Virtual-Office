export async function GET() {
  try {
    const wpApi = process.env.NEXT_PUBLIC_WP_API;

    if (!wpApi) {
      return new Response("WP API URL is missing", { status: 500 });
    }

    const res = await fetch(`${wpApi}/wp-json/wc/store/v1/products`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(`Failed to fetch products: ${text}`, {
        status: res.status,
      });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return new Response("Server error while fetching products", {
      status: 500,
    });
  }
}
