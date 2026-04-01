import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Temporary file storage directory for Vercel's serverless environment
const TMP_DIR = '/tmp';

export async function POST(req: NextRequest) {
  try {
    // Parse incoming form data
    const formData = await req.formData();
    const userEmail = formData.get("user_email");

    // Ensure the user email is a string and trim it
    if (typeof userEmail === "string") {
      const trimmedEmail = userEmail.trim(); // Now we have trimmedEmail properly assigned
    } else {
      return NextResponse.json({ success: false, message: "Invalid user email" }, { status: 400 });
    }

    const document1 = formData.get("document_1") as File | null;
    const document2 = formData.get("document_2") as File | null;

    // Ensure all required fields are present
    if (!userEmail || !document1 || !document2) {
      return NextResponse.json({ success: false, message: "User email and both documents are required." }, { status: 400 });
    }

    // Validate file types
    if (document1.type !== "application/pdf" || document2.type !== "application/pdf") {
      return NextResponse.json({ success: false, message: "Only PDF files are allowed." }, { status: 400 });
    }

    // Ensure TMP_DIR exists in the Vercel serverless environment
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    // Function to save file temporarily in /tmp directory
    const saveFileTemp = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${trimmedEmail}_${label}_${uuidv4()}.pdf`;
      const filePath = path.join(TMP_DIR, fileName);

      // Write the file to /tmp
      fs.writeFileSync(filePath, buffer);

      // Return the temporary file path
      return `/tmp/${fileName}`;
    };

    // Save both documents to /tmp
    const document1Path = await saveFileTemp(document1, "doc1");
    const document2Path = await saveFileTemp(document2, "doc2");

    return NextResponse.json({
      success: true,
      message: "Documents uploaded successfully.",
      status: "verified", // Status can be customized as per your requirements
      documents: {
        document_1: document1Path,  // Return the temporary path
        document_2: document2Path,  // Return the temporary path
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
