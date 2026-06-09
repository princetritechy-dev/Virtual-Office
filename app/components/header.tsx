"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type HeaderProps = {
  portalMode?: boolean;
  adminMode?: boolean;
};

type StoredUser = {
  name?: string;
  email?: string;
};

const languages = [
  { label: "English", code: "en" },
  { label: "Italian", code: "it" },
  { label: "French", code: "fr" },
  { label: "Portuguese", code: "pt" },
  { label: "Spanish", code: "es" },
  { label: "German", code: "de" },
  { label: "Arabic", code: "ar" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export default function Header({
  portalMode = false,
  adminMode = false,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const authDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);

    const cookieLang = document.cookie
      .split("; ")
      .find((row) => row.startsWith("googtrans="))
      ?.split("=")[1];

    const savedLang = localStorage.getItem("googtrans");

    const activeLang = savedLang || cookieLang;

    if (activeLang) {
      const lang = activeLang.split("/").pop();

      if (lang) {
        setSelectedLanguage(lang);

        if (lang === "ar") {
          document.documentElement.dir = "rtl";
          document.body.classList.add("translated-rtl");
        } else {
          document.documentElement.dir = "ltr";
          document.body.classList.remove("translated-rtl");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const syncAuthState = () => {
      const token = localStorage.getItem("wp_user_token");
      const savedUser = localStorage.getItem("wp_user_data");

      let parsedUser: StoredUser | null = null;

      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch {
          parsedUser = null;
        }
      }

      setUser(parsedUser);
      setIsLoggedIn(!!token && !!parsedUser);
    };

    syncAuthState();

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, [mounted]);

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

  const clearGoogleTranslateCookies = () => {
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;

    const hostnameParts = window.location.hostname.split(".");

    if (hostnameParts.length > 1) {
      const rootDomain = hostnameParts.slice(-2).join(".");
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${rootDomain}; path=/;`;
    }
  };

  const changeLanguage = (lang: string) => {
    if (typeof window === "undefined") return;

    setSelectedLanguage(lang);

    if (lang === "en") {
      clearGoogleTranslateCookies();
      localStorage.removeItem("googtrans");

      document.documentElement.dir = "ltr";
      document.body.classList.remove("translated-rtl");

      window.location.href = window.location.pathname;
      return;
    }

    const translateValue = `/en/${lang}`;

    document.cookie = `googtrans=${translateValue}; path=/`;
    document.cookie = `googtrans=${translateValue}; domain=${window.location.hostname}; path=/`;

    localStorage.setItem("googtrans", translateValue);

    if (lang === "ar") {
      document.documentElement.dir = "rtl";
      document.body.classList.add("translated-rtl");
    } else {
      document.documentElement.dir = "ltr";
      document.body.classList.remove("translated-rtl");
    }

    window.location.reload();
  };

  const showLoggedIn = mounted && isLoggedIn;

  return (
    <>
      <header
        className={`nav ${portalMode ? "portalHeader" : ""} ${
          adminMode ? "adminHeader" : ""
        }`}
      >
        <div className="container navInner">
          <Link
            href={
              adminMode ? "/admin/login" : showLoggedIn ? "/dashboard" : "/"
            }
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

                {/* Mobile language dropdown - shows only inside hamburger menu */}
                <details open className="mobileLanguageDropdown">
  <summary>
    Language: {languages.find(
      (l) => l.code === selectedLanguage
    )?.label}
  </summary>

  <div className="languageButtons">
    {languages.map((lang) => (
      <button
        key={lang.code}
        type="button"
        onClick={() => changeLanguage(lang.code)}
      >
        {lang.label}
      </button>
    ))}
  </div>
</details>
              </nav>

              {/* Desktop language dropdown - hidden on mobile */}
              <div className="translateWrapper desktopTranslate">
                <div id="google_translate_element" style={{ display: "none" }} />

                <select
                  className="languageSelect"
                  value={selectedLanguage}
                  onChange={(e) => changeLanguage(e.target.value)}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="headerAuthLink">
                {showLoggedIn ? (
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

      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'it,fr,pt,es,de,ar',
              autoDisplay: false
            }, 'google_translate_element');
          }
        `}
      </Script>

      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}