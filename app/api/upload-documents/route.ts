import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid'; // for unique file names

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

    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Save file temporarily as base64
    const saveFile = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const base64String = Buffer.from(bytes).toString('base64');
      const fileName = `${safeEmail}_${label}_${uuidv4()}.pdf`;
      // Here, you can store the base64 data and file name in a database if needed
      return { base64String, fileName };
    };

    const document1Data = await saveFile(document1, "doc1");
    const document2Data = await saveFile(document2, "doc2");

    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded successfully. User verified successfully.",
        status: "verified",
        documents: {
          document_1: document1Data.base64String,
          document_2: document2Data.base64String,
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
