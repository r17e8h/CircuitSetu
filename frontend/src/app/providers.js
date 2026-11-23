"use client";

import { ThemeProvider } from "../context/ThemeContext";

export function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
