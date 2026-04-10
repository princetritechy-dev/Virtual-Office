import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user_email = req.nextUrl.searchParams.get("user_email")?.trim();

    if (!user_email) {
      return NextResponse.json(
        {
          success: false,
          status: "not_uploaded",
          documents: {
            document_1: "",
            document_2: "",
          },
          admin_note: "",
        },
        { status: 200 }
      );
    }

    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;

    if (!wpBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "WordPress API URL missing.",
        },
        { status: 500 }
      );
    }

    const statusUrl = `${wpBaseUrl.replace(
      /\/$/,
      ""
    )}/wp-json/custom/v1/get-verification-status?user_email=${encodeURIComponent(
      user_email
    )}`;

    const res = await fetch(statusUrl, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          status: "not_uploaded",
          documents: {
            document_1: "",
            document_2: "",
          },
          admin_note: "",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: data?.status || "not_uploaded",
        documents: {
          document_1: data?.documents?.document_1 || "",
          document_2: data?.documents?.document_2 || "",
        },
        admin_note: data?.admin_note || "",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification status fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        status: "not_uploaded",
        documents: {
          document_1: "",
          document_2: "",
        },
        admin_note: "",
      },
      { status: 200 }
    );
  }
}
