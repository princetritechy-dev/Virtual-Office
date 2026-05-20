"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";
import "./checkout.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

type ChargebeeCheckoutItem = {
  id: string;
  item_price_id: string;
  item_id?: string;
  name: string;
  price: number;
  currency_code: string;
  period: number;
  period_unit: string;
  description?: string;
  image?: string;
  quantity: number;
};

type WPUser = {
  id?: number;
  name?: string;
  email?: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [item, setItem] = useState<ChargebeeCheckoutItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  useEffect(() => {
    const initCheckout = async () => {
      try {
        const token = localStorage.getItem("wp_user_token");

        if (!token) {
          router.push("/login");
          return;
        }

        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!userRes.ok) {
          throw new Error("Unauthorized");
        }

        const userData = await userRes.json();
        const finalUser = {
          ...userData,
          email: userData?.email || "",
        };

        setUser(finalUser);
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));

        const savedItem =
          typeof window !== "undefined"
            ? localStorage.getItem("chargebee_checkout_item")
            : null;

        if (!savedItem) {
          setError("No item found for checkout.");
          setLoading(false);
          return;
        }

        const parsedItem: ChargebeeCheckoutItem = JSON.parse(savedItem);
        setItem(parsedItem);

        let wpUser: WPUser = {
          id: finalUser?.id,
          name: finalUser?.name,
          email: finalUser?.email,
        };

        const fullName = wpUser?.name || "";
        const nameParts = String(fullName).trim().split(" ").filter(Boolean);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const email = wpUser?.email || "";

        if (!email) {
          setError("User email not found.");
          setLoading(false);
          return;
        }

        setCreatingSession(true);

        const res = await fetch("/api/chargebee/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            item_price_id: parsedItem.item_price_id,
            quantity: parsedItem.quantity || 1,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to create checkout session");
        }

        if (!data.checkout_url) {
          throw new Error("Checkout URL not received.");
        }

        setCheckoutUrl(data.checkout_url);
      } catch (err: any) {
        console.error("Checkout init error:", err);
        setError(err.message || "Failed to load checkout");
      } finally {
        setCreatingSession(false);
        setLoading(false);
      }
    };

    initCheckout();
  }, [router]);

if (loading) {
  return (
    <main className="dashboardLoaderPage">
      <Header />
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

          <h2>Redirecting to Checkout...</h2>
          <p>Please wait while we prepare checkout.</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

  return (
    <main>
      <Header portalMode />

      <PortalLayout
        user={user}
        title="Checkout"
        subtitle="Complete your secure payment"
      >
        <section className="checkoutContainer">
          <button
            className="checkoutBackBtn"
            onClick={() => router.push("/cart")}
            type="button"
          >
            ← Back to cart
          </button>

          {creatingSession ? (
            <p className="checkoutStateText">Loading secure checkout...</p>
          ) : error ? (
            <p className="checkoutError">{error}</p>
          ) : checkoutUrl ? (
            <div className="checkoutIframeWrap">
              <iframe
                src={checkoutUrl}
                className="checkoutIframe"
                title="Chargebee Checkout"
                allow="payment *"
              />
            </div>
          ) : (
            <p className="checkoutError">Unable to load checkout.</p>
          )}
        </section>
      </PortalLayout>

      <Footer />
    </main>
  );
}