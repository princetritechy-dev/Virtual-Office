import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { session_id, image_base64, liveness_passed } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: "Session ID is required." },
        { status: 400 }
      );
    }

    if (!image_base64) {
      return NextResponse.json(
        { success: false, message: "Image is required." },
        { status: 400 }
      );
    }

    if (!liveness_passed) {
      return NextResponse.json(
        {
          success: false,
          message: "Liveness detection is required before verification.",
        },
        { status: 400 }
      );
    }

    const matches = image_base64.match(/^data:image\/(\w+);base64,(.+)$/);

    if (!matches) {
      return NextResponse.json(
        { success: false, message: "Invalid image format." },
        { status: 400 }
      );
    }

    const extension = matches[1] || "jpg";
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const uploadDir = path.join(process.cwd(), "public", "uploads", "selfie");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `selfie_${session_id}_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const relativeImageUrl = `/uploads/selfie/${fileName}`;
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const fullImageUrl = `${baseUrl}${relativeImageUrl}`;

    return NextResponse.json(
      {
        success: true,
        message: "Face verification successful and image saved.",
        image_url: fullImageUrl,
        image_base64: image_base64,
        file_name: fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during face verification:", error);

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}