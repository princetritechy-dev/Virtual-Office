import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const user_email = (formData.get("user_email") as string)?.trim();
    const document1 = formData.get("document_1") as File | null;
    const document2 = formData.get("document_2") as File | null;

    if (!user_email) {
      return NextResponse.json(
        { success: false, message: "User not logged in. Please login again." },
        { status: 401 }
      );
    }

    if (!document1 || !document2) {
      return NextResponse.json(
        { success: false, message: "Both documents are required." },
        { status: 400 }
      );
    }

    if (
      document1.type !== "application/pdf" ||
      document2.type !== "application/pdf"
    ) {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    const dataDir = path.join(process.cwd(), "data");
    const verificationFile = path.join(dataDir, "verification.json");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");

    const saveFile = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeEmail}_${label}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return `/uploads/documents/${fileName}`;
    };

    const document1Url = await saveFile(document1, "doc1");
    const document2Url = await saveFile(document2, "doc2");

    let verificationData: Record<string, any> = {};

    if (fs.existsSync(verificationFile)) {
      try {
        verificationData = JSON.parse(fs.readFileSync(verificationFile, "utf-8"));
      } catch {
        verificationData = {};
      }
    }

    verificationData[safeEmail] = {
      email: user_email,
      status: "verified",
      document_1: document1Url,
      document_2: document2Url,
      updated_at: new Date().toISOString(),
    };

    fs.writeFileSync(
      verificationFile,
      JSON.stringify(verificationData, null, 2),
      "utf-8"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded successfully. User verified successfully.",
        status: "verified",
        documents: {
          document_1: document1Url,
          document_2: document2Url,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Document upload error:", error);

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}