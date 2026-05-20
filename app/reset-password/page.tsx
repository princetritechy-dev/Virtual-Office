"use client";

export const dynamic = "force-dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import "./reset-password.css";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+|;:'",.<>\/\\`~]).{8,}$/;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!otp || !password || !confirmPassword) {
      setIsError(true);
      setMessage("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      setIsError(true);
      setMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API}/wp-json/custom/v1/verify-reset-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Unable to reset password.");
        return;
      }

      setMessage(data.message || "Password updated successfully.");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error("Reset password error:", error);
      setIsError(true);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="resetPage">
      <div className="resetCard">
        <h1>Reset Password</h1>
        <p>Enter the OTP sent to your email and set a new password.</p>

        <form onSubmit={handleSubmit} className="resetForm">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />

          {/* PASSWORD FIELD */}
          <div className="passwordField">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="passwordToggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.73 1.94-3.41 3.5-4.76" />
                  <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                  <path d="M1 1l22 22" />
                  <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.77 11.77 0 0 1-4.24 5.94" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="passwordField">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="passwordToggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.73 1.94-3.41 3.5-4.76" />
                  <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                  <path d="M1 1l22 22" />
                  <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.77 11.77 0 0 1-4.24 5.94" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && (
          <p className={isError ? "resetMessage error" : "resetMessage success"}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="resetPage">
            <div className="resetCard">
              <h1>Reset Password</h1>
              <p>Loading...</p>
            </div>
          </main>
        }
      >
        <ResetPasswordForm />
      </Suspense>
      <Footer />
    </>
  );
}