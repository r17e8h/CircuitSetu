"use client";

import { useState, useEffect, useRef } from "react";
import { generateSimulationPayload, simulateDigitalCircuit } from "../lib/netlistGenerator";
import { isDigitalType } from "../lib/digitalSchema";

const MAX_TRUTH_TABLE_INPUTS = 6;

export default function SimulationPanel({
  components,
  setComponents,
  wires,
  simResults,
  setSimResults,
  setHasAttemptedRun,
  simMode = "digital",
  isDark = false
}) {
  const [status, setStatus] = useState("Idle");
  const [solveTime, setSolveTime] = useState("--");
  const [diagnosticNote, setDiagnosticNote] = useState("");
  const [truthTableData, setTruthTableData] = useState(null);
  const [showTruthTable, setShowTruthTable] = useState(false);
  const [copiedType, setCopiedType] = useState(null);
  const manualVerifyRef = useRef(false);

  useEffect(() => {
    if (simMode === "analog") {
      setStatus("Idle");
      setSolveTime("--");
      setDiagnosticNote("");
    }
  }, [simMode, components, wires]);

  useEffect(() => {
    if (simMode !== "digital") return;

    if (!components || components.length === 0) {
      setStatus("Idle");
      setSolveTime("--");
      setDiagnosticNote("");
      return;
    }

    if (manualVerifyRef.current) {
      manualVerifyRef.current = false;
      return;
    }

    if (simResults?.nets) {
      const netValues = Object.values(simResults.nets);
      const hasConflict = netValues.includes(-2);
      const hasFloating = netValues.includes(-1);

      if (hasConflict) {
        setStatus("Conflict / Short");
        setDiagnosticNote("1 & 0 shorted on same wire");
      } else if (simResults.oscillating) {
        setStatus("Oscillation Loop");
        setDiagnosticNote("Unstable feedback did not settle");
      } else {
        setStatus("Live: Solved");
        setDiagnosticNote(
          hasFloating
            ? "Warning: floating pin(s) detected"
            : `Settled in ${simResults.ticks ?? 1} tick(s)`
        );
      }
    }
  }, [simMode, simResults, components]);

  useEffect(() => {
    if (!showTruthTable) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowTruthTable(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showTruthTable]);

  function resolveLedOutput(led, res) {
    if (res?.ledStates && res.ledStates[led.id] !== undefined) {
      return res.ledStates[led.id];
    }
    const portId = led.ports?.[0]?.id || "in";
    const resolvedWires = res?.wires || wires;
    const wire = resolvedWires.find(
      (w) =>
        (w.from === led.id && (w.fromPort || w.fromSide) === portId) ||
        (w.to === led.id && (w.toPort || w.toSide) === portId)
    );
    if (wire?.netId !== undefined && res?.nets?.[wire.netId] !== undefined) {
      return res.nets[wire.netId];
    }
    return -1;
  }

  function formatLogicCell(val) {
    if (val === 1) return "1";
    if (val === 0) return "0";
    if (val === -2) return "ERR";
    return "Z";
  }
  const handleGenerateTruthTable = () => {
    if (setHasAttemptedRun) setHasAttemptedRun(true);

    if (!components || components.length === 0) {
      setStatus("Canvas is empty");
      setDiagnosticNote("");
      return;
    }

    const allSwitches = components
      .filter((c) => c.type === "SWITCH")
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const allLeds = components
      .filter((c) => c.type === "LED")
      .sort((a, b) => a.y - b.y || a.x - b.x);

    if (allSwitches.length === 0) {
      setStatus("Add >= 1 SWITCH");
      setDiagnosticNote("Place at least one SWITCH input");
      return;
    }

    const truncated = allSwitches.length > MAX_TRUTH_TABLE_INPUTS;
    const activeSwitches = allSwitches.slice(0, MAX_TRUTH_TABLE_INPUTS);
    const numInputs = activeSwitches.length;
    const totalRows = 1 << numInputs;

    const inputHeaders = activeSwitches.map((sw, idx) => ({
      id: sw.id,
      name: sw.label?.trim() || `IN${idx + 1}`
    }));

    const outputHeaders = allLeds.map((led, idx) => ({
      id: led.id,
      name: led.label?.trim() || `OUT${idx + 1}`
    }));

    try {
      const startTime = performance.now();
      const currentResult = simulateDigitalCircuit(components, wires);

      const rows = [];
      for (let mask = 0; mask < totalRows; mask++) {
        const assignment = {};
        const inputBits = [];

        for (let bitIdx = 0; bitIdx < numInputs; bitIdx++) {
          const bit = (mask >> (numInputs - 1 - bitIdx)) & 1;
          assignment[activeSwitches[bitIdx].id] = bit;
          inputBits.push(bit);
        }

        const testComponents = components.map((c) =>
          assignment[c.id] !== undefined ? { ...c, state: assignment[c.id] } : c
        );

        const simOut = simulateDigitalCircuit(testComponents, wires);
        const outputBits = allLeds.map((led) => resolveLedOutput(led, simOut));

        rows.push({
          mask,
          assignment,
          inputs: inputBits,
          outputs: outputBits
        });
      }

      const endTime = performance.now();
      const elapsedMs = (endTime - startTime).toFixed(2);

      manualVerifyRef.current = true;
      setSimResults(currentResult);
      setSolveTime(elapsedMs);
      setStatus(`Table: ${totalRows} states`);
      setDiagnosticNote(`${numInputs} in • ${allLeds.length} out`);

      setTruthTableData({
        inputHeaders,
        outputHeaders,
        rows,
        elapsedMs,
        truncated,
        totalSwitchCount: allSwitches.length
      });
      setShowTruthTable(true);
    } catch (e) {
      console.error("Truth table generation error:", e);
      setStatus("Simulation Error");
      setSolveTime("--");
      setDiagnosticNote("");
    }
  };

  const handleRun = () => {
    if (simMode === "digital") {
      handleGenerateTruthTable();
      return;
    }

    if (setHasAttemptedRun) setHasAttemptedRun(true);

    if (!components || components.length === 0) {
      setStatus("Canvas is empty");
      setDiagnosticNote("");
      return;
    }

    const wasmModule = typeof window !== "undefined" ? window["Module"] : null;
    const isReady = Boolean(
      typeof window !== "undefined" &&
        (window["wasmReady"] || (wasmModule && typeof wasmModule.cwrap === "function"))
    );

    if (!isReady || !wasmModule || typeof wasmModule.cwrap !== "function") {
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
      const safeStringPayload =
        typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
      const runSimulation = wasmModule.cwrap("run_circuit_simulation", "string", ["string"]);
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

  const handleApplyRowToCanvas = (assignment) => {
    if (typeof setComponents !== "function") return;
    const updated = components.map((c) =>
      assignment[c.id] !== undefined ? { ...c, state: assignment[c.id] } : c
    );
    setComponents(updated);
    const res = simulateDigitalCircuit(updated, wires);
    setSimResults(res);
  };

  const handleCopyMarkdown = async () => {
    if (!truthTableData) return;
    const { inputHeaders, outputHeaders, rows } = truthTableData;
    const cols = [
      ...inputHeaders.map((h) => h.name),
      ...(outputHeaders.length > 0 ? outputHeaders.map((h) => h.name) : ["OUT"])
    ];
    const headerLine = `| ${cols.join(" | ")} |`;
    const sepLine = `| ${cols.map(() => "---").join(" | ")} |`;
    const bodyLines = rows.map((r) => {
      const outCells =
        r.outputs.length > 0 ? r.outputs.map(formatLogicCell) : ["--"];
      return `| ${[...r.inputs, ...outCells].join(" | ")} |`;
    });

    try {
      await navigator.clipboard.writeText([headerLine, sepLine, ...bodyLines].join("\n"));
      setCopiedType("md");
      setTimeout(() => setCopiedType(null), 1800);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownloadCsv = () => {
    if (!truthTableData) return;
    const { inputHeaders, outputHeaders, rows } = truthTableData;
    const headers = [
      ...inputHeaders.map((h) => h.name),
      ...outputHeaders.map((h) => h.name)
    ];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) => [...r.inputs, ...r.outputs.map(formatLogicCell)].join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "circuitsetu_truth_table.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts =
    components?.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {}) || {};

  const switchCount = counts.SWITCH || 0;
  const ledCount = counts.LED || 0;
  const gateCount =
    components?.filter(
      (c) => isDigitalType(c.type) && c.type !== "SWITCH" && c.type !== "LED"
    ).length || 0;

  const resistorCount = counts.resistor || 0;
  const sourceCount = (counts.battery || 0) + (counts.voltage_source || 0);
  const meterCount = (counts.ammeter || 0) + (counts.voltmeter || 0);
  const wireCount = wires?.length || 0;
  const nodeCount = wires ? wires.length + 1 : 0;

  const isErrorOrWarn =
    status.includes("Error") ||
    status.includes("Conflict") ||
    status.includes("Oscillation") ||
    status.startsWith("Add");

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
          {simMode === "digital" ? "DLCD Live" : "MNA DC"}
        </span>
      </div>

      <div
        className={`p-3.5 flex-1 flex flex-col gap-3.5 overflow-y-auto transition-colors duration-200 ${
          isDark ? "bg-[#0f172a]" : "bg-[#F9F8F4]"
        }`}
      >
        <div>
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

        <button
          onClick={handleRun}
          className={`w-full py-2.5 border-2 font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm hover:translate-x-[2px] hover:translate-y-[2px] ${
            isDark
              ? "bg-[#10b981] text-slate-950 border-[#475569] shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] active:bg-[#059669]"
              : "bg-[#a8d5ba] text-slate-900 border-[#334155] shadow-[4px_4px_0px_#334155] hover:shadow-[2px_2px_0px_#334155] active:bg-[#64a982]"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black ${
              status === "Idle" || status === "Canvas is empty" || isErrorOrWarn
                ? "bg-red-500"
                : "bg-green-400 animate-pulse"
            }`}
          />
          {simMode === "digital" ? "Generate Truth Table" : "Run Simulation"}
        </button>

        {/* Telemetry Panel */}
        <div>
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
                  isErrorOrWarn
                    ? "text-red-500 font-black"
                    : isDark
                      ? "text-emerald-400"
                      : "text-[#528b6a]"
                }
              >
                {status}
              </span>
            </div>

            {simMode === "digital" && diagnosticNote && (
              <div
                className={`text-[10px] border-b border-dashed pb-1 ${
                  isDark ? "border-slate-700 text-slate-400" : "border-slate-400 text-slate-600"
                }`}
              >
                {diagnosticNote}
              </div>
            )}

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
                {simMode === "digital"
                  ? `${gateCount + switchCount} digital parts`
                  : `${nodeCount}x${nodeCount} MNA`}
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
      </div>

      {showTruthTable && truthTableData && (
        <div
          onClick={() => setShowTruthTable(false)}
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-6 font-mono"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[85dvh] flex flex-col border-2 transition-colors ${
              isDark
                ? "bg-[#0f172a] border-[#475569] shadow-[6px_6px_0px_#000000] text-slate-100"
                : "bg-[#F9F8F4] border-slate-900 shadow-[6px_6px_0px_#334155] text-slate-900"
            }`}
          >
            <div
              className={`px-3.5 py-2.5 border-b-2 flex items-center justify-between gap-2 shrink-0 ${
                isDark
                  ? "bg-[#1e293b] border-[#334155]"
                  : "bg-[#fce6b6] border-slate-900"
              }`}
            >
              <div>
                <h3 className="font-black uppercase tracking-wider text-xs sm:text-sm">
                  DLCD Truth Table ({truthTableData.rows.length} States)
                </h3>
                <p
                  className={`text-[10px] ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {truthTableData.inputHeaders.length} Inputs •{" "}
                  {truthTableData.outputHeaders.length} Outputs • Solved in{" "}
                  {truthTableData.elapsedMs} ms
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTruthTable(false)}
                className="w-7 h-7 bg-red-500 text-white border-2 border-slate-900 font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer"
                title="Close Truth Table"
              >
                ×
              </button>
            </div>

            {truthTableData.truncated && (
              <div className="px-3.5 py-1.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border-b border-amber-500/40 shrink-0">
                Showing first {MAX_TRUTH_TABLE_INPUTS} switches (64 rows max) out of{" "}
                {truthTableData.totalSwitchCount} switches.
              </div>
            )}

            {/* Table Body */}
            <div className="flex-1 overflow-auto p-3">
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr>
                    {truthTableData.inputHeaders.map((h) => (
                      <th
                        key={`in-${h.id}`}
                        className={`border-2 px-2.5 py-1.5 font-black uppercase tracking-wider sticky top-0 z-10 ${
                          isDark
                            ? "bg-[#132a24] border-[#475569] text-emerald-300"
                            : "bg-[#c8e1e9] border-slate-800 text-slate-900"
                        }`}
                      >
                        {h.name}
                      </th>
                    ))}

                    {truthTableData.outputHeaders.length > 0 ? (
                      truthTableData.outputHeaders.map((h) => (
                        <th
                          key={`out-${h.id}`}
                          className={`border-2 px-2.5 py-1.5 font-black uppercase tracking-wider sticky top-0 z-10 ${
                            isDark
                              ? "bg-[#2a2112] border-[#475569] text-amber-300"
                              : "bg-[#fce6b6] border-slate-800 text-slate-900"
                          }`}
                        >
                          {h.name}
                        </th>
                      ))
                    ) : (
                      <th
                        className={`border-2 px-2.5 py-1.5 font-black uppercase sticky top-0 z-10 ${
                          isDark
                            ? "bg-[#2a2112] border-[#475569] text-amber-300"
                            : "bg-[#fce6b6] border-slate-800 text-slate-900"
                        }`}
                      >
                        OUTPUTS (ADD LED)
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {truthTableData.rows.map((row) => {
                    const isCurrentCanvasRow = truthTableData.inputHeaders.every(
                      (h, idx) => {
                        const liveSw = components.find((c) => c.id === h.id);
                        return (liveSw?.state ?? 0) === row.inputs[idx];
                      }
                    );

                    return (
                      <tr
                        key={row.mask}
                        onClick={() => handleApplyRowToCanvas(row.assignment)}
                        className={`transition-colors ${
                          typeof setComponents === "function" ? "cursor-pointer" : ""
                        } ${
                          isCurrentCanvasRow
                            ? isDark
                              ? "bg-emerald-950/70"
                              : "bg-[#a8d5ba]/55"
                            : isDark
                              ? "hover:bg-[#1e293b]"
                              : "hover:bg-slate-200/70"
                        }`}
                      >
                        {row.inputs.map((bit, i) => (
                          <td
                            key={`ib-${row.mask}-${i}`}
                            className={`border px-2.5 py-1.5 font-bold ${
                              isDark ? "border-[#334155]" : "border-slate-400"
                            } ${
                              bit === 1
                                ? isDark
                                  ? "text-emerald-400"
                                  : "text-emerald-700"
                                : isDark
                                  ? "text-slate-400"
                                  : "text-slate-600"
                            }`}
                          >
                            {bit}
                          </td>
                        ))}

                        {row.outputs.length > 0 ? (
                          row.outputs.map((val, i) => (
                            <td
                              key={`ob-${row.mask}-${i}`}
                              className={`border px-2.5 py-1.5 font-black ${
                                isDark ? "border-[#334155]" : "border-slate-400"
                              } ${
                                val === 1
                                  ? "bg-[#22c55e]/20 text-[#22c55e]"
                                  : val === -2
                                    ? "bg-red-500/20 text-red-400"
                                    : val === -1
                                      ? "text-amber-400"
                                      : isDark
                                        ? "text-slate-300"
                                        : "text-slate-700"
                              }`}
                            >
                              {formatLogicCell(val)}
                            </td>
                          ))
                        ) : (
                          <td
                            className={`border px-2.5 py-1.5 text-[10px] italic ${
                              isDark
                                ? "border-[#334155] text-slate-400"
                                : "border-slate-400 text-slate-500"
                            }`}
                          >
                            No LED placed
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              className={`px-3.5 py-2.5 border-t-2 flex flex-wrap items-center justify-between gap-2 shrink-0 ${
                isDark
                  ? "bg-[#1e293b] border-[#334155]"
                  : "bg-[#c8e1e9] border-slate-900"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Highlighted row matches current canvas switches
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className={`px-2.5 py-1 border-2 text-[11px] font-black uppercase cursor-pointer ${
                    isDark
                      ? "bg-[#0f172a] border-[#475569] text-emerald-300 hover:border-emerald-400"
                      : "bg-white border-slate-900 text-slate-900 hover:bg-[#fce6b6]"
                  }`}
                >
                  {copiedType === "md" ? "✓ Copied MD" : "Copy Markdown"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className={`px-2.5 py-1 border-2 text-[11px] font-black uppercase cursor-pointer ${
                    isDark
                      ? "bg-[#10b981] border-black text-slate-950"
                      : "bg-[#a8d5ba] border-slate-900 text-slate-900"
                  }`}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
