"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type HeaderProps = {
  portalMode?: boolean;
  adminMode?: boolean;
};

type StoredUser = {
  name?: string;
  email?: string;
};

export default function Header({
  portalMode = false,
  adminMode = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);

  const authDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("wp_token");
      const savedUser = localStorage.getItem("wp_user");

      let parsedUser: StoredUser | null = null;

      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch {
          parsedUser = null;
        }
      }

      setUser(parsedUser);
      setIsLoggedIn(!!token || !!parsedUser?.name || !!parsedUser?.email);
    };

    syncAuthState();

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        authDropdownRef.current &&
        !authDropdownRef.current.contains(event.target as Node)
      ) {
        setAuthMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeMenus = () => {
    setMenuOpen(false);
    setAuthMenuOpen(false);
  };

  return (
    <header
      className={`nav ${portalMode ? "portalHeader" : ""} ${
        adminMode ? "adminHeader" : ""
      }`}
    >
      <div className="container navInner">
        <Link
          href={adminMode ? "/admin/login" : isLoggedIn ? "/dashboard" : "/"}
          className="brand"
          onClick={closeMenus}
        >
          <Image
            src="/images/logo.png"
            alt="Virtual Office Anywhere Logo"
            width={150}
            height={50}
            className="brandLogo"
            priority
          />
        </Link>

        {!portalMode && !adminMode ? (
          <div className={`navWrapper ${menuOpen ? "open" : ""}`}>
            <button
              className="hamburger"
              aria-label="Menu"
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <nav className="navLinks" aria-label="Primary">
              <Link href="/about-us/" onClick={closeMenus}>
                About Us
              </Link>
              <Link href="/why-work-with-us/" onClick={closeMenus}>
                Why work with us
              </Link>
              <Link href="/Listing/" onClick={closeMenus}>
                Locations
              </Link>
              <Link href="/contact-us/" onClick={closeMenus}>
                Contact Us
              </Link>
            </nav>

            <div className="headerAuthLink">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="headerUserSummary"
                  onClick={closeMenus}
                >
                  <span className="headerAvatar">
                    {user?.name
                      ? user.name
                          .trim()
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part.charAt(0).toUpperCase())
                          .join("")
                      : "U"}
                  </span>
                </Link>
              ) : (
                <div className="userMenuWrapper" ref={authDropdownRef}>
                  <button
                    type="button"
                    className="userIconButton"
                    onClick={() => setAuthMenuOpen((prev) => !prev)}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>

                  {authMenuOpen && (
                    <div className="userDropdown">
                      <Link href="/login/" onClick={closeMenus}>
                        Login
                      </Link>
                      <Link href="/register/" onClick={closeMenus}>
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="adminHeaderInner"></div>
        )}
      </div>
    </header>
  );
}