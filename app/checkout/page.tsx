"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import "./checkout.css";

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

export default function CheckoutPage() {
  const router = useRouter();

  const [item, setItem] = useState<ChargebeeCheckoutItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  useEffect(() => {
    const initCheckout = async () => {
      try {
        const savedItem =
          typeof window !== "undefined"
            ? localStorage.getItem("chargebee_checkout_item")
            : null;

        const wpUser =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("wp_user") || "{}")
            : {};

        if (!savedItem) {
          setError("No item found for checkout.");
          setLoading(false);
          return;
        }

        const parsedItem: ChargebeeCheckoutItem = JSON.parse(savedItem);
        setItem(parsedItem);

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
  }, []);

  return (
    <main className="checkoutPage">
      <Header />

      <section className="checkoutContainer">
        <button
          className="checkoutBackBtn"
          onClick={() => router.push("/cart")}
          type="button"
        >
          ← Back to cart
        </button>

        <h1 className="checkoutTitle">Checkout</h1>

        {loading || creatingSession ? (
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

      <Footer />
    </main>
  );
}