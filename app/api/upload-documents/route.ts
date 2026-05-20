import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const user_email = (formData.get("user_email") as string)?.trim();
    const document1 = formData.get("document_1") as File | null;
    const document2 = formData.get("document_2") as File | null;

    if (!user_email) {
      return NextResponse.json(
        {
          success: false,
          message: "User not logged in.",
        },
        { status: 401 }
      );
    }

    if (!document1 || !document2) {
      return NextResponse.json(
        {
          success: false,
          message: "Both documents are required.",
        },
        { status: 400 }
      );
    }

    if (
      document1.type !== "application/pdf" ||
      document2.type !== "application/pdf"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    if (
      document1.size > MAX_FILE_SIZE ||
      document2.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Files must be less than 5MB.",
        },
        { status: 400 }
      );
    }

    if (!region || !bucketName) {
      return NextResponse.json(
        {
          success: false,
          message: "AWS configuration missing.",
        },
        { status: 500 }
      );
    }

    const safeEmail = user_email.replace(/[^a-zA-Z0-9._-]/g, "_");

    const uploadToS3 = async (
      file: File,
      fileName: string
    ) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const key = `verification-documents/${safeEmail}/${fileName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: "application/pdf",
        })
      );

      return {
        key,
        url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
      };
    };

    const doc1 = await uploadToS3(
      document1,
      `doc1_${uuidv4()}.pdf`
    );

    const doc2 = await uploadToS3(
      document2,
      `doc2_${uuidv4()}.pdf`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded to AWS successfully.",
        documents: {
          document_1: doc1.url,
          document_2: doc2.url,
          document_1_key: doc1.key,
          document_2_key: doc2.key,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}