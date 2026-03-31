import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const user_email = (formData.get("user_email") as string)?.trim();
    const document1 = formData.get("document_1") as File | null;
    const document2 = formData.get("document_2") as File | null;

    // Check if user is logged in
    if (!user_email) {
      return NextResponse.json(
        { success: false, message: "User not logged in. Please login again." },
        { status: 401 }
      );
    }

    // Ensure both documents are uploaded
    if (!document1 || !document2) {
      return NextResponse.json(
        { success: false, message: "Both documents are required." },
        { status: 400 }
      );
    }

    // Ensure both files are PDFs
    if (
      document1.type !== "application/pdf" ||
      document2.type !== "application/pdf"
    ) {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Sanitize the email to avoid invalid characters in filenames
    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Use the /tmp directory for Vercel's temporary storage
    const uploadDir = "/tmp/uploads/documents"; // Temporary storage path

    // Ensure the directory exists in the temporary storage
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Function to save a file to /tmp
    const saveFile = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeEmail}_${label}_${uuidv4()}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // Return the relative URL of the file for access
      return `/uploads/documents/${fileName}`;
    };

    // Save both documents to the temporary directory
    const document1Url = await saveFile(document1, "doc1");
    const document2Url = await saveFile(document2, "doc2");

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
