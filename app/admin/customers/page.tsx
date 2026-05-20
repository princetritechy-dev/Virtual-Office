"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import "../dashboard/admin.css";
import "./customers.css";

type CustomerSubscription = {
  id: string;
  status: string;
  plan: string;
  amount: number;
  currency_code: string;
  created_at: number | null;
  next_billing_at: number | null;
};

type Customer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  created_at: number | null;
  subscriptions: CustomerSubscription[];
  active_subscriptions: number;
  total_subscriptions: number;
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

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("wp_admin_token");
    const storedAdmin = localStorage.getItem("wp_admin_data");

    if (!token) { router.push("/admin/login"); return; }
    if (storedAdmin) { try { setAdminData(JSON.parse(storedAdmin)); } catch {} }

    fetch(`${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    })
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
      .catch(() => { localStorage.removeItem("wp_admin_token"); router.push("/admin/login"); });
  }, [router]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("wp_admin_token");
      const res = await fetch(
        `/api/admin/customers?search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      const data = await res.json();
      setCustomers(data?.customers || []);
    } catch (err) {
      console.error("Customer fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAdmin) fetchCustomers();
  }, [checkingAdmin]);

  const formatAmount = (amount: number, currency: string) => {
    const value = (amount || 0) / 100;
    try {
      return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(value);
    } catch { return `${value.toFixed(2)} ${currency}`; }
  };

  const formatDate = (ts?: number | null) => {
    if (!ts) return "-";
    return new Date(ts * 1000).toLocaleDateString("en-GB");
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

  const roleLabel = adminData?.roles?.length
    ? adminData.roles.map((r) => r.replace(/[-_]/g, " ")).join(", ")
    : "administrator";

  if (checkingAdmin) {
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
        
                  <h2>Loading All customers</h2>
                  <p>Please wait while we retrieve all customers.</p>
                </div>
              </div>
              <Footer />
            </main>
          );
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
              <a href="/admin/customers" className="admin-sidebar-item active">
                <span className="admin-sidebar-icon"><CustomersIcon /></span>
                <span>Customers</span>
              </a>
              <a href="/admin/leads" className="admin-sidebar-item">
                <span className="admin-sidebar-icon"><LeadsIcon /></span>
                <span>Leads</span>
              </a>
              <a href="/admin/reports" className="admin-sidebar-item">
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
              <h1>Customer Management</h1>
              <p>View and manage Chargebee customers and their subscriptions</p>
            </div>

            <div className="customerListWrap">
              <div className="customerFilterBar">
                <input
                  type="text"
                  placeholder="Search by email, name, or company"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={fetchCustomers}>Search</button>
              </div>

              {loading ? (
                <div className="admin-panel">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="admin-panel">No customers found.</div>
              ) : (
                customers.map((cust) => (
                  <div key={cust.id} className="customerCard">
                    <div className="customerCardTop">
                      <div>
                        <h3>
                          {[cust.first_name, cust.last_name].filter(Boolean).join(" ") || cust.id}
                        </h3>
                        <p>{cust.email}</p>
                      </div>
                      {cust.active_subscriptions > 0 && (
                        <span className="activeBadge">
                          {cust.active_subscriptions} Active
                        </span>
                      )}
                    </div>

                    <div className="customerMeta">
                      {cust.company && (
                        <span><strong>Company:</strong> {cust.company}</span>
                      )}
                      <span><strong>Customer ID:</strong> {cust.id}</span>
                      <span><strong>Joined:</strong> {formatDate(cust.created_at)}</span>
                      <span><strong>Total Subs:</strong> {cust.total_subscriptions}</span>
                    </div>

                    {cust.subscriptions.length > 0 ? (
                      <div className="customerSubList">
                        <h4>Subscriptions</h4>
                        {cust.subscriptions.map((sub) => (
                          <div key={sub.id} className="customerSubRow">
                            <span>{sub.plan || sub.id}</span>
                            <span>{formatAmount(sub.amount, sub.currency_code)}</span>
                            <span className={`custStatusPill ${sub.status}`}>
                              {sub.status}
                            </span>
                            <span>Next: {formatDate(sub.next_billing_at)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="noSubText">No subscriptions</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
