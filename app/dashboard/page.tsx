"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";
import "./dashboard.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState("loading");
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("wp_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const savedUser = localStorage.getItem("wp_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.email) {
          setUser(parsed);
        }
      } catch (error) {
        console.error("wp_user parse error:", error);
      }
    }

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        const finalUser = {
          ...data,
          email: data?.email || "",
        };
        setUser(finalUser);
        localStorage.setItem("wp_user", JSON.stringify(finalUser));
      })
      .catch(() => {
        localStorage.removeItem("wp_token");
        localStorage.removeItem("wp_user");
        router.push("/login");
      });
  }, [router]);

  // Check verification status from localStorage
  useEffect(() => {
    const storedStatus = localStorage.getItem("verificationStatus");
    if (storedStatus) {
      setVerificationStatus(storedStatus); // Set status from localStorage
      if (storedStatus === "not_uploaded" || storedStatus === "pending") {
        setShowVerificationPopup(true);
      } else {
        setShowVerificationPopup(false);
      }
    }
  }, []);

  return (
    <main>
      <Header portalMode />
      <PortalLayout user={user} title="Dashboard" subtitle={`Welcome ${user?.name || "User"}`}>
        <div className="pro-container dashboardPage">
          <div className="verificationStatusWrap">
            <h2 className="sectionTitle">Verification Status</h2>
            <span className={`verificationBadge badge-${verificationStatus}`}>
              {verificationStatus === "verified" && "Verified"}
              {verificationStatus === "pending" && "Pending"}
              {verificationStatus === "failed" && "Failed"}
              {verificationStatus === "not_uploaded" && "Not Uploaded"}
              {verificationStatus === "loading" && "Loading"}
              {verificationStatus === "error" && "Error"}
            </span>
          </div>

          {showVerificationPopup && (
            <div className="verificationPopupOverlay">
              <div className="verificationPopupBox">
                <h3>Your verification is pending</h3>
                <p>Please complete verification to allow services.</p>
                <div className="verificationPopupActions">
                  <button onClick={() => router.push("/document-center")}>
                    Complete Verification
                  </button>
                  <button className="secondaryBtn" onClick={() => setShowVerificationPopup(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PortalLayout>
      <Footer />
    </main>
  );
}
