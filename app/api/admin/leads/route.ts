import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const authHeader = req.headers.get("authorization");
    const adminToken = authHeader?.replace("Bearer ", "").trim();

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        { success: false, message: "Missing config." },
        { status: 500 }
      );
    }

    // Verify admin
    const meRes = await fetch(
      `${wpBaseUrl.replace(/\/$/, "")}/wp-json/wp/v2/users/me?context=edit`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        cache: "no-store",
      }
    );

    if (!meRes.ok) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const meData = await meRes.json();
    if (!meData?.roles?.includes("administrator")) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    // Try fetching leads from WordPress custom endpoint
    let leads: any[] = [];

    try {
      const leadsUrl = `${wpBaseUrl.replace(/\/$/, "")}/wp-json/custom/v1/admin/leads?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;

      const leadsRes = await fetch(leadsUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
        cache: "no-store",
      });

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        leads = leadsData?.leads || leadsData?.data || [];
      }
    } catch {
      // If custom endpoint doesn't exist, try Contact Form 7 entries or similar
      try {
        const cfRes = await fetch(
          `${wpBaseUrl.replace(/\/$/, "")}/wp-json/contact-form-7/v1/contact-forms`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
            cache: "no-store",
          }
        );

        if (cfRes.ok) {
          // CF7 doesn't store submissions natively — leads will come from custom endpoint
          console.log("CF7 forms found but no submission storage.");
        }
      } catch {}
    }

    // If WordPress doesn't have leads endpoint, attempt to read from
    // wp_temp_face_registrations or wp_options as fallback
    // The main leads source should be configured via the WP custom endpoint

    return NextResponse.json({
      success: true,
      leads,
    });
  } catch (error: any) {
    console.error("Admin leads error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch leads." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const authHeader = req.headers.get("authorization");
    const adminToken = authHeader?.replace("Bearer ", "").trim();

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        { success: false, message: "Missing config." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { lead_id, status, admin_note } = body;

    if (!lead_id || !status) {
      return NextResponse.json(
        { success: false, message: "lead_id and status are required." },
        { status: 400 }
      );
    }

    const updateUrl = `${wpBaseUrl.replace(/\/$/, "")}/wp-json/custom/v1/admin/update-lead`;

    const updateRes = await fetch(updateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ lead_id, status, admin_note: admin_note || "" }),
      cache: "no-store",
    });

    const data = updateRes.ok ? await updateRes.json() : {};

    return NextResponse.json(data, { status: updateRes.status });
  } catch (error: any) {
    console.error("Lead update error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update lead." },
      { status: 500 }
    );
  }
}
