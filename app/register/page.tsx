"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API_URL}/register-temp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();
      console.log("Register response:", data);

      if (!res.ok || !data.success) {
        setIsError(true);
        setMessage(data.message || "Registration failed");
        return;
      }

      setMessage("Registration successful. Proceeding to face verification...");

      if (data.session_id) {
        setTimeout(() => {
          router.push(`/face-verification?session_id=${data.session_id}`);
        }, 1200);
      } else {
        setIsError(true);
        setMessage("Session ID is missing.");
      }
    } catch (error) {
      console.error("Register error:", error);
      setIsError(true);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="wrapper">
        <div className="card">
          <h1 className="title">Register</h1>
          <p className="subtitle">Create your account</p>

          <form onSubmit={handleRegister} className="form">
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              className="input"
              required
            />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="input"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="input"
              required
            />

            <div className="passwordField">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="input passwordInput"
                required
              />

              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="button" disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>
          </form>

          {message && (
            <p className={`message ${isError ? "error" : "success"}`}>
              {message}
            </p>
          )}

          <p className="bottomText">
            Already have an account?{" "}
            <a href="/login" className="link">
              Login
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}