"use client";
import { useTheme } from "./ThemeProvider";


export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();

  const btn =
    "rounded-full border px-3 py-1.5 text-sm transition-colors " +
    "hover:bg-black/5 dark:hover:bg-white/10";

  const active =
    "bg-[var(--accent)] text-white border-[var(--accent)] hover:bg-[var(--accent)]";

  return (
    <div className="inline-flex items-center gap-2">
      {!compact && <span className="text-sm" style={{ color: "var(--accent)" }}>Appearance</span>}
      <button
        className={`${btn} ${theme === "light" ? active : ""}`}
        onClick={() => setTheme("light")}
        aria-label="Use light theme"
        title="Light"
      >
        ☀️ Light
      </button>
      <button
        className={`${btn} ${theme === "dark" ? active : ""}`}
        onClick={() => setTheme("dark")}
        aria-label="Use dark theme"
        title="Dark"
      >
        🌙 Dark
      </button>
      <button
        className={`${btn} ${theme === "system" ? active : ""}`}
        onClick={() => setTheme("system")}
        aria-label="Match system theme"
        title="System"
      >
        💻 System
      </button>
    </div>
  );
}
