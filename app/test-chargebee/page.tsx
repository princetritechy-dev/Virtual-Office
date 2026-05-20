"use client";

import { useState } from "react";

export default function TestChargebeePage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/chargebee/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: "testuser@example.com",
        }),
      });

      const data = await res.json();

      console.log("Chargebee response:", data);

      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.message || "Checkout failed");
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      alert(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Chargebee Test Checkout</h1>
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? "Please wait..." : "Open Chargebee Checkout"}
      </button>
    </div>
  );
}