"use client";

import Link from "next/link";
import { FaGithub, FaBolt } from "react-icons/fa";
import Logo from "../components/logo";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-dvh w-full overflow-x-hidden font-mono flex flex-col selection:bg-[#a8d5ba] transition-colors duration-200 ${
        isDark ? "bg-[#0b0f17] text-slate-100" : "bg-[#F9F8F4] text-slate-800"
      }`}
      style={{
        backgroundColor: isDark ? "#0b0f17" : "#F9F8F4",
        backgroundImage: isDark
          ? "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)"
          : "linear-gradient(#e2e2e2 1px, transparent 1px), linear-gradient(90deg, #e2e2e2 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* 1. Navbar */}
      <nav
        className={`w-full px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex justify-between items-center gap-2 border-b-2 sticky top-0 z-50 shrink-0 transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#0f172a] shadow-[0_4px_0px_#000000]"
            : "border-slate-800 bg-[#F9F8F4] shadow-[0_4px_0px_#ccc]"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Logo className="h-7 sm:h-8 w-auto shrink-0" />
          <span
            className={`text-lg sm:text-2xl font-bold tracking-tight whitespace-nowrap ${
              isDark ? "text-slate-100" : "text-slate-700"
            }`}
          >
            Circuit<span className="text-[#10b981]">Setu</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-6 text-xs md:text-sm font-bold tracking-widest uppercase shrink-0">
          <Link
            href="/simulator"
            className={`hidden sm:inline-block border-b-2 pb-1 transition-colors ${
              isDark
                ? "border-emerald-400 text-emerald-400"
                : "border-slate-800 text-slate-900"
            }`}
          >
            Simulator
          </Link>
          <a
            href="https://github.com/r17e8h/CircuitSetu"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className={`hidden sm:inline-block border-b-2 border-transparent pb-1 hover:border-slate-400 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Github
          </a>
          <a
            href="https://github.com/r17e8h/CircuitSetu"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub Repository"
            className={`sm:hidden p-1.5 border-2 transition-colors ${
              isDark
                ? "bg-[#1e293b] border-[#475569] text-slate-200 shadow-[2px_2px_0px_#000000]"
                : "bg-white border-slate-800 text-slate-800 shadow-[2px_2px_0px_#334155]"
            }`}
          >
            <FaGithub className="text-sm" />
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* 2. Hero Section */}
      <main
        className={`flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-7 sm:py-10 text-center border-b-2 transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#0f172a]/75"
            : "border-slate-800 bg-white/45"
        }`}
      >
        <div
          className={`inline-block mb-3.5 px-2.5 sm:px-4 py-1 border-2 border-dashed text-[10px] sm:text-xs md:text-sm font-bold tracking-wider sm:tracking-widest uppercase ${
            isDark
              ? "border-amber-500 bg-[#1e293b] text-amber-400"
              : "border-[#bfa75d] bg-[#fcf9e3] text-[#9c8438]"
          }`}
        >
          [Dual-Mode: Analog DC & DLCD Logic]
        </div>

        <h1
          className={`text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-3.5 uppercase leading-tight ${
            isDark ? "text-slate-100" : "text-slate-700"
          }`}
        >
          High-Performance <br /> Circuit Simulation.
        </h1>

        <p
          className={`text-xs sm:text-sm md:text-base mb-5 sm:mb-6 max-w-xl mx-auto leading-relaxed ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Design, wire, and solve analog DC circuits and multi-pin digital logic gates natively
          with an interactive C++ WebAssembly engine.
        </p>

        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2.5 sm:gap-4 justify-center items-center w-full max-w-sm sm:max-w-none">
          <Link
            href="/simulator"
            className="justify-center px-3 sm:px-7 py-2.5 bg-[#10b981] text-slate-950 font-black uppercase tracking-wider border-2 border-slate-900 shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm cursor-pointer"
          >
            <FaBolt className="shrink-0" />
            <span className="sm:hidden">Workspace</span>
            <span className="hidden sm:inline">Enter Workspace</span>
          </Link>
          <a
            href="https://github.com/r17e8h/CircuitSetu"
            target="_blank"
            rel="noreferrer"
            className={`justify-center px-3 sm:px-7 py-2.5 font-bold uppercase tracking-wider border-2 transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm cursor-pointer ${
              isDark
                ? "bg-[#1e293b] text-slate-100 border-[#475569] shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]"
                : "bg-[#8ab4f8] text-slate-900 border-slate-900 shadow-[3px_3px_0px_#0f172a] sm:shadow-[4px_4px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px]"
            }`}
          >
            <FaGithub className="shrink-0" />
            <span className="sm:hidden">GitHub</span>
            <span className="hidden sm:inline">Github Repo</span>
          </a>
        </div>
      </main>

      {/* 3. Feature Highlights Grid */}
      <section
        className={`grid grid-cols-1 md:grid-cols-3 border-b-2 shrink-0 transition-colors duration-200 ${
          isDark ? "border-[#334155]" : "border-slate-800"
        }`}
      >
        <div
          className={`border-b-2 md:border-b-0 md:border-r-2 p-4 md:p-6 flex flex-row md:flex-col items-center text-left md:text-center gap-3.5 md:gap-0 transition-colors duration-200 ${
            isDark
              ? "bg-[#131d2e] border-[#334155] text-slate-200"
              : "bg-[#c8e1e9] border-slate-800 text-slate-800"
          }`}
        >
          <div
            className={`w-16 h-12 md:w-auto md:h-auto md:mb-2.5 md:order-2 border-2 md:border-0 flex items-center justify-center shrink-0 ${
              isDark ? "bg-[#0f172a] border-[#334155] md:bg-transparent" : "bg-white/70 border-slate-800 md:bg-transparent"
            }`}
          >
            <svg
              width="76"
              height="40"
              viewBox="0 0 100 60"
              className={`stroke-2 fill-none ${
                isDark ? "stroke-emerald-400" : "stroke-slate-800"
              }`}
            >
              <circle
                cx="25"
                cy="30"
                r="12"
                className={isDark ? "fill-[#1e293b]" : "fill-[#9aaeb8]"}
              />
              <path d="M 45 30 L 55 30 L 60 15 L 70 45 L 75 30 L 90 30" />
            </svg>
          </div>

          <div className="flex-1 min-w-0 md:contents">
            <h3
              className={`font-bold uppercase tracking-wider md:tracking-widest mb-1 md:mb-3 md:border-b-2 md:pb-1.5 md:w-full md:order-1 text-xs md:text-sm ${
                isDark ? "border-[#334155] text-emerald-400" : "border-slate-800"
              }`}
            >
              C++ MNA Core Engine
            </h3>
            <p className={`text-[11px] sm:text-xs leading-snug md:order-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Modified Nodal Analysis with Eigen3 for fast matrix decomposition.
            </p>
          </div>
        </div>

        <div
          className={`border-b-2 md:border-b-0 md:border-r-2 p-4 md:p-6 flex flex-row md:flex-col items-center text-left md:text-center gap-3.5 md:gap-0 transition-colors duration-200 ${
            isDark
              ? "bg-[#10241e] border-[#334155] text-slate-200"
              : "bg-[#bfe3cc] border-slate-800 text-slate-800"
          }`}
        >
          <div
            className={`w-16 h-12 md:w-auto md:h-auto md:mb-2.5 md:order-2 border-2 md:border-0 flex items-center justify-center shrink-0 ${
              isDark ? "bg-[#0f172a] border-[#334155] md:bg-transparent" : "bg-white/70 border-slate-800 md:bg-transparent"
            }`}
          >
            <svg
              width="60"
              height="38"
              viewBox="0 0 80 60"
              className={`stroke-2 ${
                isDark ? "stroke-slate-200" : "stroke-slate-800"
              }`}
            >
              <rect x="0" y="0" width="80" height="60" fill={isDark ? "#1e293b" : "white"} />
              <rect x="0" y="0" width="20" height="60" fill={isDark ? "#059669" : "#a4c2b0"} />
              <rect x="0" y="0" width="80" height="20" fill={isDark ? "#059669" : "#a4c2b0"} />
              <line x1="0" y1="20" x2="80" y2="20" />
              <line x1="0" y1="40" x2="80" y2="40" />
              <line x1="20" y1="0" x2="20" y2="60" />
              <line x1="50" y1="0" x2="50" y2="60" />
            </svg>
          </div>

          <div className="flex-1 min-w-0 md:contents">
            <h3
              className={`font-bold uppercase tracking-wider md:tracking-widest mb-1 md:mb-3 md:border-b-2 md:pb-1.5 md:w-full md:order-1 text-xs md:text-sm ${
                isDark ? "border-[#334155] text-emerald-400" : "border-slate-800"
              }`}
            >
              DLCD Digital Logic
            </h3>
            <p className={`text-[11px] sm:text-xs leading-snug md:order-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Logic gates, switches, glowing LEDs, and real-time wire state coloring.
            </p>
          </div>
        </div>

        <div
          className={`p-4 md:p-6 flex flex-row md:flex-col items-center text-left md:text-center gap-3.5 md:gap-0 transition-colors duration-200 ${
            isDark
              ? "bg-[#1e1b2e] text-slate-200"
              : "bg-[#fce6b6] text-slate-800"
          }`}
        >
          <div
            className={`w-16 h-12 md:w-auto md:h-auto md:mb-2.5 md:order-2 border-2 md:border-0 flex items-center justify-center shrink-0 ${
              isDark ? "bg-[#0f172a] border-[#334155] md:bg-transparent" : "bg-white/70 border-slate-800 md:bg-transparent"
            }`}
          >
            <svg
              width="72"
              height="38"
              viewBox="0 0 100 60"
              className={`stroke-2 ${
                isDark ? "stroke-slate-200" : "stroke-slate-800"
              }`}
            >
              <rect x="10" y="20" width="20" height="15" fill={isDark ? "#38bdf8" : "#8ab4f8"} />
              <rect x="40" y="5" width="20" height="15" fill={isDark ? "#34d399" : "#a8d5ba"} />
              <rect x="70" y="20" width="20" height="15" fill={isDark ? "#fbbf24" : "#ffcda2"} />
              <rect x="40" y="40" width="20" height="15" fill={isDark ? "#f87171" : "#e2a099"} />
              <line x1="30" y1="27" x2="70" y2="27" />
              <line x1="50" y1="20" x2="50" y2="40" />
            </svg>
          </div>

          <div className="flex-1 min-w-0 md:contents">
            <h3
              className={`font-bold uppercase tracking-wider md:tracking-widest mb-1 md:mb-3 md:border-b-2 md:pb-1.5 md:w-full md:order-1 text-xs md:text-sm ${
                isDark ? "border-[#334155] text-amber-400" : "border-slate-800"
              }`}
            >
              Multi-Port Canvas
            </h3>
            <p className={`text-[11px] sm:text-xs leading-snug md:order-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Interactive schematic editor with exact pin snapping and touch support.
            </p>
          </div>
        </div>
      </section>

      <footer
        className={`py-3 px-4 text-center text-[11px] sm:text-xs font-bold shrink-0 transition-colors duration-200 ${
          isDark
            ? "bg-[#0b0f17] text-slate-400"
            : "bg-[#f0c2a5] text-slate-800"
        }`}
      >
        <span>CircuitSetu • Open Source Web Simulator</span>
      </footer>
    </div>
  );
}
