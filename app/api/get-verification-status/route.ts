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

    // Sanitize email for filename
    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Use the /tmp directory for temporary storage
    const uploadDir = "/tmp/uploads/documents"; // Temporary storage path

    // Ensure the directory exists in the temporary storage
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Function to save a file to /tmp (temporary storage)
    const saveFile = async (file: File, label: string) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeEmail}_${label}.pdf`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // Return the relative URL of the file for access
      return `/tmp/uploads/documents/${fileName}`;
    };

    // Save both documents
    const document1Url = await saveFile(document1, "doc1");
    const document2Url = await saveFile(document2, "doc2");

    // Update verification status in verification.json
    const verificationFile = path.join(process.cwd(), "data", "verification.json");
    let verificationData: Record<string, any> = {};

    // Read existing data from verification.json
    if (fs.existsSync(verificationFile)) {
      verificationData = JSON.parse(fs.readFileSync(verificationFile, "utf-8"));
    }

    // Mark the user as verified and store documents
    verificationData[safeEmail] = {
      status: "verified",
      document_1: document1Url,
      document_2: document2Url,
    };

    // Write the updated data back to verification.json
    fs.writeFileSync(verificationFile, JSON.stringify(verificationData, null, 2));

    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded successfully and user verified.",
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
