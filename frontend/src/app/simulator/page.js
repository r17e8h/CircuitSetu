"use client"

import Link from "next/link"
import { FaArrowLeft } from "react-icons/fa"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
const Sidebar = dynamic(() => import("../../components/Sidebar"), { ssr: false });
const PropertiesPanel = dynamic(() => import("../../components/PropertiesPanel"), { ssr: false });
const SimulationPanel = dynamic(() => import("../../components/SimulationPanel"), { ssr: false });
const CircuitCanvas = dynamic(() => import("../../components/CircuitCanvas"), { ssr: false });

export default function SimulatorWorkspace() {
  const [components, setComponents] = useState([])
  const [wires, setWires] = useState([])
  const [simResults, setSimResults] = useState(null)
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [hasMounted, setHasMounted] = useState(false);
  const [hasAttemptedRun, setHasAttemptedRun] = useState(false);
  useEffect(() => {
    setHasMounted(true);
    const savedComponents = localStorage.getItem('circuit_components');
    const savedWires = localStorage.getItem('circuit_wires');
    
    if (savedComponents) {
      setComponents(JSON.parse(savedComponents));
    }
    if (savedWires) {
      setWires(JSON.parse(savedWires));
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
  const handleAddComponent = (type) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const baseX = isMobile ? 50 : 100;
    const baseY = isMobile ? 50 : 100;
    const offset = (components.length % 10) * 20;
    setComponents([
      ...components,
      {
        id: Date.now(),
        type,
        x: baseX + offset,
        y: baseY + offset,
        value: type === "battery" ? 0 : type === "resistor" ? 0 : 0
      }
    ]);
  };
  if (!hasMounted) {
    return <div className="h-screen w-full bg-[#F9F8F4]"></div>;
  }
  return (
    <div suppressHydrationWarning className="flex flex-col w-full h-screen bg-[#F9F8F4] overflow-hidden text-slate-800 font-mono selection:bg-[#a8d5ba]">
      <div className="h-14 border-b-2 border-slate-800 bg-[#fce6b6] flex items-center px-4 md:px-6 justify-between shrink-0 z-20 shadow-[0_4px_0px_#334155]">
        <div className="flex items-center gap-4 md:gap-6">
          <Link 
            href="/" 
            className="text-slate-800 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-xs md:text-sm font-bold border-2 border-slate-800 px-2 md:px-3 py-1 bg-[#F9F8F4] shadow-[2px_2px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <FaArrowLeft className="text-xs" /> <span className="hidden md:inline">Exit Workspace</span>
          </Link>
          <div className="h-6 w-[2px] bg-slate-800"></div>
          <span className="font-bold tracking-widest uppercase text-[10px] md:text-xs flex items-center gap-2">
            <span className="w-2 h-2 md:w-3 md:h-3 border-2 border-slate-800 bg-[#a8d5ba] animate-pulse"></span>
            CircuitSetu / Engine
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
        <div className="w-full h-auto md:w-64 md:h-full border-b-2 md:border-b-0 md:border-r-2 border-slate-800 bg-[#c8e1e9] shrink-0 flex flex-col relative z-10 shadow-[0_4px_0px_rgba(51,65,85,0.1)] md:shadow-[4px_0_0px_rgba(51,65,85,0.1)] overflow-hidden">
          <Sidebar onAddComponent={handleAddComponent} />
        </div>
        <div 
          className="flex-1 relative h-[50vh] md:h-full bg-[#F9F8F4] overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <CircuitCanvas
            components={components}
            setComponents={setComponents}
            wires={wires}
            setWires={setWires}
            simResults={simResults}
            selectedComponent={selectedComponent}
            setSelectedComponent={setSelectedComponent}
            hasAttemptedRun={hasAttemptedRun}
          />
        </div>
        <div className="w-full h-auto md:w-80 md:h-full border-t-2 md:border-t-0 md:border-l-2 border-slate-800 bg-[#bfe3cc] shrink-0 flex flex-col relative z-10 shadow-[0_-4px_0px_rgba(51,65,85,0.1)] md:shadow-[-4px_0_0px_rgba(51,65,85,0.1)] overflow-y-auto">
          <div className="h-auto md:h-[260px] border-b-2 border-slate-800 shrink-0">
            <PropertiesPanel
              components={components}
              setComponents={setComponents}
              selectedComponent={selectedComponent}
            />
          </div>
          <div className="flex-1 flex flex-col min-h-[300px]">
            <SimulationPanel 
              components={components}
              wires={wires}
              setSimResults={setSimResults}
              setHasAttemptedRun={setHasAttemptedRun}
            />
          </div>

        </div>

      </div>
    </div>
  )
}