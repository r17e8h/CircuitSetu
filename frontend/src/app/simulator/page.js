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
  useEffect(() => {
    setHasMounted(true);
    if (document.querySelector('script[src="/circuit_engine.js"]')) {
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
  if (!hasMounted) {
    return <div className="h-screen w-full bg-[#F9F8F4]"></div>;
  }
  return (
    <div suppressHydrationWarning className="flex flex-col w-full h-screen bg-[#F9F8F4] overflow-hidden text-slate-800 font-mono selection:bg-[#a8d5ba]">
      <div className="h-14 border-b-2 border-slate-800 bg-[#fce6b6] flex items-center px-6 justify-between shrink-0 z-20 shadow-[0_4px_0px_#334155]">
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-slate-800 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold border-2 border-slate-800 px-3 py-1 bg-[#F9F8F4] shadow-[2px_2px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <FaArrowLeft className="text-xs" /> Exit Workspace
          </Link>
          <div className="h-6 w-[2px] bg-slate-800"></div>
          <span className="font-bold tracking-widest uppercase text-xs flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-slate-800 bg-[#a8d5ba] animate-pulse"></span>
            CircuitSetu / Engine_Live
          </span>
        </div>
      </div>
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="w-64 border-r-2 border-slate-800 bg-[#c8e1e9] shrink-0 flex flex-col relative z-10 shadow-[4px_0_0px_rgba(51,65,85,0.1)]">
          <Sidebar />
        </div>
        <div 
          className="flex-1 relative h-full bg-[#F9F8F4]"
          style={{
            backgroundImage: 'linear-gradient(#e2e2e2 1px, transparent 1px), linear-gradient(90deg, #e2e2e2 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          <CircuitCanvas
              components={components}
              setComponents={setComponents}
              wires={wires}
              setWires={setWires}
              simResults={simResults}
              selectedComponent={selectedComponent}
              setSelectedComponent={setSelectedComponent}
          />
        </div>
        <div className="w-80 border-l-2 border-slate-800 bg-[#bfe3cc] shrink-0 flex flex-col relative z-10 shadow-[-4px_0_0px_rgba(51,65,85,0.1)]">
          <div className="h-[260px] border-b-2 border-slate-800 overflow-hidden">
            <PropertiesPanel
              components={components}
              setComponents={setComponents}
              selectedComponent={selectedComponent}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <SimulationPanel 
              components={components}
              wires={wires}
              setSimResults={setSimResults}
            />
          </div>

        </div>

      </div>

    </div>
  )
}