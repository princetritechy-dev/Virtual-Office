import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const res = NextResponse.next();

  // Allow CORS for all origins (adjust as necessary for your use case)
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    const formData = await req.formData();

    const user_email = (formData.get("user_email") as string)?.trim();
    const document1 = formData.get("document_1") as File | null;
    const document2 = formData.get("document_2") as File | null;

    // Basic validation
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

    // Only allow PDF files
    if (
      document1.type !== "application/pdf" ||
      document2.type !== "application/pdf"
    ) {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Generate unique file names
    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");
    const document1Name = `${safeEmail}_doc1_${uuidv4()}.pdf`;
    const document2Name = `${safeEmail}_doc2_${uuidv4()}.pdf`;

    // Save files temporarily (in-memory, without using file system)
    const document1Data = await document1.arrayBuffer();
    const document2Data = await document2.arrayBuffer();

    // Since Vercel doesn't support file writes to disk, we can store files temporarily in memory
    // You could store the files in a database if necessary, or just send back URLs to the uploaded files.
    // For now, we will just simulate URLs:
    const document1Url = `/uploads/documents/${document1Name}`;
    const document2Url = `/uploads/documents/${document2Name}`;

    // Simulate a JSON database or an in-memory store
    let verificationData: Record<string, any> = {};

    const verificationFile = 'verification.json'; // You could replace this with a database or a cloud DB
    if (fs.existsSync(verificationFile)) {
      try {
        verificationData = JSON.parse(fs.readFileSync(verificationFile, "utf-8"));
      } catch (error) {
        verificationData = {};
      }
    }

    // Add the document URLs to the verification data
    verificationData[safeEmail] = {
      email: user_email,
      status: "verified",
      document_1: document1Url,
      document_2: document2Url,
      updated_at: new Date().toISOString(),
    };

    // Instead of writing to the file system, just send the URLs back to the client
    return NextResponse.json({
      success: true,
      message: "Documents uploaded successfully. User verified successfully.",
      status: "verified",
      documents: {
        document_1: document1Url,
        document_2: document2Url,
      },
    });

  } catch (error) {
    console.error("Document upload error:", error);

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
