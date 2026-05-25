import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

function makeSafeEmail(email: string) {
  return email.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(req: NextRequest) {
  try {
    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const authHeader = req.headers.get("authorization");
    const adminToken = authHeader?.replace("Bearer ", "").trim();

    const region = process.env.AWS_REGION;
    const bucketName = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // console.log("WP:", wpBaseUrl ? "FOUND" : "MISSING");
    // console.log("Admin token:", adminToken ? "FOUND" : "MISSING");
    // console.log("AWS_REGION:", region);
    // console.log("AWS_BUCKET:", bucketName);
    // console.log("AWS_KEY:", accessKeyId ? "FOUND" : "MISSING");
    // console.log("AWS_SECRET:", secretAccessKey ? "FOUND" : "MISSING");

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        { success: false, message: "Missing WordPress config or admin token." },
        { status: 500 }
      );
    }

    if (!region || !bucketName || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { success: false, message: "AWS configuration missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const wpUrl = `${wpBaseUrl.replace(
      /\/$/,
      ""
    )}/wp-json/custom/v1/admin/users-verification?status=${encodeURIComponent(
      status
    )}&search=${encodeURIComponent(search)}`;

    const wpRes = await fetch(wpUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      cache: "no-store",
    });

    const wpText = await wpRes.text();

    let wpData: any = {};
    try {
      wpData = wpText ? JSON.parse(wpText) : {};
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid WordPress response.",
          raw: wpText,
        },
        { status: 500 }
      );
    }

    if (!wpRes.ok) {
      return NextResponse.json(wpData, { status: wpRes.status });
    }

    const wpUsers = Array.isArray(wpData?.users)
      ? wpData.users
      : Array.isArray(wpData?.data)
      ? wpData.data
      : Array.isArray(wpData)
      ? wpData
      : [];

    console.log("WP users count:", wpUsers.length);

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const s3Res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "verification-documents/",
      })
    );

    const s3Keys = (s3Res.Contents || [])
      .map((item) => item.Key)
      .filter(Boolean) as string[];

    console.log("S3 keys count:", s3Keys.length);

    const users = wpUsers.map((user: any) => {
      const email = user.email || user.user_email || "";
      const userSafeEmail = makeSafeEmail(email);

      const userKeys = s3Keys.filter((key) =>
        key.startsWith(`verification-documents/${userSafeEmail}/`)
      );

      const doc1Key =
        userKeys.find((key) => key.split("/").pop()?.startsWith("doc1_")) || "";

      const doc2Key =
        userKeys.find((key) => key.split("/").pop()?.startsWith("doc2_")) || "";

      return {
        ...user,
        id: user.id || user.ID || email,
        name: user.name || user.display_name || "No Name",
        email,
        status: user.status || user.verification_status || "not_uploaded",
        admin_note: user.admin_note || "",
        documents: {
          document_1: doc1Key,
          document_2: doc2Key,
          document_1_key: doc1Key,
          document_2_key: doc2Key,
        },
      };
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error("Admin users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch users.",
        error_name: error?.name || "",
      },
      { status: 500 }
    );
  }
}