"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi }
    },
    lng: "en", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {}
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load language preference from localStorage
    const saved = localStorage.getItem("lang") || "en";
    setLocaleState(saved);
    i18n.changeLanguage(saved);
    setMounted(true);
  }, []);

  const setLocale = (newLocale: string) => {
    localStorage.setItem("lang", newLocale);
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);
  };

  // Prevent flash or hydration mismatch in server-rendered environments
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }} className="contents">
        {children}
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale() {
  return useContext(I18nContext);
}
