"use client"
import { useState } from "react"
import { generateSimulationPayload } from "../lib/netlistGenerator"

export default function SimulationPanel({ components, wires, setSimResults }) {
  const [status, setStatus] = useState("Idle")
  const [solveTime, setSolveTime] = useState("--");

const handleRun = () => {
    const isReady = typeof window !== "undefined" && (window.wasmReady || (window.Module && window.Module.cwrap));

    if (!isReady) {
      setStatus("Engine Warming Up...");
      console.warn("WASM not ready yet. Ensure circuit_engine.js and .wasm are in /public");
      return;
    }
    setStatus("Solving Matrix...");
    
    try {
      if (!components || components.length === 0) {
        setStatus("Canvas is empty");
        return;
      }
      setStatus("Solving...");
      const rawPayload = generateSimulationPayload(components, wires);
      const safeStringPayload = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
      console.log("Sending to C++:", safeStringPayload);
      const runSimulation = window.Module.cwrap('run_circuit_simulation', 'string', ['string']);
      const startTime = performance.now();
      const resultString = runSimulation(safeStringPayload);
      const endTime = performance.now();
      const result = JSON.parse(resultString);
      setSimResults(result);
      console.log("C++ Result:", result);
      
      if (result.status === "success") {
        setStatus("Solved Natively");
        setSolveTime((endTime - startTime).toFixed(2));
      } else {
        setStatus("Matrix Error");
        setSolveTime("--");
      }

    } catch (e) {
      console.error("Simulation failed:", e);
      setStatus("C++ Error");
      setSolveTime("--");
    }
  }
  const nodeCount = wires ? wires.length + 1 : 0;
  const counts = components?.reduce((acc, comp) => {
    acc[comp.type] = (acc[comp.type] || 0) + 1;
    return acc;
  }, {}) || {};

  const meterCount = (counts.ammeter || 0) + (counts.voltmeter || 0);
  const sourceCount = (counts.battery || 0) + (counts.voltage_source || 0);

 return (
    <aside className="w-full h-full flex flex-col font-mono text-slate-800">
      <div className="p-4 border-b-2 border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)] z-10 shrink-0">
        <h2 className="font-bold uppercase tracking-widest text-sm text-center">Global Engine</h2>
      </div>
      <div className="mt-auto p-5 bg-[#F9F8F4] border-t-2 border-[#334155] flex-1 flex flex-col justify-end">
        <div className="mb-auto mt-2">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest border-b-2 border-slate-300 pb-1">
            Bill of Materials
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            <div className="bg-white border-2 border-[#334155] p-2 flex justify-between items-center shadow-[2px_2px_0px_#334155]">
              <span className="text-slate-500">RESISTORS</span>
              <span className="text-[#528b6a] text-xs">{counts.resistor || 0}</span>
            </div>
            <div className="bg-white border-2 border-[#334155] p-2 flex justify-between items-center shadow-[2px_2px_0px_#334155]">
              <span className="text-slate-500">SOURCES</span>
              <span className="text-[#528b6a] text-xs">{sourceCount}</span>
            </div>
            <div className="bg-white border-2 border-[#334155] p-2 flex justify-between items-center shadow-[2px_2px_0px_#334155]">
              <span className="text-slate-500">METERS</span>
              <span className="text-[#528b6a] text-xs">{meterCount}</span>
            </div>
            <div className="bg-white border-2 border-[#334155] p-2 flex justify-between items-center shadow-[2px_2px_0px_#334155]">
              <span className="text-slate-500">WIRES</span>
              <span className="text-[#528b6a] text-xs">{wires?.length || 0}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleRun}
          className="w-full py-3 mt-6 bg-[#a8d5ba] border-2 border-[#334155] font-bold tracking-widest uppercase shadow-[4px_4px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#334155] active:bg-[#64a982] transition-all mb-6 flex items-center justify-center gap-2"
        >
          <span className={`w-2 h-2 rounded-full border border-[#334155] ${status === "Idle" ? "bg-red-500" : "bg-green-500 animate-pulse"}`}></span>
          Run Simulation
        </button>
        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest border-b-2 border-slate-300 pb-1">
          WASM Telemetry
        </h3>  
        <div className="space-y-2 text-xs font-bold bg-[#e2e8f0] border-2 border-[#334155] p-3 shadow-inner text-slate-600 mb-2">
          <div className="flex justify-between border-b border-dashed border-slate-400 pb-1">
            <span>Engine Status:</span>
            <span className={status.includes("Error") ? "text-red-500" : "text-[#528b6a]"}>{status}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-400 pb-1">
            <span>Execution Time:</span>
            <span className="text-[#528b6a]">{solveTime} ms</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-400 pb-1">
            <span>MNA Matrix:</span>
            <span className="text-slate-800">{nodeCount}x{nodeCount}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>Backend:</span>
            <span className="bg-slate-800 text-white px-1 rounded-sm text-[10px]">C++ / EIGEN</span>
          </div>
        </div>
      </div>
    </aside>
  )
}