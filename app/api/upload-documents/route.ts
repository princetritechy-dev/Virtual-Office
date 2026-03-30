// app/api/upload-documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

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

    // Temporary directory for storing the files
    const tmpDir = '/tmp'; // Vercel's writable file system for serverless functions

    // Create the directory inside /tmp if it doesn't exist
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Function to save the file to /tmp
    const saveFile = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeEmail}_${label}_${uuidv4()}.pdf`;
      const filePath = path.join(tmpDir, fileName);

      // Save the file temporarily
      fs.writeFileSync(filePath, buffer);

      // Return the file path (it will not be accessible after execution, this is just for processing during the execution)
      return `/tmp/${fileName}`;
    };

    // Save both files temporarily
    const document1Path = await saveFile(document1, "doc1");
    const document2Path = await saveFile(document2, "doc2");

    // Return response with the file paths (note: these paths will only exist during this request's lifecycle)
    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded successfully. User verified successfully.",
        status: "verified",
        documents: {
          document_1: document1Path,
          document_2: document2Path,
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
