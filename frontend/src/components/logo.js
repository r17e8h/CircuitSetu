"use client";

import { useTheme } from "../context/ThemeContext";

export default function Logo({ className = "h-8 w-auto" }) {
  const { isDark } = useTheme();

  return (
    <img 
      src="/CircuitSetu/logo.svg" 
      alt="CircuitSetu Logo" 
      className={`transition-all ${isDark ? "invert brightness-125" : ""} ${className}`} 
      draggable="false"
    />
  );
}
