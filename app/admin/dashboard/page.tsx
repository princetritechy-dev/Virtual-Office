"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";

type UserItem = {
  id: number;
  name: string;
  email: string;
  status: string;
  admin_note: string;
  documents: {
    document_1: string;
    document_2: string;
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
    <path
      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("wp_admin_token");
    const storedAdmin = localStorage.getItem("wp_admin_data");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Failed to parse admin data:", error);
      }
    }

    fetch(
      `${process.env.NEXT_PUBLIC_WP_API}/wp-json/wp/v2/users/me?context=edit`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        const roles: string[] = data?.roles || [];
        const isAdmin = roles.includes("administrator");

        if (!isAdmin) {
          localStorage.removeItem("wp_admin_token");
          localStorage.removeItem("wp_admin_data");
          router.push("/admin/login");
          return;
        }

        setAdminData(data);
        localStorage.setItem("wp_admin_data", JSON.stringify(data));
        setCheckingAdmin(false);
      })
      .catch(() => {
        localStorage.removeItem("wp_admin_token");
        localStorage.removeItem("wp_admin_data");
        router.push("/admin/login");
      });
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("wp_admin_token");

      const res = await fetch(
        `/api/admin/users?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await res.json();
      const fetchedUsers = data?.users || [];

      setUsers(fetchedUsers);

      const nextNotes: Record<number, string> = {};
      fetchedUsers.forEach((user: UserItem) => {
        nextNotes[user.id] = user.admin_note || "";
      });
      setNotes(nextNotes);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAdmin) {
      fetchUsers();
    }
  }, [checkingAdmin, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const pending = users.filter((u) => u.status === "pending").length;
    const verified = users.filter((u) => u.status === "verified").length;
    const rejected = users.filter((u) => u.status === "rejected").length;
    const not_uploaded = users.filter((u) => u.status === "not_uploaded").length;

    return { total, pending, verified, rejected, not_uploaded };
  }, [users]);

  const updateStatus = async (userId: number, status: string) => {
    setSavingId(userId);

    try {
      const token = localStorage.getItem("wp_admin_token");

      const res = await fetch("/api/admin/update-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          status,
          admin_note: notes[userId] || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data?.message || "Failed to update.");
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, status, admin_note: notes[userId] || "" }
            : user
        )
      );
    } catch (error) {
      console.error("Update failed:", error);
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

const handleViewDocument = async (documentUrl: string) => {
  try {
    const token = localStorage.getItem("wp_admin_token");

    if (!token) {
      alert("Admin token missing. Please login again.");
      router.push("/admin/login");
      return;
    }

    const res = await fetch(
      `/api/admin/view-document?url=${encodeURIComponent(documentUrl)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.message || "Document not found or may have been deleted.");
      return;
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("View document failed:", error);
    alert("Failed to open document.");
  }
};
  const roleLabel =
    adminData?.roles?.length
      ? adminData.roles.map((role) => role.replace(/[-_]/g, " ")).join(", ")
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
    
              <h2>Loading Admin dashboard</h2>
              <p>Please wait while we prepare Admin dashboard.</p>
            </div>
          </div>
          <Footer />
        </main>
      );
  }

  return (
    <>
      <Header adminMode={true} />

      <main className="admin-dashboard-page">
        <div className="admin-dashboard-wrap">
          <aside className="admin-sidebar-card">
            <div className="admin-profile-top">
              <div className="admin-avatar">{getInitials(adminData?.name)}</div>

              <div className="admin-profile-text">
                <h3>{adminData?.name || "Admin User"}</h3>
                <p>{adminData?.email || "admin@example.com"}</p>
                <span className="admin-role-badge">{roleLabel}</span>
              </div>
            </div>

            <div className="admin-sidebar-menu">
              <a href="/admin/dashboard" className="admin-sidebar-item active">
                <span className="admin-sidebar-icon"><DashboardIcon /></span>
                <span>KYC Dashboard</span>
              </a>

              <a href="/admin/customers" className="admin-sidebar-item">
                <span className="admin-sidebar-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M16 3.12601C17.7252 3.57005 19 5.13616 19 7C19 8.86384 17.7252 10.43 16 10.874" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Customers</span>
              </a>

              <a href="/admin/leads" className="admin-sidebar-item">
                <span className="admin-sidebar-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Leads</span>
              </a>

              <a href="/admin/reports" className="admin-sidebar-item">
                <span className="admin-sidebar-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M8 17V10M12 17V7M16 17V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
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
              <h1>Admin Dashboard</h1>
              <p>Manage user verification documents and approval requests</p>
            </div>

            <div className="admin-cards">
              <div className="admin-card">
                <p>Total Users</p>
                <h3>{stats.total}</h3>
              </div>

              <div className="admin-card">
                <p>Pending</p>
                <h3>{stats.pending}</h3>
              </div>

              <div className="admin-card">
                <p>Verified</p>
                <h3>{stats.verified}</h3>
              </div>

              <div className="admin-card">
                <p>Rejected</p>
                <h3>{stats.rejected}</h3>
              </div>

              <div className="admin-card">
                <p>Not Uploaded</p>
                <h3>{stats.not_uploaded}</h3>
              </div>
            </div>

            <div className="admin-filter-panel">
              <div className="admin-filter-bar">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="admin-input"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="">All Statuses</option>
                  <option value="not_uploaded">Not Uploaded</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button onClick={fetchUsers} className="admin-search-btn">
                  Search
                </button>
              </div>
            </div>

            {loading ? (
              <div className="admin-panel">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="admin-panel">No users found.</div>
            ) : (
              <div className="admin-user-list">
                {users.map((user) => (
                  <div key={user.id} className="admin-panel">
                    <div className="admin-user-top">
                      <div>
                        <h3>{user.name || "No Name"}</h3>
                        <p>{user.email}</p>
                        <span className={`status-badge status-${user.status}`}>
                          {user.status}
                        </span>
                      </div>

                      <div className="admin-links">
                        {user.documents.document_1 && (
                          <button
                            type="button"
                            className="admin-doc-btn"
                            onClick={() => handleViewDocument(user.documents.document_1)}
                          >
                            View Document 1
                          </button>
                        )}

                        {user.documents.document_2 && (
                          <button
                            type="button"
                            className="admin-doc-btn"
                            onClick={() => handleViewDocument(user.documents.document_2)}
                          >
                            View Document 2
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="admin-note-wrap">
                      <textarea
                        value={notes[user.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [user.id]: e.target.value,
                          }))
                        }
                        placeholder="Add admin note"
                        className="admin-textarea"
                      />
                    </div>

                    <div className="admin-actions">
                      <button
                        onClick={() => updateStatus(user.id, "verified")}
                        disabled={savingId === user.id}
                        className="admin-action-btn approve"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(user.id, "rejected")}
                        disabled={savingId === user.id}
                        className="admin-action-btn reject"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => updateStatus(user.id, "pending")}
                        disabled={savingId === user.id}
                        className="admin-action-btn pending"
                      >
                        Set Pending
                      </button>

                      <button
                        onClick={() => updateStatus(user.id, "not_uploaded")}
                        disabled={savingId === user.id}
                        className="admin-action-btn not_uploaded"
                      >
                        Not Uploaded
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}