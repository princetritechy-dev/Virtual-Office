"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type UserProfile = {
  id?: number;
  name?: string;
  email?: string;
};

type PortalLayoutProps = {
  user: UserProfile | null;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const ProfileIcon = () => (
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

const OrdersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3L20 7.5L12 12L4 7.5L12 3Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M20 7.5V16.5L12 21L4 16.5V7.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 12V21" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M7 3H14L19 8V21H7V3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M14 3V8H19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 13H15M9 17H13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 12H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 4V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function PortalLayout({
  user,
  title,
  subtitle,
  children,
}: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("wp_token");
    localStorage.removeItem("wp_user");
    router.push("/login");
  };

  const menuItems = [
    { label: "Profile", href: "/profile", icon: <ProfileIcon /> },
    { label: "Orders", href: "/order-history", icon: <OrdersIcon /> },
    { label: "Documnent Centre", href: "/document-center", icon: <DocumentIcon /> },
  ];

  return (
    <section className="portalPageWrap">
      <div className="portalPageInner">
        <aside className="portalSidebarCard">
          <div className="portalSidebarUser">
            <div className="portalSidebarAvatar portalSidebarAvatarText">
              {getInitials(user?.name)}
            </div>

            <div className="portalSidebarUserText">
              <h3>{user?.name || "User"}</h3>
              <p>{user?.email || ""}</p>
            </div>
          </div>

          <div className="portalSidebarMenu">
            {menuItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`portalSidebarLink ${active ? "active" : ""}`}
                >
                  <span className="portalSidebarIcon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="portalSidebarDivider" />

          <button
            type="button"
            className="portalSidebarLogout"
            onClick={handleLogout}
          >
            <span className="portalSidebarIcon">
              <LogoutIcon />
            </span>
            <span>Log out</span>
          </button>
        </aside>

        <div className="portalMainArea">
          <div className="portalPageHeader">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="portalContentCardless">{children}</div>
        </div>
      </div>
    </section>
  );
}