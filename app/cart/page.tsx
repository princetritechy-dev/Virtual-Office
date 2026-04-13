"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";
import "./cart.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [item, setItem] = useState<ChargebeeCartItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wp_user_token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
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
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));
      })
      .catch(() => {
        localStorage.removeItem("wp_user_token");
        localStorage.removeItem("wp_user_data");
        router.push("/login");
      })
      .finally(() => {
        const saved = localStorage.getItem("chargebee_cart");
        if (saved) {
          setItem(JSON.parse(saved));
        }
        setLoading(false);
      });
  }, [router]);

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
    localStorage.removeItem("chargebee_checkout_item");
    setItem(null);
  };

  const handleProceedToCheckout = () => {
    if (!item) return;

    localStorage.setItem("chargebee_checkout_item", JSON.stringify(item));
    router.push("/checkout");
  };

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

          <h2>Redirecting to Cart ...</h2>
          <p>Please wait while we prepare cart for you.</p>
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
        title="Your cart"
        subtitle="Review your selected plan before checkout"
      >
        <section className="cartContainer">
          {!item ? (
            <div className="cartEmptyCard">
              <h2 className="cartTitle">Your cart is empty</h2>
              <p className="cartEmptyText">No product has been added yet.</p>
              <button
                className="cartPrimaryButton"
                onClick={() => router.push("/dashboard")}
                type="button"
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
                  type="button"
                >
                  Proceed to Checkout
                </button>
              </aside>
            </div>
          )}
        </section>
      </PortalLayout>

      <Footer />
    </main>
  );
}