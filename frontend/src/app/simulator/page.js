"use client";

import Link from "next/link";
import { FaArrowLeft, FaToolbox, FaSlidersH, FaPlay, FaChevronDown } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { createComponent, getDefaultPorts, isDigitalType } from "../../lib/digitalSchema";
import { simulateDigitalCircuit } from "../../lib/netlistGenerator";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";

const Sidebar = dynamic(() => import("../../components/Sidebar"), { ssr: false });
const PropertiesPanel = dynamic(() => import("../../components/PropertiesPanel"), { ssr: false });
const SimulationPanel = dynamic(() => import("../../components/SimulationPanel"), { ssr: false });
const CircuitCanvas = dynamic(() => import("../../components/CircuitCanvas"), { ssr: false });

export default function SimulatorWorkspace() {
  const { isDark } = useTheme();
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [simResults, setSimResults] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [hasAttemptedRun, setHasAttemptedRun] = useState(false);
  const [simMode, setSimMode] = useState("digital"); // Default to DLCD Digital Logic mode
  const [mobileDrawer, setMobileDrawer] = useState(null); // null | "toolbox" | "properties" | "simulate"

  // Trigger digital re-simulation immediately upon switch toggle or wire/component edits
  const handleTriggerSim = useCallback(
    (currentComponents = components, currentWires = wires, modeOverride = simMode) => {
      if (modeOverride === "digital") {
        try {
          const result = simulateDigitalCircuit(currentComponents, currentWires);
          setSimResults(result);
          if (result.wires) {
            setWires(result.wires);
          }
        } catch (err) {
          console.error("Digital auto-simulation error:", err);
        }
      }
    },
    [simMode, components, wires]
  );

  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem("circuit_components", JSON.stringify(components));
      localStorage.setItem("circuit_wires", JSON.stringify(wires));
    } catch (e) {
      console.error("Error saving circuit to localStorage:", e);
    }
  }, [components, wires, hasMounted]);

  useEffect(() => {
    setHasMounted(true);
    const savedComponents = localStorage.getItem("circuit_components");
    const savedWires = localStorage.getItem("circuit_wires");

    let parsedComps = [];
    let parsedWires = [];

    if (savedComponents) {
      try {
        const raw = JSON.parse(savedComponents);
        parsedComps = raw.map((c) => ({
          ...c,
          rotation: c.rotation || 0,
          label: c.label || "",
          ports: c.ports && c.ports.length > 0 ? c.ports : getDefaultPorts(c.type),
        }));
        setComponents(parsedComps);
      } catch (e) {
        console.error("Error loading saved components", e);
      }
    }

    if (savedWires) {
      try {
        parsedWires = JSON.parse(savedWires);
        setWires(parsedWires);
      } catch (e) {
        console.error("Error loading saved wires", e);
      }
    }

    const runInitialSim = () => {
      if (parsedComps.length === 0) return;
      try {
        const result = simulateDigitalCircuit(parsedComps, parsedWires);
        setSimResults(result);
        if (result.wires) {
          setWires(result.wires);
        }
      } catch (e) {
        console.error("Initial digital simulation error", e);
      }
    };
    if (window.wasmReady || window.Module?.calledRun) {
      window.wasmReady = true;
      runInitialSim();
      return;
    }

    if (
      window.__wasmScriptInjected ||
      document.querySelector('script[src="/CircuitSetu/circuit_engine.js"]')
    ) {
      return;
    }

    window.__wasmScriptInjected = true;
    window.Module = window.Module || {};
    window.Module.locateFile = (path) => `/CircuitSetu/${path}`;
    window.Module.onRuntimeInitialized = () => {
      window.wasmReady = true;
      runInitialSim();
    };

    const script = document.createElement("script");
    script.src = "/CircuitSetu/circuit_engine.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if ((e.key === "r" || e.key === "R") && selectedComponent) {
        e.preventDefault();
        setComponents((prev) =>
          prev.map((c) =>
            c.id === selectedComponent
              ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 }
              : c
          )
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedComponent]);

  const handleModeChange = (newMode) => {
    setSimMode(newMode);
    if (newMode === "digital") {
      handleTriggerSim(components, wires, "digital");
    } else {
      setSimResults(null);
    }
  };

  const handleAddComponent = (type) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const baseX = isMobile ? 60 : 120;
    const baseY = isMobile ? 70 : 110;
    const offset = (components.length % 8) * 24;

    const newComp = createComponent(type, baseX + offset, baseY + offset);
    const updatedComponents = [...components, newComp];
    setComponents(updatedComponents);
    setSelectedComponent(newComp.id);

    if (isMobile) {
      setMobileDrawer(null);
    }

    if (simMode === "digital" && isDigitalType(type)) {
      handleTriggerSim(updatedComponents, wires);
    }
  };

  const toggleMobileDrawer = (tab) => {
    setMobileDrawer((prev) => (prev === tab ? null : tab));
  };

  if (!hasMounted) {
    return (
      <div className={`h-dvh w-full ${isDark ? "bg-[#0b0f17]" : "bg-[#F9F8F4]"}`}></div>
    );
  }

  const hasConflict = Object.values(simResults?.nets || {}).includes(-2);

  return (
    <div
      suppressHydrationWarning
      className={`flex flex-col w-full h-dvh overflow-hidden font-mono selection:bg-[#a8d5ba] transition-colors duration-200 ${
        isDark ? "bg-[#0b0f17] text-slate-100" : "bg-[#F9F8F4] text-slate-800"
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`h-12 md:h-14 border-b-2 flex items-center px-2.5 sm:px-4 md:px-6 justify-between gap-2 shrink-0 z-30 transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#0f172a] shadow-[0_4px_0px_#000000]"
            : "border-slate-800 bg-[#fce6b6] shadow-[0_4px_0px_#334155]"
        }`}
      >
        {/* Left Side: Exit button & Title */}
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          <Link
            href="/"
            aria-label="Exit Workspace"
            className={`transition-colors flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold border-2 px-2 md:px-3 py-1 shrink-0 hover:translate-x-[1px] hover:translate-y-[1px] ${
              isDark
                ? "text-slate-200 bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000] hover:bg-[#334155]"
                : "text-slate-800 bg-[#F9F8F4] border-slate-800 shadow-[2px_2px_0px_#334155] hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FaArrowLeft className="text-xs" />
            <span className="hidden md:inline">Exit Workspace</span>
          </Link>
          <div className={`hidden sm:block h-6 w-[2px] shrink-0 ${isDark ? "bg-[#334155]" : "bg-slate-800"}`}></div>
          <span className="font-bold tracking-wider md:tracking-widest uppercase text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 truncate">
            <span
              className={`w-2 h-2 md:w-3 md:h-3 border-2 shrink-0 animate-pulse ${
                isDark ? "border-[#475569] bg-[#22c55e]" : "border-slate-800 bg-[#a8d5ba]"
              }`}
            ></span>
            <span className={`truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              <span className="sm:hidden">CircuitSetu</span>
              <span className="hidden sm:inline">
                CircuitSetu / {simMode === "digital" ? "DLCD Engine" : "Analog Core"}
              </span>
            </span>
          </span>
        </div>

        {/* Right Side: Dual-Mode Selector & Dark Mode Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          {/* Dual-Mode Selector */}
          <div
            className={`flex items-center gap-0.5 sm:gap-1 border-2 p-0.5 ${
              isDark
                ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                : "bg-[#F9F8F4] border-slate-800 shadow-[2px_2px_0px_#334155]"
            }`}
          >
            <button
              onClick={() => handleModeChange("digital")}
              className={`px-1.5 sm:px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                simMode === "digital"
                  ? isDark
                    ? "bg-[#10b981] text-slate-950 border border-emerald-400 shadow-[1px_1px_0px_#000]"
                    : "bg-[#a8d5ba] text-slate-900 border border-slate-800 shadow-[1px_1px_0px_#334155]"
                  : isDark
                    ? "text-slate-300 hover:bg-[#334155]"
                    : "text-slate-600 hover:bg-[#fce6b6]"
              }`}
            >
              ⚡ Digital
            </button>
            <button
              onClick={() => handleModeChange("analog")}
              className={`px-1.5 sm:px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                simMode === "analog"
                  ? isDark
                    ? "bg-[#10b981] text-slate-950 border border-emerald-400 shadow-[1px_1px_0px_#000]"
                    : "bg-[#a8d5ba] text-slate-900 border border-slate-800 shadow-[1px_1px_0px_#334155]"
                  : isDark
                    ? "text-slate-300 hover:bg-[#334155]"
                    : "text-slate-600 hover:bg-[#fce6b6]"
              }`}
            >
              🔋 Analog
            </button>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Left Sidebar: Toolbox */}
        <div
          className={`hidden md:flex md:w-64 md:h-full md:border-r-2 shrink-0 flex-col relative z-10 overflow-hidden transition-colors duration-200 ${
            isDark
              ? "border-[#334155] bg-[#0f172a] shadow-[4px_0_0px_#000]"
              : "border-slate-800 bg-[#c8e1e9] shadow-[4px_0_0px_rgba(51,65,85,0.1)]"
          }`}
        >
          <Sidebar
            onAddComponent={handleAddComponent}
            simMode={simMode}
            setSimMode={handleModeChange}
            isDark={isDark}
          />
        </div>

        <div
          className={`flex-1 relative min-h-0 h-full overflow-hidden transition-colors duration-200 ${
            isDark ? "bg-[#0d131f]" : "bg-[#F9F8F4]"
          }`}
          style={{ touchAction: "none" }}
        >
          <CircuitCanvas
            components={components}
            setComponents={setComponents}
            wires={wires}
            setWires={setWires}
            simResults={simResults}
            setSimResults={setSimResults}
            selectedComponent={selectedComponent}
            setSelectedComponent={setSelectedComponent}
            hasAttemptedRun={hasAttemptedRun}
            simMode={simMode}
            onTriggerSim={handleTriggerSim}
            isDark={isDark}
          />
        </div>

        {/* Desktop Right Sidebar: Properties & Simulation Panels */}
        <div
          className={`hidden md:flex md:w-80 md:h-full md:border-l-2 shrink-0 flex-col relative z-10 overflow-y-auto transition-colors duration-200 ${
            isDark
              ? "border-[#334155] bg-[#0f172a] shadow-[-4px_0_0px_#000]"
              : "border-slate-800 bg-[#bfe3cc] shadow-[-4px_0_0px_rgba(51,65,85,0.1)]"
          }`}
        >
         <div
            className={`h-auto max-h-[55%] flex flex-col border-b-2 shrink-0 overflow-hidden ${
              isDark ? "border-[#334155]" : "border-slate-800"
            }`}
          >
            <PropertiesPanel
              components={components}
              setComponents={setComponents}
              selectedComponent={selectedComponent}
              simResults={simResults}
              onTriggerSim={handleTriggerSim}
              isDark={isDark}
            />
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <SimulationPanel
              components={components}
              setComponents={setComponents}
              wires={wires}
              simResults={simResults}
              setSimResults={setSimResults}
              setHasAttemptedRun={setHasAttemptedRun}
              simMode={simMode}
              isDark={isDark}
            />
          </div>
        </div>

        {mobileDrawer && (
          <div
            className={`md:hidden fixed inset-x-0 bottom-12 z-30 h-[46dvh] border-t-2 flex flex-col shadow-[0_-6px_0px_rgba(0,0,0,0.35)] transition-colors duration-200 ${
              isDark
                ? "border-[#475569] bg-[#0f172a]"
                : "border-slate-800 bg-[#F9F8F4]"
            }`}
          >
            {/* Drawer Collapse Handle Bar */}
            <button
              type="button"
              onClick={() => setMobileDrawer(null)}
              className={`w-full py-1.5 px-3 border-b-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest shrink-0 cursor-pointer ${
                isDark
                  ? "bg-[#1e293b] border-[#334155] text-emerald-400"
                  : "bg-[#fce6b6] border-slate-800 text-slate-900"
              }`}
            >
              <span>
                {mobileDrawer === "toolbox"
                  ? "Tap Component to Add"
                  : mobileDrawer === "properties"
                    ? "Component Inspector"
                    : "Simulation & Telemetry"}
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                Close <FaChevronDown />
              </span>
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {mobileDrawer === "toolbox" && (
                <Sidebar
                  onAddComponent={handleAddComponent}
                  simMode={simMode}
                  setSimMode={handleModeChange}
                  isDark={isDark}
                />
              )}
              {mobileDrawer === "properties" && (
                <PropertiesPanel
                  components={components}
                  setComponents={setComponents}
                  selectedComponent={selectedComponent}
                  simResults={simResults}
                  onTriggerSim={handleTriggerSim}
                  isDark={isDark}
                />
              )}
              {mobileDrawer === "simulate" && (
                <SimulationPanel
                  components={components}
                  setComponents={setComponents}
                  wires={wires}
                  simResults={simResults}
                  setSimResults={setSimResults}
                  setHasAttemptedRun={setHasAttemptedRun}
                  simMode={simMode}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        )}

        {/* Mobile Fixed Bottom Action Bar (< md) */}
        <nav
          className={`md:hidden h-12 border-t-2 grid grid-cols-3 shrink-0 z-40 transition-colors duration-200 ${
            isDark
              ? "border-[#334155] bg-[#0f172a] text-slate-200"
              : "border-slate-800 bg-[#fce6b6] text-slate-900"
          }`}
        >
          <button
            type="button"
            onClick={() => toggleMobileDrawer("toolbox")}
            className={`flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider border-r-2 cursor-pointer transition-colors ${
              isDark ? "border-[#334155]" : "border-slate-800"
            } ${
              mobileDrawer === "toolbox"
                ? isDark
                  ? "bg-[#10b981] text-slate-950"
                  : "bg-[#a8d5ba] text-slate-950"
                : ""
            }`}
          >
            <FaToolbox className="text-xs" />
            <span>Toolbox</span>
          </button>

          <button
            type="button"
            onClick={() => toggleMobileDrawer("properties")}
            className={`flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider border-r-2 cursor-pointer transition-colors relative ${
              isDark ? "border-[#334155]" : "border-slate-800"
            } ${
              mobileDrawer === "properties"
                ? isDark
                  ? "bg-[#10b981] text-slate-950"
                  : "bg-[#a8d5ba] text-slate-950"
                : ""
            }`}
          >
            <FaSlidersH className="text-xs" />
            <span>Inspect</span>
            {selectedComponent && mobileDrawer !== "properties" && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-black" />
            )}
          </button>

          <button
            type="button"
            onClick={() => toggleMobileDrawer("simulate")}
            className={`flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors ${
              mobileDrawer === "simulate"
                ? isDark
                  ? "bg-[#10b981] text-slate-950"
                  : "bg-[#a8d5ba] text-slate-950"
                : ""
            }`}
          >
            <FaPlay className="text-[10px]" />
            <span>Engine</span>
            <span
              className={`w-2 h-2 rounded-full border border-black ${
                hasConflict ? "bg-red-500" : "bg-emerald-400"
              }`}
            />
          </button>
        </nav>
      </div>
    </div>
  );
}
