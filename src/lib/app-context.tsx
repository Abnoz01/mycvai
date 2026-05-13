import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import i18n from "./i18n";

type Theme = "light" | "dark";
type Locale = "fr" | "en" | "ar";

interface AppContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme) || "light";
    const l = (localStorage.getItem("locale") as Locale) || "fr";
    setThemeState(t);
    setLocaleState(l);
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
    i18n.changeLanguage(l);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
    i18n.changeLanguage(l);
  };

  return <AppContext.Provider value={{ theme, setTheme, locale, setLocale }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
