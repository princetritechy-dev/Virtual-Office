"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./face-verification.css";

export default function FaceVerificationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session_id = urlParams.get("session_id");

    if (session_id) {
      setSessionId(session_id);
      console.log("Session ID:", session_id);
    } else {
      alert("Session ID is missing");
    }
  }, []);

  const startFaceVerification = async () => {
    if (!sessionId) {
      alert("Session ID is missing.");
      return;
    }

    setLoading(true);
    setVerificationFailed(false);
    setVerificationSuccess(false);
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCaptureEnabled(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access the camera. Please grant camera permissions.");
    } finally {
      setLoading(false);
    }
  };

  const captureFaceImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/jpeg");
    setImageBase64(base64Image);

    const stream = videoRef.current.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setCaptureEnabled(false);
    sendVerificationData(base64Image);
  };

const sendVerificationData = async (base64Image: string) => {
  if (!sessionId) {
    alert("Session ID is missing.");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_WP_API_URL}/verify-face`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          image_base64: base64Image,
          liveness_passed: true,
        }),
      }
    );

    const data = await res.json();
    console.log("Verify response:", data);

    if (res.ok && data.success) {
      setVerificationSuccess(true);
      setVerificationFailed(false);
      setMessage(data.message || "Face verification successful.");

      const savedImage = data.image_url || base64Image;
      localStorage.setItem("face_image_url", savedImage);

      console.log("Saved Image:", savedImage);
      console.log(
        "LocalStorage Check:",
        localStorage.getItem("face_image_url")
      );

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } else {
      setVerificationSuccess(false);
      setVerificationFailed(true);
      setMessage(data.message || "Face verification failed.");
    }
  } catch (error) {
    console.error("Verify error:", error);
    setVerificationSuccess(false);
    setVerificationFailed(true);
    setMessage("Something went wrong during verification.");
  } finally {
    setLoading(false);
  }
};

  const handleRetry = () => {
    setVerificationFailed(false);
    setVerificationSuccess(false);
    setImageBase64(null);
    setCaptureEnabled(false);
    setMessage("");
    startFaceVerification();
  };

  return (
    <div className="face-verification">
      <h1>Face Verification</h1>
      <p>Please complete the face verification to proceed with your registration.</p>

      <video
        ref={videoRef}
        className="video-element"
        autoPlay
        muted
        playsInline
      />

      <div className="button-container">
        <button onClick={startFaceVerification} disabled={loading}>
          {loading ? "Starting Camera..." : "Start Face Verification"}
        </button>

        <button onClick={captureFaceImage} disabled={!captureEnabled || loading}>
          Capture
        </button>
      </div>

      {message && (
        <p className={verificationFailed ? "verify-error" : "verify-success"}>
          {message}
        </p>
      )}

      {verificationFailed && (
        <div className="retry-wrap">
          <button onClick={handleRetry}>Retry</button>
        </div>
      )}

      {imageBase64 && (
        <div style={{ marginTop: "20px" }}>
          <img
            src={imageBase64}
            alt="Captured face"
            style={{ width: "180px", borderRadius: "12px" }}
          />
        </div>
      )}
    </div>
  );
}