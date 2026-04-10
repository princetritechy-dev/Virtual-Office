import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized - Token missing" },
        { status: 401 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const wpRes = await fetch(
      `${process.env.NEXT_PUBLIC_WP_API}/wp-json/custom/v1/change-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
        cache: "no-store",
      }
    );

    const text = await wpRes.text();

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || "Invalid response from WordPress" };
    }

    if (!wpRes.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to change password" },
        { status: wpRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return NextResponse.json(
      { message: "Server error while changing password." },
      { status: 500 }
    );
  }
}
