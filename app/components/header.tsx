"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type HeaderProps = {
  portalMode?: boolean;
};

type StoredUser = {
  name?: string;
  email?: string;
};

export default function Header({ portalMode = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [faceImageUrl, setFaceImageUrl] = useState("");

  const authDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("wp_token");
    const savedUser = localStorage.getItem("wp_user");
    const savedFace = localStorage.getItem("face_image_url");

    setIsLoggedIn(!!token);

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    if (savedFace) {
      setFaceImageUrl(savedFace);
    }
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

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  const closeMenus = () => {
    setMenuOpen(false);
    setAuthMenuOpen(false);
  };

  // 👇 Avatar UI (reuse everywhere)
  const renderAvatar = () => {
    if (faceImageUrl) {
      return (
        <img
          src={faceImageUrl}
          alt={user?.name || "User"}
          className="headerAvatarImage"
        />
      );
    }

    return (
      <span className="headerAvatar">
        {getInitials(user?.name)}
      </span>
    );
  };

  return (
    <header className={`nav ${portalMode ? "portalHeader" : ""}`}>
      <div className="container navInner">
        
        {/* LOGO */}
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
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

        {!portalMode ? (
          <div className={`navWrapper ${menuOpen ? "open" : ""}`}>
            
            {/* MOBILE MENU */}
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

            {/* NAV LINKS */}
            <nav className="navLinks" aria-label="Primary">
              <Link href="/about-us/" onClick={closeMenus}>About Us</Link>
              <Link href="/why-work-with-us/" onClick={closeMenus}>Why work with us</Link>
              <Link href="/Listing/" onClick={closeMenus}>Locations</Link>
              <Link href="/contact-us/" onClick={closeMenus}>Contact Us</Link>
            </nav>

            {/* RIGHT SIDE */}
            <div className="headerAuthLink">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="headerUserSummary"
                  onClick={closeMenus}
                >
                  {renderAvatar()}
                </Link>
              ) : (
                <div className="userMenuWrapper" ref={authDropdownRef}>
                  <button
                    type="button"
                    className="userIconButton"
                    onClick={() => setAuthMenuOpen((prev) => !prev)}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>

                  {authMenuOpen && (
                    <div className="userDropdown">
                      <Link href="/login/" onClick={closeMenus}>Login</Link>
                      <Link href="/register/" onClick={closeMenus}>Register</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          
          /* PORTAL HEADER */
          <div className="portalHeaderRight">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="headerUserSummary portalUserSummary"
              >
                {renderAvatar()}
              </Link>
            ) : (
              <div className="userMenuWrapper" ref={authDropdownRef}>
                <button
                  type="button"
                  className="userIconButton"
                  onClick={() => setAuthMenuOpen((prev) => !prev)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {authMenuOpen && (
                  <div className="userDropdown">
                    <Link href="/login/" onClick={closeMenus}>Login</Link>
                    <Link href="/register/" onClick={closeMenus}>Register</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}