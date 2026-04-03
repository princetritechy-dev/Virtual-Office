"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header";
import Footer from "../../components/footer";
import "./admin-login.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API}/wp-json/jwt-auth/v1/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.token) {
        setMessage(data?.message || "Invalid login credentials.");
        return;
      }

      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`,
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
          cache: "no-store",
        }
      );

      const userData = await userRes.json();

      if (!userRes.ok) {
        setMessage("Unable to verify admin account.");
        return;
      }

      const roles: string[] = userData?.roles || [];
      const isAdmin = roles.includes("administrator");

      if (!isAdmin) {
        setMessage("You are not allowed to access admin dashboard.");
        return;
      }

      localStorage.setItem("wp_admin_token", data.token);
      localStorage.setItem("wp_admin_data", JSON.stringify(userData));

      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header adminMode={true} />

      <main className="adminLoginPage">
        <div className="adminLoginCard">
          <h1>Admin Login</h1>
          <p>Sign in to access the admin dashboard</p>

          <form onSubmit={handleLogin} className="adminLoginForm">
            <input
              type="text"
              placeholder="Admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="adminLoginInput"
              required
            />

            <div className="adminPasswordField">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="adminLoginInput adminPasswordInput"
                required
              />

              <button
                type="button"
                className="adminPasswordToggle"
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
              className="adminLoginButton"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          {message && <p className="adminLoginMessage">{message}</p>}
        </div>
      </main>

      <Footer />
    </>
  );
}