"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState, createContext, useContext } from "react";

// ─── Accent Theme Context ──────────────────────────────────────
type AccentTheme = "light" | "dark" | "indigo" | "emerald" | "rose" | "midnight";

const ACCENT_THEMES: { id: AccentTheme; label: string; color: string }[] = [
  { id: "light",    label: "Cream",    color: "#C2410C" },
  { id: "dark",     label: "Obsidian", color: "#FB923C" },
  { id: "indigo",   label: "Indigo",   color: "#4F46E5" },
  { id: "emerald",  label: "Emerald",  color: "#16A34A" },
  { id: "rose",     label: "Rose",     color: "#E11D48" },
  { id: "midnight", label: "Midnight", color: "#C084FC" },
];

interface ThemeContextValue {
  accentTheme: AccentTheme;
  setAccentTheme: (t: AccentTheme) => void;
  themes: typeof ACCENT_THEMES;
}

const ThemeCtx = createContext<ThemeContextValue>({
  accentTheme: "light",
  setAccentTheme: () => {},
  themes: ACCENT_THEMES,
});

export const useAppTheme = () => useContext(ThemeCtx);

// ─── Provider ─────────────────────────────────────────────────
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>("light");

  // On mount, restore saved theme
  useEffect(() => {
    const saved = localStorage.getItem("motion-accent-theme") as AccentTheme | null;
    if (saved) {
      setAccentThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setAccentTheme = (theme: AccentTheme) => {
    setAccentThemeState(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("motion-accent-theme", theme);
  };

  return (
    <ThemeCtx.Provider value={{ accentTheme, setAccentTheme, themes: ACCENT_THEMES }}>
      {children}
    </ThemeCtx.Provider>
  );
}
