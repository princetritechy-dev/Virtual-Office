"use client";

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

type ChargebeeProduct = {
  id: string;
  name: string;
  price: number;
  currency_code: string;
  period_unit: string;
  period: number;
  item_id: string;
  description?: string;
  image?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<ChargebeeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">("monthly");
  const [verificationStatus, setVerificationStatus] = useState("loading");
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  // Fetch user data from localStorage and WP API
  useEffect(() => {
    const token = localStorage.getItem("wp_token");

    if (!token) {
      router.push("/login");
      return;
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // Fetch verification status
  useEffect(() => {
    if (!user?.email) return;

    fetch(`/api/get-verification-status?user_email=${encodeURIComponent(user.email)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        const status = data?.status || "not_uploaded";
        setVerificationStatus(status);

        if (status === "not_uploaded" || status === "pending") {
          setShowVerificationPopup(true);
        } else {
          setShowVerificationPopup(false);
        }
      })
      .catch((err) => {
        console.error("Verification status fetch error:", err);
        setVerificationStatus("error");
      });
  }, [user?.email]);

  // Fetch products from Chargebee API
  useEffect(() => {
    fetch("/api/chargebee/products", {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch Chargebee products");
        }

        return data;
      })
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((err) => {
        console.error("Chargebee product fetch error:", err);
        setProductError(err.message || "Failed to fetch products");
      })
      .finally(() => {
        setProductLoading(false);
      });
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

  const handleBuyNow = (product: ChargebeeProduct) => {
    const cartItem = {
      id: product.id,
      item_price_id: product.id,
      item_id: product.item_id,
      name: product.name,
      price: product.price,
      currency_code: product.currency_code,
      period: product.period,
      period_unit: product.period_unit,
      description: product.description || "",
      image: product.image || "",
      quantity: 1,
    };

    localStorage.setItem("chargebee_cart", JSON.stringify(cartItem));
    router.push("/cart");
  };

  if (loading) {
    return <div className="dashboardPage loadingText">Loading...</div>;
  }

  const filteredProducts = products.filter((product) => {
    const unit = product.period_unit?.toLowerCase();
    return billingMode === "monthly" ? unit === "month" : unit === "year";
  });

  return (
    <main>
      <Header portalMode />

      <PortalLayout
        user={user}
        title="Dashboard"
        subtitle={`Welcome ${user?.name || "User"}`}
      >
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

          <h2 className="sectionTitle">Products</h2>

          {productLoading && <p className="loadingText">Loading products...</p>}

          {!productLoading && productError && (
            <p className="errorText">{productError}</p>
          )}

          {!productLoading && !productError && products.length === 0 && (
            <p className="emptyText">No products found.</p>
          )}

          {!productLoading && !productError && products.length > 0 && (
            <div className="pricingSection">
              <div className="pricingToggleWrap">
                <span className={billingMode === "monthly" ? "activeLabel" : ""}>
                  Monthly
                </span>

                <button
                  className={`billingToggle ${billingMode === "yearly" ? "yearly" : ""}`}
                  onClick={() =>
                    setBillingMode((prev) =>
                      prev === "monthly" ? "yearly" : "monthly"
                    )
                  }
                >
                  <span className="billingToggleKnob" />
                </button>

                <span className={billingMode === "yearly" ? "activeLabel" : ""}>
                  Annually
                </span>
              </div>

              <div className="pricingGrid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="pricingCard">
                    <h3 className="pricingTitle">{product.id}</h3>

                    <div className="pricingAmountRow">
                      <span className="pricingAmount">
                        {formatPrice(product.price, product.currency_code)}
                      </span>
                      <span className="pricingPer">
                        /{billingMode === "monthly" ? "month" : "year"}
                      </span>
                    </div>

                    <p className="pricingVat">Inc VAT</p>

                    <button
                      className="buyNowBtn"
                      onClick={() => handleBuyNow(product)}
                    >
                      Buy now →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                <button
                  className="secondaryBtn"
                  onClick={() => setShowVerificationPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </PortalLayout>

      <Footer />
    </main>
  );
}
