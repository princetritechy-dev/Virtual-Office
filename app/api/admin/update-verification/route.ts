import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const authHeader = req.headers.get("authorization");
    const adminToken = authHeader?.replace("Bearer ", "").trim();

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        { success: false, message: "Missing WordPress config or admin token." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { user_id, status, admin_note } = body;

    if (!user_id || !status) {
      return NextResponse.json(
        { success: false, message: "user_id and status are required." },
        { status: 400 }
      );
    }

    const url = `${wpBaseUrl.replace(/\/$/, "")}/wp-json/custom/v1/admin/update-verification`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        user_id,
        status,
        admin_note: admin_note || "",
      }),
      cache: "no-store",
    });

    const text = await res.text();

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        success: false,
        message: text || "Invalid response from WordPress.",
      };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update verification.",
      },
      { status: 500 }
    );
  }
}
