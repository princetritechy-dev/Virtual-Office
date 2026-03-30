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

type Billing = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
};

type LineItem = {
  id?: number;
  name?: string;
  quantity?: number;
  total?: string;
};

type Order = {
  id: number;
  status?: string;
  total?: string;
  currency?: string;
  date_created?: string;
  payment_method_title?: string;
  customer_id?: number;
  billing?: Billing;
  line_items?: LineItem[];
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("wp_token");
    const savedUser = localStorage.getItem("wp_user");

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
      console.error("Failed to parse wp_user:", err);
    }

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
        localStorage.setItem("wp_user", JSON.stringify(finalUser));

        if (!finalUser.email) {
          throw new Error("User email not found.");
        }

        const orderRes = await fetch(
          `/api/orders?email=${encodeURIComponent(finalUser.email)}`
        );

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          throw new Error(orderData.message || "Failed to fetch orders");
        }

        setOrders(Array.isArray(orderData) ? orderData : []);
      })
      .catch((err) => {
        console.error("Order history error:", err);
        setError(err.message || "Failed to load order history.");
      })
      .finally(() => {
        setLoading(false);
        setOrderLoading(false);
      });
  }, [router]);

  const canCancelOrder = (status?: string) => {
    return ["pending", "processing", "on-hold"].includes((status || "").toLowerCase());
  };

  const handleCancelOrder = async (orderId: number) => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      setCancelingId(orderId);

      const res = await fetch("/api/cancel-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          email: user?.email || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel order");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
    } catch (err: any) {
      console.error("Cancel order error:", err);
      alert(err.message || "Failed to cancel order.");
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return <div className="orderHistoryPage loadingText">Loading...</div>;
  }

return (
  <main className="orderHistoryPage">
    <Header />

    <PortalLayout
      user={user}
      title="Order History"
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
            <div className="orderCard" key={order.id}>
              <div className="orderTop">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p>
                    Date:{" "}
                    {order.date_created
                      ? new Date(order.date_created).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <span className={`statusBadge ${order.status || ""}`}>
                  {order.status || "-"}
                </span>
              </div>

              <div className="orderInfo">
                <p>
                  <strong>Name:</strong>{" "}
                  {order.billing?.first_name || ""} {order.billing?.last_name || ""}
                </p>
                <p>
                  <strong>Email:</strong> {order.billing?.email || "-"}
                </p>
                <p>
                  <strong>Phone:</strong> {order.billing?.phone || "-"}
                </p>
                <p>
                  <strong>Payment:</strong> {order.payment_method_title || "-"}
                </p>
                <p>
                  <strong>Total:</strong> {order.currency || "$"} {order.total || "0.00"}
                </p>
              </div>

              <div className="orderProducts">
                <h4>Products</h4>
                {order.line_items && order.line_items.length > 0 ? (
                  <ul className="productList">
                    {order.line_items.map((item) => (
                      <li key={item.id} className="productRow">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>
                          {order.currency || "$"} {item.total || "0.00"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No products found.</p>
                )}
              </div>

              {canCancelOrder(order.status) && (
                <div className="orderActions">
                  <button
                    type="button"
                    className="cancelOrderBtn"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelingId === order.id}
                  >
                    {cancelingId === order.id ? "Cancelling..." : "Cancel Order"}
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