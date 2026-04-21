"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import "../dashboard/admin.css";
import "./leads.css";

type Lead = {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  status: string;
  admin_note?: string;
  created_at?: string;
  source?: string;
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

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | number | null>(null);

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

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("wp_admin_token");
      const res = await fetch(
        `/api/admin/leads?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      const data = await res.json();
      const fetchedLeads = data?.leads || [];
      setLeads(fetchedLeads);

      const nextNotes: Record<string, string> = {};
      fetchedLeads.forEach((lead: Lead) => {
        nextNotes[String(lead.id)] = lead.admin_note || "";
      });
      setNotes(nextNotes);
    } catch (err) {
      console.error("Leads fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAdmin) fetchLeads();
  }, [checkingAdmin, statusFilter]);

  const updateLeadStatus = async (leadId: string | number, status: string) => {
    setSavingId(leadId);
    try {
      const token = localStorage.getItem("wp_admin_token");
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_id: leadId,
          status,
          admin_note: notes[String(leadId)] || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data?.message || "Failed to update lead.");
        return;
      }

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status, admin_note: notes[String(leadId)] || "" } : lead
        )
      );
    } catch {
      alert("Something went wrong.");
    } finally {
      setSavingId(null);
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
              <a href="/admin/leads" className="admin-sidebar-item active">
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
              <h1>Lead Review</h1>
              <p>Review and manage incoming leads and contact form submissions</p>
            </div>

            <div className="leadsListWrap">
              <div className="leadsFilterBar">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button onClick={fetchLeads}>Search</button>
              </div>

              {loading ? (
                <div className="admin-panel">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="emptyLeadsSetup">
                  <h3>No leads found</h3>
                  <p>
                    Leads will appear here once your WordPress backend has the leads
                    custom REST endpoint configured. Ensure your theme or plugin exposes:
                  </p>
                  <code>
                    GET /wp-json/custom/v1/admin/leads<br />
                    POST /wp-json/custom/v1/admin/update-lead
                  </code>
                </div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="leadCard">
                    <div className="leadCardTop">
                      <div>
                        <h3>{lead.name || "Unknown"}</h3>
                        <p>{lead.email}</p>
                      </div>
                      <span className={`leadStatusBadge ${lead.status || "new"}`}>
                        {lead.status || "new"}
                      </span>
                    </div>

                    {lead.message && (
                      <div className="leadMessage">{lead.message}</div>
                    )}

                    <div className="leadMeta">
                      {lead.phone && <span><strong>Phone:</strong> {lead.phone}</span>}
                      {lead.company && <span><strong>Company:</strong> {lead.company}</span>}
                      {lead.source && <span><strong>Source:</strong> {lead.source}</span>}
                      {lead.created_at && <span><strong>Date:</strong> {lead.created_at}</span>}
                    </div>

                    <div className="leadNoteWrap">
                      <textarea
                        value={notes[String(lead.id)] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [String(lead.id)]: e.target.value }))
                        }
                        placeholder="Add admin note"
                      />
                    </div>

                    <div className="leadActions">
                      <button
                        className="leadActionBtn contacted"
                        onClick={() => updateLeadStatus(lead.id, "contacted")}
                        disabled={savingId === lead.id}
                      >
                        Contacted
                      </button>
                      <button
                        className="leadActionBtn qualified"
                        onClick={() => updateLeadStatus(lead.id, "qualified")}
                        disabled={savingId === lead.id}
                      >
                        Qualified
                      </button>
                      <button
                        className="leadActionBtn converted"
                        onClick={() => updateLeadStatus(lead.id, "converted")}
                        disabled={savingId === lead.id}
                      >
                        Converted
                      </button>
                      <button
                        className="leadActionBtn rejected"
                        onClick={() => updateLeadStatus(lead.id, "rejected")}
                        disabled={savingId === lead.id}
                      >
                        Rejected
                      </button>
                    </div>
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
