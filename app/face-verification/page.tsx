"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
import "./face-verification.css";
import Header from "../components/header";
import Footer from "../components/footer";

export default function FaceVerificationPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
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

  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true);

        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

        setVerificationFailed(false);
        setMessage("Face detection is ready. Please start verification.");
      } catch (error) {
        console.error("Face API model load error:", error);
        setVerificationFailed(true);
        setMessage("Unable to load face detection models.");
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, []);

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCaptureEnabled(false);
    setCameraStarted(false);
  };

  const startFaceVerification = async () => {
    if (!sessionId) {
      alert("Session ID is missing.");
      return;
    }

    if (cameraStarted || modelsLoading) {
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
        setCameraStarted(true);
        setMessage("Make sure only one face is clearly visible, then capture.");
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access the camera. Please grant camera permissions.");
      setCameraStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const validateCapturedImage = async (canvas: HTMLCanvasElement) => {
    const detections = await faceapi
      .detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks();

    if (!detections || detections.length === 0) {
      return {
        valid: false,
        message:
          "No clear face detected. Please keep your face visible and try again.",
      };
    }

    if (detections.length > 1) {
      return {
        valid: false,
        message:
          "Multiple faces detected. Please ensure only one face is in the frame.",
      };
    }

    const detection = detections[0];
    const box = detection.detection.box;
    const score = detection.detection.score;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const minFaceWidth = canvasWidth * 0.18;
    const minFaceHeight = canvasHeight * 0.18;

    if (score < 0.6) {
      return {
        valid: false,
        message:
          "Face is not clear enough. Please improve lighting and try again.",
      };
    }

    if (box.width < minFaceWidth || box.height < minFaceHeight) {
      return {
        valid: false,
        message:
          "Face is too far from the camera. Please move closer and try again.",
      };
    }

    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;

    const isCenteredHorizontally =
      faceCenterX > canvasWidth * 0.25 && faceCenterX < canvasWidth * 0.75;
    const isCenteredVertically =
      faceCenterY > canvasHeight * 0.2 && faceCenterY < canvasHeight * 0.8;

    if (!isCenteredHorizontally || !isCenteredVertically) {
      return {
        valid: false,
        message: "Please keep your face centered in the frame.",
      };
    }

    return {
      valid: true,
      message: "Valid face detected.",
    };
  };

  const captureFaceImage = async () => {
    if (!videoRef.current || !captureEnabled || loading) return;

    setLoading(true);
    setMessage("");
    setVerificationFailed(false);
    setVerificationSuccess(false);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setVerificationFailed(true);
        setMessage("Unable to process captured image.");
        setLoading(false);
        return;
      }

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const validation = await validateCapturedImage(canvas);

      if (!validation.valid) {
        setVerificationFailed(true);
        setVerificationSuccess(false);
        setMessage(validation.message);
        return;
      }

      const base64Image = canvas.toDataURL("image/jpeg", 0.9);
      setImageBase64(base64Image);

      stopCamera();
      await sendVerificationData(base64Image);
    } catch (error) {
      console.error("Capture validation error:", error);
      setVerificationFailed(true);
      setVerificationSuccess(false);
      setMessage("Unable to validate face properly. Please try again.");
    } finally {
      setLoading(false);
    }
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
        setMessage("");

        const savedImage = data.image_url || base64Image;
        localStorage.setItem("face_image_url", savedImage);

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
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
    stopCamera();
    setVerificationFailed(false);
    setVerificationSuccess(false);
    setImageBase64(null);
    setCaptureEnabled(false);
    setCameraStarted(false);
    setMessage("");
    startFaceVerification();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <main>
      <Header />
      <div className="face-verification">
        <div className="fc-data">
          {verificationSuccess ? (
            <div className="verify-success-box">
              <div className="success-icon">✔</div>
              <h2>Account Created Successfully</h2>
              <p>Your face has been verified. Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <h1>Face Verification</h1>
              <p>
                Please complete the face verification to proceed with your
                registration.
              </p>

              {message && (
                <p
                  className={
                    verificationFailed ? "verify-error" : "verify-success"
                  }
                >
                  {message}
                </p>
              )}

              <video
                ref={videoRef}
                className="video-element"
                autoPlay
                muted
                playsInline
              />

              <div className="button-container">
                <button
                  onClick={startFaceVerification}
                  disabled={loading || cameraStarted || modelsLoading}
                >
                  {modelsLoading
                    ? "Preparing Face Detection..."
                    : loading && !cameraStarted
                    ? "Starting Camera..."
                    : cameraStarted
                    ? "Camera Started"
                    : "Start Face Verification"}
                </button>

                <button
                  onClick={captureFaceImage}
                  disabled={!captureEnabled || loading || modelsLoading}
                >
                  {loading ? "Checking Face..." : "Capture"}
                </button>
              </div>

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
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}