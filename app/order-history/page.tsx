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

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(async (userData) => {
        const finalUser: UserProfile = {
          ...localUser,
          ...userData,
          email: userData?.email || localUser?.email || "",
        };

        setUser(finalUser);
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));

        if (!finalUser.email) {
          throw new Error("User email not found.");
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
      })
      .catch((err) => {
        console.error("Chargebee order history error:", err);
        setError(err.message || "Failed to load order history.");
      })
      .finally(() => {
        setLoading(false);
        setOrderLoading(false);
      });
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

  if (loading) {
    return <div className="orderHistoryPage loadingText">Loading...</div>;
  }

  return (
    <main className="orderHistoryPage">
      <Header portalMode />

      <PortalLayout
        user={user}
        title="Orders"
        subtitle={`Welcome ${user?.name || "User"}, here are your orders.`}
      >
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
              </div>
            ))}
          </div>
        )}
      </PortalLayout>

      <Footer />
    </main>
  );
}