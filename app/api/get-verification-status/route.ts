import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
        },
        { status: 200 }
      );
    }

    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");
    const verificationFile = path.join(process.cwd(), "data", "verification.json");

    if (!fs.existsSync(verificationFile)) {
      return NextResponse.json({
        success: true,
        status: "not_uploaded",
        documents: {
          document_1: "",
          document_2: "",
        },
      });
    }

    let verificationData: Record<string, any> = {};

    try {
      verificationData = JSON.parse(fs.readFileSync(verificationFile, "utf-8"));
    } catch {
      verificationData = {};
    }

    const userRecord = verificationData[safeEmail];

    if (!userRecord) {
      return NextResponse.json({
        success: true,
        status: "not_uploaded",
        documents: {
          document_1: "",
          document_2: "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: userRecord.status || "not_uploaded",
      documents: {
        document_1: userRecord.document_1 || "",
        document_2: userRecord.document_2 || "",
      },
    });
  } catch (error) {
    console.error("Verification status error:", error);

    return NextResponse.json(
      {
        success: false,
        status: "error",
        documents: {
          document_1: "",
          document_2: "",
        },
      },
      { status: 500 }
    );
  }
}