import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const authHeader = req.headers.get("authorization");
    const adminToken = authHeader?.replace("Bearer ", "").trim();
    const { searchParams } = new URL(req.url);
    const documentUrl = searchParams.get("url")?.trim();

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        { success: false, message: "Missing WordPress config or admin token." },
        { status: 500 }
      );
    }

    if (!documentUrl) {
      return NextResponse.json(
        { success: false, message: "Document URL is required." },
        { status: 400 }
      );
    }

    const meRes = await fetch(
      `${wpBaseUrl.replace(/\/$/, "")}/wp-json/wp/v2/users/me?context=edit`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        cache: "no-store",
      }
    );

    if (!meRes.ok) {
      return NextResponse.json(
        { success: false, message: "Unauthorized admin access." },
        { status: 401 }
      );
    }

    const meData = await meRes.json();
    const roles: string[] = meData?.roles || [];
    const isAdmin = roles.includes("administrator");

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only admin can access documents." },
        { status: 403 }
      );
    }

    const normalizedWpBase = wpBaseUrl.replace(/\/$/, "");
    const allowedHost = new URL(normalizedWpBase).host;
    const requestedHost = new URL(documentUrl).host;

    if (allowedHost !== requestedHost) {
      return NextResponse.json(
        { success: false, message: "Invalid document host." },
        { status: 403 }
      );
    }

    const fileRes = await fetch(documentUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      cache: "no-store",
    });

    if (!fileRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch protected document." },
        { status: fileRes.status }
      );
    }

    const contentType = fileRes.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await fileRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": 'inline; filename="verification-document.pdf"',
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to view document.",
      },
      { status: 500 }
    );
  }
}