"use client";

import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { createComponent, getDefaultPorts, isDigitalType } from "../../lib/digitalSchema";
import { simulateDigitalCircuit } from "../../lib/netlistGenerator";

const Sidebar = dynamic(() => import("../../components/Sidebar"), { ssr: false });
const PropertiesPanel = dynamic(() => import("../../components/PropertiesPanel"), { ssr: false });
const SimulationPanel = dynamic(() => import("../../components/SimulationPanel"), { ssr: false });
const CircuitCanvas = dynamic(() => import("../../components/CircuitCanvas"), { ssr: false });

export default function SimulatorWorkspace() {
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
    return <div className="h-screen w-full bg-[#F9F8F4]"></div>;
  }

  return (
    <div suppressHydrationWarning className="flex flex-col w-full h-screen bg-[#F9F8F4] overflow-hidden text-slate-800 font-mono selection:bg-[#a8d5ba]">
      {/* Top Header Bar */}
      <div className="h-14 border-b-2 border-slate-800 bg-[#fce6b6] flex items-center px-4 md:px-6 justify-between shrink-0 z-20 shadow-[0_4px_0px_#334155]">
        <div className="flex items-center gap-3 md:gap-6">
          <Link 
            href="/" 
            className="text-slate-800 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-xs md:text-sm font-bold border-2 border-slate-800 px-2 md:px-3 py-1 bg-[#F9F8F4] shadow-[2px_2px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <FaArrowLeft className="text-xs" /> <span className="hidden md:inline">Exit Workspace</span>
          </Link>
          <div className="h-6 w-[2px] bg-slate-800"></div>
          <span className="font-bold tracking-widest uppercase text-[10px] md:text-xs flex items-center gap-2">
            <span className="w-2 h-2 md:w-3 md:h-3 border-2 border-slate-800 bg-[#a8d5ba] animate-pulse"></span>
            CircuitSetu / {simMode === "digital" ? "DLCD Engine" : "Analog Core"}
          </span>
        </div>

        {/* Dual-Mode Selector in Header */}
        <div className="flex items-center gap-1 bg-[#F9F8F4] border-2 border-slate-800 p-0.5 shadow-[2px_2px_0px_#334155]">
          <button
            onClick={() => handleModeChange("digital")}
            className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              simMode === "digital"
                ? "bg-[#a8d5ba] text-slate-900 border border-slate-800 shadow-[1px_1px_0px_#334155]"
                : "text-slate-600 hover:bg-[#fce6b6]"
            }`}
          >
            ⚡ Digital Logic
          </button>
          <button
            onClick={() => handleModeChange("analog")}
            className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              simMode === "analog"
                ? "bg-[#a8d5ba] text-slate-900 border border-slate-800 shadow-[1px_1px_0px_#334155]"
                : "text-slate-600 hover:bg-[#fce6b6]"
            }`}
          >
            🔋 Analog DC
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
        {/* Left Sidebar: Toolbox */}
        <div className="w-full h-auto md:w-64 md:h-full border-b-2 md:border-b-0 md:border-r-2 border-slate-800 bg-[#c8e1e9] shrink-0 flex flex-col relative z-10 shadow-[0_4px_0px_rgba(51,65,85,0.1)] md:shadow-[4px_0_0px_rgba(51,65,85,0.1)] overflow-hidden">
          <Sidebar 
            onAddComponent={handleAddComponent} 
            simMode={simMode}
            setSimMode={handleModeChange}
          />
        </div>

        {/* Center: CircuitCanvas */}
        <div 
          className="flex-1 relative h-[50vh] md:h-full bg-[#F9F8F4] overflow-hidden"
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
          />
        </div>

        {/* Right Sidebar: Properties & Simulation Panels */}
        <div className="w-full h-auto md:w-80 md:h-full border-t-2 md:border-t-0 md:border-l-2 border-slate-800 bg-[#bfe3cc] shrink-0 flex flex-col relative z-10 shadow-[0_-4px_0px_rgba(51,65,85,0.1)] md:shadow-[-4px_0_0px_rgba(51,65,85,0.1)] overflow-y-auto">
          <div className="h-auto md:h-[260px] border-b-2 border-slate-800 shrink-0">
            <PropertiesPanel
              components={components}
              setComponents={setComponents}
              selectedComponent={selectedComponent}
              simResults={simResults}
              onTriggerSim={handleTriggerSim}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
