"use client";

import Script from "next/script";

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

export default function GoogleTranslate() {
  const changeLanguage = (lang: string) => {
    document.cookie = `googtrans=/en/${lang};path=/`;
    document.cookie = `googtrans=/en/${lang};domain=${window.location.hostname};path=/`;
    window.location.reload();
  };

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} />

      <select
  className="languageSelect"
  size={languages.length}
  defaultValue="en"
  onChange={(e) => changeLanguage(e.target.value)}
>
  {languages.map((lang) => (
    <option key={lang.code} value={lang.code}>
      {lang.label}
    </option>
  ))}
</select>

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