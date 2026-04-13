"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./orderSuccess.css";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

export default function PaymentSuccessPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wp_user_token");
    const savedUser = localStorage.getItem("wp_user_data");

    if (!token) {
      router.push("/login");
      return;
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          setUser(parsed);
        }
      } catch (error) {
        console.error("wp_user_data parse error:", error);
      }
    }

    fetch(
      `${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        const finalUser = {
          ...data,
          email: data?.email || "",
        };
        setUser(finalUser);
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));
      })
      .catch(() => {
        localStorage.removeItem("wp_user_token");
        localStorage.removeItem("wp_user_data");
        router.push("/login");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [router]);

  if (loadingUser) {
    return (
      <main className="dashboardLoaderPage">
        <Header portalMode />
        <div className="dashboardLoaderWrap">
          <div className="dashboardLoaderCard">
            <div className="dashboardLoaderTop">
              <div className="dashboardLoaderLogoMark"></div>
              <div className="dashboardLoaderLines">
                <span></span>
                <span></span>
              </div>
            </div>

            <div className="dashboardLoaderSpinner">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h2>Loading payment details</h2>
            <p>Please wait while we prepare your success page.</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="paymentSuccessPage">
      <Header portalMode />

      <PortalLayout
        user={user}
        title="Payment Success"
        subtitle="Your order has been completed successfully."
      >
        <section className="paymentSuccessSection">
          <div className="paymentSuccessWrap">
            <div className="paymentSuccessCard">
              <div className="successIconWrap">
                <div className="successIcon">✓</div>
              </div>

              <span className="successBadge">Payment Successful</span>

              <h1 className="successTitle">Thank you for your purchase</h1>

              <p className="successText">
                Your payment has been completed successfully and your
                subscription has been processed.
              </p>

              <div className="successInfoBox">
                <div className="infoRow">
                  <span>Status</span>
                  <strong>Confirmed</strong>
                </div>
                <div className="infoRow">
                  <span>Access</span>
                  <strong>Activated</strong>
                </div>
                <div className="infoRow">
                  <span>Next Step</span>
                  <strong>View your dashboard</strong>
                </div>
              </div>

              <div className="successActions">
                <Link href="/dashboard" className="primarySuccessBtn">
                  Go to Dashboard
                </Link>

                <Link href="/order-history" className="secondarySuccessBtn">
                  View Order History
                </Link>
              </div>
            </div>
          </div>
        </section>
      </PortalLayout>

      <Footer />
    </main>
  );
}