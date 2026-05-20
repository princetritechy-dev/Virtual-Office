import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  try {
    const region = process.env.AWS_REGION;
    const bucketName = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !bucketName || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { success: false, message: "AWS configuration missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { success: false, message: "Document key missing." },
        { status: 400 }
      );
    }

    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    if (!response.Body) {
      return NextResponse.json(
        { success: false, message: "Document not found." },
        { status: 404 }
      );
    }

    const webStream = Readable.toWeb(response.Body as Readable);

    return new NextResponse(webStream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "application/pdf",
        "Content-Disposition": 'inline; filename="document.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("VIEW DOCUMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to view document.",
      },
      { status: 500 }
    );
  }
}