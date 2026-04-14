"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API}/wp-json/custom/v1/send-reset-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Unable to send OTP.");
        return;
      }

      setMessage(data.message || "OTP sent successfully.");

      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1000);
    } catch (error) {
      console.error("Forgot password error:", error);
      setIsError(true);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="forgotPage">
        <div className="forgotCard">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a password reset OTP.</p>

          <form onSubmit={handleSubmit} className="forgotForm">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

          {message && (
            <p className={isError ? "forgotMessage error" : "forgotMessage success"}>
              {message}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}