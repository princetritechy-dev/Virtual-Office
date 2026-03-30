// pages/api/verify-registration/route.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { session_id, image_base64, liveness_passed } = req.body;

    // Check if session_id and image_base64 are provided
    if (!session_id || !image_base64) {
      return res.status(400).json({ success: false, message: "Session ID and image are required." });
    }

    // Check if liveness passed is true
    if (!liveness_passed) {
      return res.status(400).json({ success: false, message: "Liveness detection is required before verification." });
    }

    // Simulate face verification (replace with your actual verification logic)
    const face_verified = true; // Replace with actual verification logic

    if (!face_verified) {
      return res.status(400).json({ success: false, message: "Face verification failed." });
    }

    // If face is verified, return success
    return res.status(200).json({
      success: true,
      message: "Face verification successful."
    });
  }

  // Handle unsupported HTTP methods
  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
