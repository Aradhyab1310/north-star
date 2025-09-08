"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeCtx = createContext({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light"); // "light" | "dark" | "system"
  const [ready, setReady] = useState(false);

  // 1) Load initial theme from localStorage once
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    setTheme(saved || "light");
    setReady(true);
  }, []);

  // 2) Apply theme to <html> and react to system changes (when theme === "system")
  useEffect(() => {
    if (!ready) return;

    const root = document.documentElement;

    const apply = (mode) => {
      if (mode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", mode === "dark");
      }
    };

    apply(theme);
    localStorage.setItem("theme", theme);

    // watch OS preference when in "system"
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      if (theme === "system") {
        root.classList.toggle("dark", e.matches);
      }
    };
    mql?.addEventListener?.("change", onChange);
    return () => mql?.removeEventListener?.("change", onChange);
  }, [theme, ready]);

  // 3) Optional: keyboard shortcut Ctrl/Cmd + T to toggle light/dark
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeCtx.Provider value={value}>
      {/* avoid flash until theme applied */}
      <div style={{ visibility: ready ? "visible" : "hidden" }}>{children}</div>
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
