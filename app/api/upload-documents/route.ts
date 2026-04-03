import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

<<<<<<< HEAD
    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Store files in /tmp directory for Vercel
    const uploadDir = path.join("/tmp", "documents");

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
=======
    if (document1.size > MAX_FILE_SIZE || document2.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Files must be less than 5MB." },
        { status: 400 }
      );
>>>>>>> 0e31287 (Updated Code)
    }

    const wpBaseUrl = process.env.NEXT_PUBLIC_WP_API;
    const adminToken = process.env.WP_ADMIN_JWT;

    if (!wpBaseUrl || !adminToken) {
      return NextResponse.json(
        {
          success: false,
          message: "WordPress API URL or admin token is missing.",
        },
        { status: 500 }
      );
    }

<<<<<<< HEAD
      // Return the relative URL of the file for access
      return `/tmp/documents/${fileName}`;
=======
    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");
    const wpApiUrl = `${wpBaseUrl.replace(/\/$/, "")}/wp-json/wp/v2/media`;

    const uploadDocument = async (file: File, fileName: string) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file, fileName);

      const res = await fetch(wpApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: uploadFormData,
      });

      const contentType = res.headers.get("content-type") || "";
      let responseData: any = null;

      try {
        if (contentType.includes("application/json")) {
          responseData = await res.json();
        } else {
          responseData = await res.text();
        }
      } catch {
        responseData = null;
      }

      if (!res.ok) {
        console.error("WordPress media upload failed:", responseData);
        throw new Error(
          typeof responseData === "string"
            ? responseData
            : responseData?.message || `Failed to upload document (${res.status})`
        );
      }

      return responseData;
>>>>>>> 0e31287 (Updated Code)
    };

    const document1Response = await uploadDocument(
      document1,
      `${safeEmail}_doc1_${uuidv4()}.pdf`
    );

    const document2Response = await uploadDocument(
      document2,
      `${safeEmail}_doc2_${uuidv4()}.pdf`
    );

    const saveDocsUrl = `${wpBaseUrl.replace(/\/$/, "")}/wp-json/custom/v1/save-verification-docs`;

    const saveDocsRes = await fetch(saveDocsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_email,
        document_1: document1Response?.source_url || "",
        document_2: document2Response?.source_url || "",
      }),
    });

    const saveDocsData = await saveDocsRes.json();

    if (!saveDocsRes.ok || !saveDocsData.success) {
      throw new Error(
        saveDocsData?.message || "Failed to save verification documents."
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded successfully. Waiting for admin approval.",
        status: "pending",
        documents: {
          document_1: document1Response?.source_url || "",
          document_2: document2Response?.source_url || "",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Document upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}