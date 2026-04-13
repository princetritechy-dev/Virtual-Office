"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import "./order-history.css";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

type ChargebeeOrder = {
  subscription_id: string;
  customer_id: string;
  customer_email: string;
  status: string;
  plan_name: string;
  item_price_id: string;
  amount: number;
  currency_code: string;
  billing_period?: number;
  billing_period_unit?: string;
  next_billing_at?: number | null;
  created_at?: number | null;
};

export default function OrderHistoryPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<ChargebeeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelLoadingId, setCancelLoadingId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("wp_user_token");
    const savedUser = localStorage.getItem("wp_user_data");

    if (!token) {
      router.push("/login");
      return;
    }

    let localUser: UserProfile | null = null;

    try {
      if (savedUser) {
        localUser = JSON.parse(savedUser);
      }
    } catch (err) {
      console.error("Failed to parse wp_user_data:", err);
    }

    const fetchUserAndOrders = async () => {
      try {
        setError("");
        setSuccessMessage("");

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

        const finalUser: UserProfile = {
          ...localUser,
          ...userData,
          email: userData?.email || localUser?.email || "",
        };

        setUser(finalUser);
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));

        if (!finalUser.email) {
          throw new Error("Email is required.");
        }

        const orderRes = await fetch(
          `/api/chargebee/orders?email=${encodeURIComponent(finalUser.email)}`,
          {
            cache: "no-store",
          }
        );

        const orderData = await orderRes.json();

        if (!orderRes.ok || !orderData.success) {
          throw new Error(orderData.message || "Failed to fetch Chargebee orders");
        }

        setOrders(Array.isArray(orderData.orders) ? orderData.orders : []);
      } catch (err: any) {
        console.error("Chargebee order history error:", err);
        setError(err.message || "Failed to load order history.");
      } finally {
        setLoading(false);
        setOrderLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [router]);

  const formatAmount = (amount: number, currency: string) => {
    const value = (amount || 0) / 100;

    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency || "GBP",
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  };

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleCancelSubscription = async (
    subscriptionId: string,
    cancelOption: "immediately" | "end_of_term" = "end_of_term"
  ) => {
    const confirmed = window.confirm(
      cancelOption === "immediately"
        ? "Are you sure you want to cancel this subscription immediately?"
        : "Are you sure you want to cancel this subscription at the end of the billing term?"
    );

    if (!confirmed) return;

    try {
      setCancelLoadingId(subscriptionId);
      setError("");
      setSuccessMessage("");

      const res = await fetch("/api/chargebee/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          cancel_option: cancelOption,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel subscription.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.subscription_id === subscriptionId
            ? {
                ...order,
                status:
                  cancelOption === "immediately"
                    ? "cancelled"
                    : "non_renewing",
              }
            : order
        )
      );

      setSuccessMessage(
        data.message ||
          (cancelOption === "immediately"
            ? "Subscription cancelled successfully."
            : "Subscription will be cancelled at the end of the billing term.")
      );
    } catch (err: any) {
      console.error("Cancel subscription error:", err);
      setError(err.message || "Failed to cancel subscription.");
    } finally {
      setCancelLoadingId("");
    }
  };

  if (loading) {
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

            <h2>Loading your order history</h2>
            <p>Please wait while we prepare your order details.</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="orderHistoryPage">
      <Header portalMode />

      <PortalLayout
        user={user}
        title="Orders"
        subtitle={`Welcome ${user?.name || "User"}, here are your orders.`}
      >
        {successMessage && <p className="successText">{successMessage}</p>}
        {orderLoading && <p className="loadingText">Loading orders...</p>}
        {!orderLoading && error && <p className="errorText">{error}</p>}
        {!orderLoading && !error && orders.length === 0 && (
          <p className="emptyText">No orders found.</p>
        )}

        {!orderLoading && !error && orders.length > 0 && (
          <div className="orderList">
            {orders.map((order) => (
              <div className="orderCard" key={order.subscription_id}>
                <div className="orderTop">
                  <div>
                    <h3>Subscription #{order.subscription_id}</h3>
                    <p>Created: {formatDate(order.created_at)}</p>
                  </div>

                  <span className={`statusBadge ${order.status || ""}`}>
                    {order.status || "-"}
                  </span>
                </div>

                <div className="orderInfo">
                  <p>
                    <strong>Plan:</strong> {order.plan_name || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.customer_email || "-"}
                  </p>
                  <p>
                    <strong>Customer ID:</strong> {order.customer_id || "-"}
                  </p>
                  <p>
                    <strong>Item Price ID:</strong> {order.item_price_id || "-"}
                  </p>
                  <p>
                    <strong>Amount:</strong>{" "}
                    {formatAmount(order.amount, order.currency_code)}
                  </p>
                  <p>
                    <strong>Billing Cycle:</strong>{" "}
                    {order.billing_period
                      ? `${order.billing_period} ${order.billing_period_unit || ""}`
                      : "-"}
                  </p>
                  <p>
                    <strong>Next Billing:</strong> {formatDate(order.next_billing_at)}
                  </p>
                </div>

                {!["cancelled", "non_renewing"].includes(order.status) && (
                  <div className="orderActions">
                    <button
                      className="cancelOrderBtn"
                      onClick={() =>
                        handleCancelSubscription(order.subscription_id, "end_of_term")
                      }
                      disabled={cancelLoadingId === order.subscription_id}
                    >
                      {cancelLoadingId === order.subscription_id
                        ? "Cancelling..."
                        : "Cancel Later"}
                    </button>

                    <button
                      className="cancelOrderBtn dangerBtn"
                      onClick={() =>
                        handleCancelSubscription(order.subscription_id, "immediately")
                      }
                      disabled={cancelLoadingId === order.subscription_id}
                    >
                      {cancelLoadingId === order.subscription_id
                        ? "Cancelling..."
                        : "Cancel Now"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PortalLayout>

      <Footer />
    </main>
  );
}