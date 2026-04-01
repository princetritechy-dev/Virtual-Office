"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/header";
import Footer from "./components/footer";
import PortalLayout from "./components/portal-layout";
import "./components/portal-layout.css";
import "/doc.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("not_uploaded");
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data
    const token = localStorage.getItem("wp_token");
    const savedUser = localStorage.getItem("wp_user");

    if (!token) {
      router.push("/login"); // Redirect if no token found
      return;
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.email) {
          setUser(parsed); // Set user from localStorage
        }
      } catch (error) {
        console.error("wp_user parse error:", error);
      }
    }

    // Fetch user verification status
    fetch(`/api/get-verification-status?user_email=${encodeURIComponent(user?.email)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        const status = data?.status || "not_uploaded"; // Default to not_uploaded if no status
        setVerificationStatus(status);

        // Show the popup if the status is "not_uploaded" or "pending"
        if (status === "not_uploaded" || status === "pending") {
          setShowVerificationPopup(true);
        } else {
          setShowVerificationPopup(false);
        }
      })
      .catch((err) => {
        console.error("Verification status fetch error:", err);
        setVerificationStatus("error"); // Handle error status
      })
      .finally(() => {
        setLoading(false); // Stop loading once data is fetched
      });
  }, [user?.email, router]);

  useEffect(() => {
    // Update the popup visibility based on verification status
    if (verificationStatus === "not_uploaded" || verificationStatus === "pending") {
      setShowVerificationPopup(true);
    } else {
      setShowVerificationPopup(false);
    }
  }, [verificationStatus]);

  if (loading) {
    return <div className="loading-screen">Loading...</div>; // Show loading indicator until data is loaded
  }

  return (
    <main>
      <Header portalMode />

      <PortalLayout
        user={user}
        title="Dashboard"
        subtitle="Your user dashboard"
      >
        <div className="doc-container">
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
