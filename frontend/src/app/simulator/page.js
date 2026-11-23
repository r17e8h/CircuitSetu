"use client";

import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
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
  const { theme, isDark } = useTheme();
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [simResults, setSimResults] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [hasAttemptedRun, setHasAttemptedRun] = useState(false);
  const [simMode, setSimMode] = useState("digital"); // Default to DLCD Digital Logic mode

  // Trigger digital re-simulation immediately upon switch toggle or wire/component edits
  const handleTriggerSim = useCallback((currentComponents = components, currentWires = wires) => {
    if (simMode === "digital") {
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
  }, [simMode, components, wires]);

  useEffect(() => {
    setHasMounted(true);
    const savedComponents = localStorage.getItem("circuit_components");
    const savedWires = localStorage.getItem("circuit_wires");
    
    let parsedComps = [];
    let parsedWires = [];

    if (savedComponents) {
      try {
        const raw = JSON.parse(savedComponents);
        // Ensure all components have ports
        parsedComps = raw.map((c) => ({
          ...c,
          ports: c.ports && c.ports.length > 0 ? c.ports : getDefaultPorts(c.type)
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

    // Auto-run initial digital simulation if components exist
    if (parsedComps.length > 0) {
      try {
        const result = simulateDigitalCircuit(parsedComps, parsedWires);
        setSimResults(result);
        if (result.wires) {
          setWires(result.wires);
        }
      } catch (e) {
        console.error("Initial digital simulation error", e);
      }
    }

    if (document.querySelector('script[src="/CircuitSetu/circuit_engine.js"]')) {
      return; 
    }
    window["Module"] = window["Module"] || {};
    window["Module"].onRuntimeInitialized = () => {
      console.log("C++ WebAssembly Brain Fully Online!");
      window.wasmReady = true;
    };
    const script = document.createElement("script");
    script.src = "/CircuitSetu/circuit_engine.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // When switching modes, re-evaluate if in digital mode
  const handleModeChange = (newMode) => {
    setSimMode(newMode);
    if (newMode === "digital") {
      handleTriggerSim(components, wires);
    } else {
      setSimResults(null);
    }
  };

  const handleAddComponent = (type) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const baseX = isMobile ? 50 : 100;
    const baseY = isMobile ? 50 : 100;
    const offset = (components.length % 10) * 20;

    const newComp = createComponent(type, baseX + offset, baseY + offset);
    const updatedComponents = [...components, newComp];
    setComponents(updatedComponents);

    if (simMode === "digital" && isDigitalType(type)) {
      handleTriggerSim(updatedComponents, wires);
    }
  };

  if (!hasMounted) {
    return (
      <div className={`h-screen w-full ${isDark ? "bg-[#0b0f17]" : "bg-[#F9F8F4]"}`}></div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className={`flex flex-col w-full h-screen overflow-hidden font-mono selection:bg-[#a8d5ba] transition-colors duration-200 ${
        isDark ? "bg-[#0b0f17] text-slate-100" : "bg-[#F9F8F4] text-slate-800"
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`h-14 border-b-2 flex items-center px-3 md:px-6 justify-between shrink-0 z-20 transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#0f172a] shadow-[0_4px_0px_#000000]"
            : "border-slate-800 bg-[#fce6b6] shadow-[0_4px_0px_#334155]"
        }`}
      >
        {/* Left Side: Exit button & Title */}
        <div className="flex items-center gap-2.5 md:gap-6">
          <Link
            href="/"
            className={`transition-colors flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold border-2 px-2 md:px-3 py-1 hover:translate-x-[1px] hover:translate-y-[1px] ${
              isDark
                ? "text-slate-200 bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000] hover:bg-[#334155]"
                : "text-slate-800 bg-[#F9F8F4] border-slate-800 shadow-[2px_2px_0px_#334155] hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FaArrowLeft className="text-xs" />
            <span className="hidden md:inline">Exit Workspace</span>
          </Link>
          <div className={`h-6 w-[2px] ${isDark ? "bg-[#334155]" : "bg-slate-800"}`}></div>
          <span className="font-bold tracking-widest uppercase text-[10px] md:text-xs flex items-center gap-2">
            <span
              className={`w-2 h-2 md:w-3 md:h-3 border-2 animate-pulse ${
                isDark ? "border-[#475569] bg-[#22c55e]" : "border-slate-800 bg-[#a8d5ba]"
              }`}
            ></span>
            <span className={isDark ? "text-slate-200" : "text-slate-800"}>
              CircuitSetu / {simMode === "digital" ? "DLCD Engine" : "Analog Core"}
            </span>
          </span>
        </div>

        {/* Right Side: Dual-Mode Selector & Dark Mode Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Dual-Mode Selector */}
          <div
            className={`flex items-center gap-1 border-2 p-0.5 ${
              isDark
                ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                : "bg-[#F9F8F4] border-slate-800 shadow-[2px_2px_0px_#334155]"
            }`}
          >
            <button
              onClick={() => handleModeChange("digital")}
              className={`px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
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
              className={`px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
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
      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
        {/* Left Sidebar: Toolbox */}
        <div
          className={`w-full h-auto md:w-64 md:h-full border-b-2 md:border-b-0 md:border-r-2 shrink-0 flex flex-col relative z-10 overflow-hidden transition-colors duration-200 ${
            isDark
              ? "border-[#334155] bg-[#0f172a] shadow-[0_4px_0px_#000] md:shadow-[4px_0_0px_#000]"
              : "border-slate-800 bg-[#c8e1e9] shadow-[0_4px_0px_rgba(51,65,85,0.1)] md:shadow-[4px_0_0px_rgba(51,65,85,0.1)]"
          }`}
        >
          <Sidebar 
            onAddComponent={handleAddComponent} 
            simMode={simMode}
            setSimMode={handleModeChange}
            isDark={isDark}
          />
        </div>

        {/* Center: CircuitCanvas */}
        <div 
          className={`flex-1 relative h-[50vh] md:h-full overflow-hidden transition-colors duration-200 ${
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

        {/* Right Sidebar: Properties & Simulation Panels */}
        <div
          className={`w-full h-auto md:w-80 md:h-full border-t-2 md:border-t-0 md:border-l-2 shrink-0 flex flex-col relative z-10 overflow-y-auto transition-colors duration-200 ${
            isDark
              ? "border-[#334155] bg-[#0f172a] shadow-[0_-4px_0px_#000] md:shadow-[-4px_0_0px_#000]"
              : "border-slate-800 bg-[#bfe3cc] shadow-[0_-4px_0px_rgba(51,65,85,0.1)] md:shadow-[-4px_0_0px_rgba(51,65,85,0.1)]"
          }`}
        >
          <div
            className={`h-auto md:h-[260px] border-b-2 shrink-0 ${
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
          <div className="flex-1 flex flex-col min-h-[300px]">
            <SimulationPanel 
              components={components}
              wires={wires}
              setSimResults={setSimResults}
              setHasAttemptedRun={setHasAttemptedRun}
              simMode={simMode}
              setSimMode={handleModeChange}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
