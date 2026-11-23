"use client";

import { useTheme } from "../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

export default function ThemeToggle({ className = "", compact = false }) {
  const { theme, isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-none border-2 border-slate-800 bg-[#F9F8F4] ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      aria-label="Toggle Dark Mode"
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 select-none ${
        isDark
          ? "bg-[#1e293b] text-yellow-300 border-[#475569] shadow-[2px_2px_0px_#000000] hover:bg-[#334155] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          : "bg-[#F9F8F4] text-slate-800 border-[#334155] shadow-[2px_2px_0px_#334155] hover:bg-[#fce6b6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      } ${className}`}
    >
      {isDark ? (
        <>
          <FaSun className="text-yellow-400 text-xs shrink-0 animate-[spin_10s_linear_infinite]" />
          {!compact && <span>Light</span>}
        </>
      ) : (
        <>
          <FaMoon className="text-slate-700 text-xs shrink-0" />
          {!compact && <span>Dark</span>}
        </>
      )}
    </button>
  );
}
