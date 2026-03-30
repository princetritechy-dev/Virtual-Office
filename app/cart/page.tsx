"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import "./cart.css";

type ChargebeeCartItem = {
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

export default function CartPage() {
  const router = useRouter();
  const [item, setItem] = useState<ChargebeeCartItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chargebee_cart");
    if (saved) {
      setItem(JSON.parse(saved));
    }
  }, []);

  const formatPrice = (amount: number, currency: string) => {
    const value = amount / 100;
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency || "GBP",
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  };

  const updateQuantity = (type: "inc" | "dec") => {
    if (!item) return;

    const nextQty =
      type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);

    const updated = { ...item, quantity: nextQty };
    setItem(updated);
    localStorage.setItem("chargebee_cart", JSON.stringify(updated));
  };

  const removeItem = () => {
    localStorage.removeItem("chargebee_cart");
    setItem(null);
  };

  // const handleCheckout = async () => {
  //   if (!item) return;

  //   setLoading(true);

  //   try {
  //     const wpUser = JSON.parse(localStorage.getItem("wp_user") || "{}");

  //     const res = await fetch("/api/chargebee/checkout", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         firstName: wpUser?.name || "",
  //         lastName: "",
  //         email: wpUser?.email || "",
  //         item_price_id: item.item_price_id,
  //         quantity: item.quantity,
  //       }),
  //     });

  //     const data = await res.json();

  //     if (data.success && data.checkout_url) {
  //       window.location.href = data.checkout_url;
  //     } else {
  //       alert(data.message || "Checkout failed");
  //     }
  //   } catch (error: any) {
  //     alert(error?.message || "Something went wrong");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleProceedToCheckout = () => {
  if (!item) return;

  // Save for checkout page
  localStorage.setItem("chargebee_checkout_item", JSON.stringify(item));

  router.push("/checkout");
};
  return (
    <main className="cartPage">
      <Header />

      <section className="cartContainer">
        {!item ? (
          <div className="cartEmptyCard">
            <h1 className="cartTitle">Your cart</h1>
            <p className="cartEmptyText">Your cart is empty.</p>
            <button
              className="cartPrimaryButton"
              onClick={() => router.push("/dashboard")}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cartLayout">
            <div className="cartItems">
              <button
                className="backBtn"
                onClick={() => router.push("/dashboard")}
                type="button"
              >
                ← Back to site
              </button>

              <h1 className="cartTitle">Your cart</h1>

              <div className="cartItemCard">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cartItemImage"
                  />
                ) : null}

                <div className="cartItemContent">
                  <span className="planBadge">PLAN</span>
                  <h2 className="cartItemTitle">{item.name}</h2>

                  {item.description ? (
                  <p
                    className="cartItemDesc"
                    dangerouslySetInnerHTML={{ __html: item.description || "" }}
                  />
                  ) : null}

                  <div className="cartItemActions">
                    <div className="qtyControl">
                      <button
                        onClick={() => updateQuantity("dec")}
                        className="qtyButton"
                        type="button"
                      >
                        -
                      </button>

                      <span className="qtyValue">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity("inc")}
                        className="qtyButton"
                        type="button"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={removeItem}
                      className="removeButton"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="cartItemPrice">
                    {formatPrice(item.price * item.quantity, item.currency_code)}
                  </p>
                </div>
              </div>
            </div>

            <aside className="summaryCard">
              <h2 className="summaryTitle">Order Summary</h2>

              <div className="summaryRows">
                <div className="summaryRow">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    {formatPrice(item.price * item.quantity, item.currency_code)}
                  </span>
                </div>

                <div className="summaryRow totalRow">
                  <span>Total</span>
                  <span>
                    {formatPrice(item.price * item.quantity, item.currency_code)}
                  </span>
                </div>
              </div>

              <button
                className="checkoutButton"
                onClick={handleProceedToCheckout}
                disabled={loading}
                type="button"
              >
                {loading ? "Processing..." : "Proceed to Checkout"}
              </button>
            </aside>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}