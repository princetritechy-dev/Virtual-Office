"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import "./login.css";

export default function LoginPage() {

  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
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

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API}/wp-json/jwt-auth/v1/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.token) {
        setIsError(true);
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("wp_token", data.token);
      localStorage.setItem("wp_user", JSON.stringify(data));
      localStorage.setItem("user_id", String(data.user_id));

      router.push("/dashboard");

    } catch (error) {

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

          <h1 className="title">Login</h1>
          <p className="subtitle">Access your account</p>

          <form onSubmit={handleLogin} className="form">

            <input
              type="text"
              name="username"
              placeholder="Username or email"
              value={form.username}
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

            <button
              type="submit"
              className="button"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Login"}
            </button>

          </form>

          {message && (
            <p
              className={`message ${isError ? "error" : "success"}`}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}

          <p className="bottomText">
            Don’t have an account?{" "}
            <a href="/register" className="link">
              Register
            </a>
          </p>

        </div>

      </main>

      <Footer />
    </>
  );
}