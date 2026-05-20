"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./orderSuccess.css";

type OrderDetails = {
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  totalPrice: string;
  shippingAddress: string;
  billingAddress: string;
};

export default function OrderSuccessPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);  // Track the loading state

  useEffect(() => {
    const storedOrderDetails = localStorage.getItem("orderDetails");

    if (storedOrderDetails) {
      setOrderDetails(JSON.parse(storedOrderDetails));
      setLoading(false);  // Stop loading once the data is loaded
    } else {
      setLoading(false);  // Stop loading and redirect
    }
  }, [router]);

  if (loading) {
    return <div className="orderSuccessPage">Loading...</div>;
  }

  if (!orderDetails) {
    return null; // Prevent rendering anything if orderDetails is null
  }

  return (
    <div className="orderSuccessPage">
      <div className="orderSuccessContainer">
        <h1>Thank You for Your Order!</h1>
        <p>Your order has been successfully placed. Here are the details:</p>

        <div className="orderSummary">
          <h2>Order Summary</h2>
          <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
          <div className="orderItems">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="orderItem">
                <p>
                  {item.name} - {item.quantity} x {item.price}
                </p>
              </div>
            ))}
          </div>
          <p>
            <strong>Total:</strong> {orderDetails.totalPrice}
          </p>
        </div>

        <div className="shippingInfo">
          <h2>Shipping Address</h2>
          <p>{orderDetails.shippingAddress}</p>
        </div>

        <div className="billingInfo">
          <h2>Billing Address</h2>
          <p>{orderDetails.billingAddress}</p>
        </div>

        <div className="nextSteps">
          <Link href="/orders" className="viewOrdersButton">
            View Order Details
          </Link>
          <Link href="/dashboard" className="continueShoppingButton">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}