// app/api/verify-registration/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { session_id, image_base64, liveness_passed } = await req.json();

  // Check if session_id and image_base64 are provided
  if (!session_id || !image_base64) {
    return NextResponse.json({ success: false, message: "Session ID and image are required." }, { status: 400 });
  }

  // Check if liveness passed is true
  if (!liveness_passed) {
    return NextResponse.json({ success: false, message: "Liveness detection is required before verification." }, { status: 400 });
  }

  // Simulate face verification (replace with your actual verification logic)
  const face_verified = true; // Replace with actual verification logic

  if (!face_verified) {
    return NextResponse.json({ success: false, message: "Face verification failed." }, { status: 400 });
  }

  // If face is verified, return success
  return NextResponse.json({
    success: true,
    message: "Face verification successful."
  });
}
