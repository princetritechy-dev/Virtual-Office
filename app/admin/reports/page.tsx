"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import "../dashboard/admin.css";
import "./reports.css";

type ReportsData = {
  subscriptions: {
    total: number;
    active: number;
    cancelled: number;
    mrr: number;
    by_plan: Record<string, number>;
    recent: {
      id: string;
      customer_id: string;
      status: string;
      plan: string;
      mrr: number;
      created_at: number | null;
      currency_code: string;
    }[];
  };
  customers: { total: number };
  verification: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    not_uploaded: number;
  };
};

type AdminData = {
  name?: string;
  email?: string;
  roles?: string[];
};

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 13H11V3H3V13Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M13 21H21V11H13V21Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M13 3H21V9H13V3Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 15H11V21H3V15Z" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

const UserDashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M8 17V10M12 17V7M16 17V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CustomersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 3.12601C17.7252 3.57005 19 5.13616 19 7C19 8.86384 17.7252 10.43 16 10.874" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LeadsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("wp_admin_token");
    const storedAdmin = localStorage.getItem("wp_admin_data");

    if (!token) { router.push("/admin/login"); return; }

    if (storedAdmin) {
      try { setAdminData(JSON.parse(storedAdmin)); } catch {}
    }

    fetch(
      `${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    )
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => {
        if (!data?.roles?.includes("administrator")) {
          localStorage.removeItem("wp_admin_token");
          router.push("/admin/login");
          return;
        }
        setAdminData(data);
        localStorage.setItem("wp_admin_data", JSON.stringify(data));
        setCheckingAdmin(false);
      })
      .catch(() => {
        localStorage.removeItem("wp_admin_token");
        router.push("/admin/login");
      });
  }, [router]);

  useEffect(() => {
    if (checkingAdmin) return;

    const token = localStorage.getItem("wp_admin_token");

    fetch("/api/admin/reports", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReports(data.reports);
      })
      .catch((err) => console.error("Reports fetch error:", err))
      .finally(() => setLoading(false));
  }, [checkingAdmin]);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const token = localStorage.getItem("wp_admin_token");

      const res = await fetch(`/api/admin/export-csv?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        alert("Export failed.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taj-export-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Export failed.");
    } finally {
      setExporting("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("wp_admin_token");
    localStorage.removeItem("wp_admin_data");
    router.push("/admin/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "A";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  const formatAmount = (amount: number, currency = "GBP") => {
    const value = (amount || 0) / 100;
    try {
      return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  };

  const formatDate = (ts?: number | null) => {
    if (!ts) return "-";
    return new Date(ts * 1000).toLocaleDateString("en-GB");
  };

  const roleLabel = adminData?.roles?.length
    ? adminData.roles.map((r) => r.replace(/[-_]/g, " ")).join(", ")
    : "administrator";

  if (checkingAdmin) {
    return <div className="admin-loading">Checking admin access...</div>;
  }

  return (
    <>
      <Header adminMode />
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-wrap">
          <aside className="admin-sidebar-card">
            <div className="admin-profile-top">
              <div className="admin-avatar">{getInitials(adminData?.name)}</div>
              <div className="admin-profile-text">
                <h3>{adminData?.name || "Admin"}</h3>
                <p>{adminData?.email || ""}</p>
                <span className="admin-role-badge">{roleLabel}</span>
              </div>
            </div>
            <div className="admin-sidebar-menu">
              <a href="/admin/dashboard" className="admin-sidebar-item">
                <span className="admin-sidebar-icon"><DashboardIcon /></span>
                <span>KYC Dashboard</span>
              </a>
              <a href="/admin/customers" className="admin-sidebar-item">
                <span className="admin-sidebar-icon"><CustomersIcon /></span>
                <span>Customers</span>
              </a>
              <a href="/admin/leads" className="admin-sidebar-item">
                <span className="admin-sidebar-icon"><LeadsIcon /></span>
                <span>Leads</span>
              </a>
              <a href="/admin/reports" className="admin-sidebar-item active">
                <span className="admin-sidebar-icon"><ReportsIcon /></span>
                <span>Reports</span>
              </a>
              <a href="/login" className="admin-sidebar-item">
                <span className="admin-sidebar-icon"><UserDashboardIcon /></span>
                <span>User Dashboard</span>
              </a>
            </div>
            <button onClick={handleLogout} className="admin-logout-link">
              <span className="admin-sidebar-icon">↗</span>
              <span>Log out</span>
            </button>
          </aside>

          <section className="admin-main-content">
            <div className="admin-page-heading">
              <h1>Reports & Analytics</h1>
              <p>Overview of subscriptions, customers, and verification data</p>
            </div>

            {loading ? (
              <div className="admin-panel">Loading reports...</div>
            ) : !reports ? (
              <div className="admin-panel">Failed to load reports.</div>
            ) : (
              <div className="adminReportsPage">
                {/* Export Buttons */}
                <div className="reportSectionHeader">
                  <h2>Export Data</h2>
                  <div className="exportBtnGroup">
                    <button
                      className="exportBtn"
                      onClick={() => handleExport("subscriptions")}
                      disabled={!!exporting}
                    >
                      {exporting === "subscriptions" ? "Exporting..." : "Export Subscriptions CSV"}
                    </button>
                    <button
                      className="exportBtn secondary"
                      onClick={() => handleExport("customers")}
                      disabled={!!exporting}
                    >
                      {exporting === "customers" ? "Exporting..." : "Export Customers CSV"}
                    </button>
                    <button
                      className="exportBtn secondary"
                      onClick={() => handleExport("users")}
                      disabled={!!exporting}
                    >
                      {exporting === "users" ? "Exporting..." : "Export Users CSV"}
                    </button>
                  </div>
                </div>

                <div className="reportDivider" />

                {/* Subscription Stats */}
                <div className="reportSection">
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#162d59", marginBottom: 16 }}>
                    Subscription Overview
                  </h2>
                  <div className="reportStatsGrid">
                    <div className="reportStatCard">
                      <p>Total Subscriptions</p>
                      <h3>{reports.subscriptions.total}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Active</p>
                      <h3 className="green">{reports.subscriptions.active}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Cancelled</p>
                      <h3 className="red">{reports.subscriptions.cancelled}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Monthly Revenue (MRR)</p>
                      <h3>{formatAmount(reports.subscriptions.mrr)}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Total Customers</p>
                      <h3>{reports.customers.total}</h3>
                    </div>
                  </div>

                  {Object.keys(reports.subscriptions.by_plan).length > 0 && (
                    <div className="planBreakdown">
                      <h3>Subscriptions by Plan</h3>
                      {Object.entries(reports.subscriptions.by_plan).map(([plan, count]) => (
                        <div key={plan} className="planRow">
                          <span>{plan}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="reportDivider" />

                {/* Verification Stats */}
                <div className="reportSection">
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#162d59", marginBottom: 16 }}>
                    User Verification
                  </h2>
                  <div className="reportStatsGrid">
                    <div className="reportStatCard">
                      <p>Total Users</p>
                      <h3>{reports.verification.total}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Pending</p>
                      <h3 className="amber">{reports.verification.pending}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Verified</p>
                      <h3 className="green">{reports.verification.verified}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Rejected</p>
                      <h3 className="red">{reports.verification.rejected}</h3>
                    </div>
                    <div className="reportStatCard">
                      <p>Not Uploaded</p>
                      <h3>{reports.verification.not_uploaded}</h3>
                    </div>
                  </div>
                </div>

                {/* Recent Subscriptions Table */}
                {reports.subscriptions.recent.length > 0 && (
                  <>
                    <div className="reportDivider" />
                    <div className="reportSection">
                      <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#162d59", marginBottom: 16 }}>
                        Recent Subscriptions
                      </h2>
                      <div style={{ overflowX: "auto" }}>
                        <table className="recentTable">
                          <thead>
                            <tr>
                              <th>Subscription</th>
                              <th>Customer</th>
                              <th>Plan</th>
                              <th>Status</th>
                              <th>MRR</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reports.subscriptions.recent.map((sub) => (
                              <tr key={sub.id}>
                                <td>{sub.id}</td>
                                <td>{sub.customer_id}</td>
                                <td>{sub.plan}</td>
                                <td>
                                  <span className={`statusPill ${sub.status}`}>
                                    {sub.status}
                                  </span>
                                </td>
                                <td>{formatAmount(sub.mrr, sub.currency_code)}</td>
                                <td>{formatDate(sub.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
