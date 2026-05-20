"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import PortalLayout from "../components/portal-layout";
import "../components/portal-layout.css";
import "./billing.css";

type UserProfile = {
  id?: number;
  name?: string;
  slug?: string;
  email?: string;
};

type Invoice = {
  id: string;
  subscription_id: string;
  customer_id: string;
  customer_email: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  total: number;
  sub_total: number;
  tax: number;
  currency_code: string;
  date: number | null;
  due_date: number | null;
  paid_at: number | null;
  description: string;
};

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
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
      if (savedUser) localUser = JSON.parse(savedUser);
    } catch {}

    const fetchData = async () => {
      try {
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (!userRes.ok) throw new Error("Unauthorized");

        const userData = await userRes.json();
        const finalUser: UserProfile = {
          ...localUser,
          ...userData,
          email: userData?.email || localUser?.email || "",
        };

        setUser(finalUser);
        localStorage.setItem("wp_user_data", JSON.stringify(finalUser));

        if (!finalUser.email) throw new Error("Email is required.");

        // Fetch invoices from Chargebee
        const invoiceRes = await fetch(
          `/api/chargebee/invoices?email=${encodeURIComponent(finalUser.email)}`,
          { cache: "no-store" }
        );

        const invoiceData = await invoiceRes.json();

        if (!invoiceRes.ok || !invoiceData.success) {
          throw new Error(invoiceData.message || "Failed to fetch invoices.");
        }

        setInvoices(
          Array.isArray(invoiceData.invoices) ? invoiceData.invoices : []
        );
      } catch (err: any) {
        console.error("Billing page error:", err);
        setError(err.message || "Failed to load billing data.");
      } finally {
        setLoading(false);
        setInvoiceLoading(false);
      }
    };

    fetchData();
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
    return new Date(timestamp * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Summary stats
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.amount_paid || inv.total || 0), 0);

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== "paid" && inv.status !== "voided")
    .reduce((sum, inv) => sum + (inv.amount_due || 0), 0);

  const paidCount = invoices.filter((inv) => inv.status === "paid").length;
  const currency = invoices[0]?.currency_code || "GBP";

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
            <h2>Loading your billing</h2>
            <p>Please wait while we prepare your billing details.</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="billingMainPage">
      <Header portalMode />
      <PortalLayout
        user={user}
        title="Billing & Invoices"
        subtitle={`Welcome ${user?.name || "User"}, here are your billing details.`}
      >
        <div className="billingPage">
          <div className="billingTopBar">
            <h2>Invoice History</h2>
          </div>

          <div className="billingSummaryCards">
            <div className="billingSummaryCard">
              <p>Total Invoices</p>
              <h3>{invoices.length}</h3>
            </div>
            <div className="billingSummaryCard">
              <p>Paid</p>
              <h3>{paidCount}</h3>
            </div>
            <div className="billingSummaryCard">
              <p>Total Paid</p>
              <h3>{formatAmount(totalPaid, currency)}</h3>
            </div>
            <div className="billingSummaryCard">
              <p>Outstanding</p>
              <h3>{formatAmount(totalOutstanding, currency)}</h3>
            </div>
          </div>

          {invoiceLoading && <p className="loadingText">Loading invoices...</p>}
          {!invoiceLoading && error && <p className="errorText">{error}</p>}
          {!invoiceLoading && !error && invoices.length === 0 && (
            <p className="emptyText">No invoices found.</p>
          )}

          {!invoiceLoading && !error && invoices.length > 0 && (
            <div className="invoiceTableWrap">
              <table className="invoiceTable">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{formatDate(inv.date)}</td>
                      <td>{inv.description || "-"}</td>
                      <td>{formatAmount(inv.total, inv.currency_code)}</td>
                      <td>
                        <span
                          className={`invoiceStatus ${inv.status}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <div className="invoiceActions">
                          <a
                            href={`/api/chargebee/invoice-pdf?invoice_id=${encodeURIComponent(inv.id)}&email=${encodeURIComponent(inv.customer_email)}&type=view`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                          <a
                            href={`/api/chargebee/invoice-pdf?invoice_id=${encodeURIComponent(inv.id)}&email=${encodeURIComponent(inv.customer_email)}&type=download`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PortalLayout>
      <Footer />
    </main>
  );
}
