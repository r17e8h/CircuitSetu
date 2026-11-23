"use client";

import { useState } from "react";
import { generateSimulationPayload, simulateDigitalCircuit } from "../lib/netlistGenerator";
import { isDigitalType } from "../lib/digitalSchema";

export default function SimulationPanel({ 
  components, 
  wires, 
  setSimResults, 
  setHasAttemptedRun,
  simMode = "digital",
  setSimMode,
  isDark = false
}) {
  const [status, setStatus] = useState("Idle");
  const [solveTime, setSolveTime] = useState("--");

  const handleRun = () => {
    if (setHasAttemptedRun) setHasAttemptedRun(true);

    if (!components || components.length === 0) {
      setStatus("Canvas is empty");
      return;
    }

    if (simMode === "digital") {
      // DIGITAL LOGIC SIMULATION
      try {
        setStatus("Propagating Logic...");
        const startTime = performance.now();
        const digitalResult = simulateDigitalCircuit(components, wires);
        const endTime = performance.now();

        setSimResults(digitalResult);
        setSolveTime((endTime - startTime).toFixed(2));

        const hasConflict = Object.values(digitalResult.nets || {}).includes(-2);
        if (hasConflict) {
          setStatus("Conflict / Short");
        } else {
          setStatus("Solved Natively");
        }
      } catch (e) {
        console.error("Digital simulation error:", e);
        setStatus("Simulation Error");
        setSolveTime("--");
      }
      return;
    }

    // ANALOG SIMULATION
    const isReady = typeof window !== "undefined" && (window.wasmReady || (window.Module && window.Module.cwrap));

    if (!isReady) {
      setStatus("Engine Warming Up...");
      console.warn("WASM not ready yet. Ensure circuit_engine.js and .wasm are in /public");
      return;
    }

    const hasZeroValues = components.some(
      (c) =>
        (c.type === "resistor" || c.type === "battery") &&
        (Number(c.value) === 0 || !c.value)
    );

    if (hasZeroValues) {
      setStatus("Input Error");
      setSolveTime("--");
      return;
    }

    setStatus("Solving Matrix...");

    try {
      const rawPayload = generateSimulationPayload(components, wires);
      const safeStringPayload = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
      const runSimulation = window.Module.cwrap("run_circuit_simulation", "string", ["string"]);
      const startTime = performance.now();
      const resultString = runSimulation(safeStringPayload);
      const endTime = performance.now();
      const result = JSON.parse(resultString);
      setSimResults(result);

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
  };

  // Bill of Materials breakdown
  const counts =
    components?.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {}) || {};

  const switchCount = counts.SWITCH || 0;
  const ledCount = counts.LED || 0;
  const gateCount =
    (counts.AND || 0) +
    (counts.OR || 0) +
    (counts.NOT || 0) +
    (counts.NAND || 0) +
    (counts.NOR || 0) +
    (counts.XOR || 0) +
    (counts.XNOR || 0);

  const resistorCount = counts.resistor || 0;
  const sourceCount = (counts.battery || 0) + (counts.voltage_source || 0);
  const meterCount = (counts.ammeter || 0) + (counts.voltmeter || 0);
  const wireCount = wires?.length || 0;
  const nodeCount = wires ? wires.length + 1 : 0;

  return (
    <aside
      className={`w-full h-full flex flex-col font-mono transition-colors duration-200 ${
        isDark ? "bg-[#0f172a] text-slate-100" : "text-slate-800"
      }`}
    >
      <div
        className={`p-3 border-b-2 z-10 shrink-0 flex items-center justify-between transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#1e293b] shadow-[0_4px_0px_#000000]"
            : "border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)]"
        }`}
      >
        <h2 className="font-bold uppercase tracking-widest text-xs md:text-sm">
          Simulation Engine
        </h2>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 border uppercase ${
            isDark
              ? "border-[#475569] bg-[#0f172a] text-emerald-400"
              : "border-[#334155] bg-[#F9F8F4] text-slate-800"
          }`}
        >
          {simMode === "digital" ? "DLCD Logic" : "MNA DC"}
        </span>
      </div>

      <div
        className={`mt-auto p-4 border-t-2 flex-1 flex flex-col justify-end transition-colors duration-200 ${
          isDark ? "bg-[#0f172a] border-[#334155]" : "bg-[#F9F8F4] border-[#334155]"
        }`}
      >
        {/* Bill of Materials */}
        <div className="mb-auto mt-1 hidden md:block">
          <h3
            className={`text-[10px] font-bold uppercase mb-2 tracking-widest border-b-2 pb-1 ${
              isDark ? "text-slate-400 border-slate-700" : "text-slate-500 border-slate-300"
            }`}
          >
            Bill of Materials ({simMode.toUpperCase()})
          </h3>
          {simMode === "digital" ? (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>SWITCHES</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{switchCount}</span>
              </div>
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>GATES</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{gateCount}</span>
              </div>
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>LEDS</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{ledCount}</span>
              </div>
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>WIRES</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{wireCount}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>RESISTORS</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{resistorCount}</span>
              </div>
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>SOURCES</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{sourceCount}</span>
              </div>
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>METERS</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{meterCount}</span>
              </div>
              <div
                className={`border-2 p-2 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>WIRES</span>
                <span className={`text-xs ${isDark ? "text-emerald-400" : "text-[#528b6a]"}`}>{wireCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Run Simulation Button */}
        <button
          onClick={handleRun}
          className={`w-full py-2.5 mt-3 md:mt-4 border-2 font-bold tracking-widest uppercase transition-all mb-3 md:mb-4 flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm hover:translate-x-[2px] hover:translate-y-[2px] ${
            isDark
              ? "bg-[#10b981] text-slate-950 border-[#475569] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] active:bg-[#059669]"
              : "bg-[#a8d5ba] text-slate-900 border-[#334155] shadow-[4px_4px_0px_#334155] hover:shadow-[2px_2px_0px_#334155] active:bg-[#64a982]"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black ${
              status === "Idle" || status.includes("Error") || status.includes("Conflict")
                ? "bg-red-500"
                : "bg-green-400 animate-pulse"
            }`}
          />
          Run Simulation
        </button>

        {/* Telemetry Panel */}
        <h3
          className={`text-[10px] font-bold uppercase mb-1.5 tracking-widest border-b-2 pb-1 ${
            isDark ? "text-slate-400 border-slate-700" : "text-slate-500 border-slate-300"
          }`}
        >
          Engine Telemetry
        </h3>
        <div
          className={`space-y-1.5 text-xs font-bold border-2 p-2.5 shadow-inner ${
            isDark
              ? "bg-[#1e293b] border-[#475569] text-slate-300"
              : "bg-[#e2e8f0] border-[#334155] text-slate-600"
          }`}
        >
          <div
            className={`flex justify-between border-b border-dashed pb-1 ${
              isDark ? "border-slate-700" : "border-slate-400"
            }`}
          >
            <span>Status:</span>
            <span
              className={
                status.includes("Error") || status.includes("Conflict")
                  ? "text-red-500 font-black"
                  : isDark ? "text-emerald-400" : "text-[#528b6a]"
              }
            >
              {status}
            </span>
          </div>
          <div
            className={`flex justify-between border-b border-dashed pb-1 hidden md:flex ${
              isDark ? "border-slate-700" : "border-slate-400"
            }`}
          >
            <span>Execution Time:</span>
            <span className={isDark ? "text-emerald-400" : "text-[#528b6a]"}>{solveTime} ms</span>
          </div>
          <div
            className={`flex justify-between border-b border-dashed pb-1 hidden md:flex ${
              isDark ? "border-slate-700" : "border-slate-400"
            }`}
          >
            <span>Circuit Size:</span>
            <span className={isDark ? "text-slate-100" : "text-slate-800"}>
              {simMode === "digital" ? `${gateCount + switchCount} digital parts` : `${nodeCount}x${nodeCount} MNA`}
            </span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span>Backend:</span>
            <span
              className={`px-1 rounded-sm text-[9px] ${
                isDark
                  ? "bg-[#0f172a] text-emerald-300 border border-slate-700"
                  : "bg-slate-800 text-white"
              }`}
            >
              {simMode === "digital" ? "DLCD / C++ WASM" : "C++ / EIGEN"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
