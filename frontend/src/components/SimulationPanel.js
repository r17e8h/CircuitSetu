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
  const [truthTableData, setTruthTableData] = useState(null);
  const [showTruthTable, setShowTruthTable] = useState(false);
  const [copiedType, setCopiedType] = useState(null);
  const manualVerifyRef = useRef(false);

  useEffect(() => {
    if (simMode !== "digital") {
      setStatus("Idle");
      setSolveTime("--");
      return;
    }

    if (!components || components.length === 0) {
      setStatus("Idle");
      setSolveTime("--");
      return;
    }

    if (manualVerifyRef.current) {
      manualVerifyRef.current = false;
      return;
    }

    if (simResults?.nets) {
      const netValues = Object.values(simResults.nets);
      const hasConflict = netValues.includes(-2);

      if (hasConflict) {
        setStatus("Conflict / Short");
      } else if (simResults.oscillating) {
        setStatus("Oscillation Loop");
      } else {
        setStatus(`Live (${simResults.ticks ?? 1}t)`);
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
        const netValues = Object.values(simOut.nets || {});

        rows.push({
          mask,
          assignment,
          inputs: inputBits,
          outputs: outputBits,
          ticks: simOut.ticks ?? 1,
          hasConflict: netValues.includes(-2),
          oscillating: Boolean(simOut.oscillating)
        });
      }

      const endTime = performance.now();
      const elapsedMs = (endTime - startTime).toFixed(2);

      manualVerifyRef.current = true;
      setSimResults(currentResult);
      setSolveTime(elapsedMs);
      setStatus(`Table: ${totalRows} states`);

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
    }
  };

  const handleRunAnalog = () => {
    if (setHasAttemptedRun) setHasAttemptedRun(true);

    if (!components || components.length === 0) {
      setStatus("Canvas is empty");
      return;
    }

    const payload = generateSimulationPayload(components, wires);

    if (payload.error) {
      setStatus(payload.error);
      setSimResults(null);
      return;
    }

    if (typeof window !== "undefined" && window.wasmReady && window.Module) {
      try {
        const startTime = performance.now();
        const jsonString = JSON.stringify(payload);
        const rawResult = window.Module.run_simulation(jsonString);
        const parsedResult = JSON.parse(rawResult);
        const endTime = performance.now();

        setSimResults(parsedResult);
        setSolveTime((endTime - startTime).toFixed(2));
        setStatus(parsedResult.status === "success" ? "Converged" : "Matrix Error");
      } catch (e) {
        console.error("WASM execution error:", e);
        setStatus("Engine Error");
      }
    } else {
      setStatus("Engine Booting...");
    }
  };

  const handleApplyRowToCanvas = (assignment) => {
    if (!setComponents) return;
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

  const resistorCount = components ? components.filter((c) => c.type === "resistor").length : 0;
  const batteryCount = components ? components.filter((c) => c.type === "battery").length : 0;
  const gateCount = components
    ? components.filter(
        (c) => isDigitalType(c.type) && c.type !== "SWITCH" && c.type !== "LED"
      ).length
    : 0;
  const switchCount = components ? components.filter((c) => c.type === "SWITCH").length : 0;
  const ledCount = components ? components.filter((c) => c.type === "LED").length : 0;
  const wireCount = wires ? wires.length : 0;
  const nodeCount = components ? components.filter((c) => c.type !== "JUNCTION").length : 0;

  return (
    <div
      className={`w-full h-full flex flex-col font-mono transition-colors duration-200 ${
        isDark ? "bg-[#0f172a] text-slate-100" : "bg-[#F9F8F4] text-slate-800"
      }`}
    >
      <div
        className={`hidden md:flex p-3 border-b-2 z-10 shrink-0 items-center justify-between transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#1e293b] shadow-[0_4px_0px_#000000]"
            : "border-[#334155] bg-[#c8e1e9] shadow-[0_4px_0px_rgba(51,65,85,0.1)]"
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
          {simMode === "digital" ? "DLCD Live" : "MNA Core"}
        </span>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between gap-3.5 overflow-y-auto">
        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Bill of Materials ({simMode === "digital" ? "Digital" : "Analog"})
          </span>

          {simMode === "digital" ? (
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div
                className={`border-2 p-1.5 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">SWITCHES</span>
                <span className="font-black text-emerald-500">{switchCount}</span>
              </div>
              <div
                className={`border-2 p-1.5 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">GATES</span>
                <span className="font-black text-sky-400">{gateCount}</span>
              </div>
              <div
                className={`border-2 p-1.5 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">LEDS</span>
                <span className="font-black text-amber-400">{ledCount}</span>
              </div>
              <div
                className={`border-2 p-1.5 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">WIRES</span>
                <span className="font-black">{wireCount}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div
                className={`border-2 p-1.5 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">SOURCES</span>
                <span className="font-black">{batteryCount}</span>
              </div>
              <div
                className={`border-2 p-1.5 flex justify-between items-center ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">RESISTORS</span>
                <span className="font-black">{resistorCount}</span>
              </div>
              <div
                className={`border-2 p-1.5 flex justify-between items-center col-span-2 ${
                  isDark
                    ? "bg-[#1e293b] border-[#475569] shadow-[2px_2px_0px_#000000]"
                    : "bg-white border-[#334155] shadow-[2px_2px_0px_#334155]"
                }`}
              >
                <span className="font-bold text-[10px]">TOTAL NODES & WIRES</span>
                <span className="font-black">
                  {nodeCount}N / {wireCount}W
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={simMode === "digital" ? handleGenerateTruthTable : handleRunAnalog}
            className={`w-full py-2.5 md:py-3 font-black uppercase tracking-wider text-xs border-2 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? "bg-[#10b981] text-slate-950 border-[#000000] shadow-[4px_4px_0px_#000000] hover:bg-[#34d399] hover:shadow-[2px_2px_0px_#000000]"
                : "bg-[#a8d5ba] text-[#334155] border-[#334155] shadow-[4px_4px_0px_#334155] hover:bg-[#8ec5a5] hover:shadow-[2px_2px_0px_#334155]"
            }`}
          >
            {simMode === "digital" ? (
              <>
                <span className="text-sm">⊞</span> Generate Truth Table
              </>
            ) : (
              <>
                <span className="text-sm">▶</span> Run Simulation
              </>
            )}
          </button>
        </div>

        <div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Engine Telemetry
          </span>
          <div
            className={`border-2 p-2.5 flex flex-col gap-1.5 text-xs ${
              isDark
                ? "bg-[#1e293b] border-[#475569] shadow-[3px_3px_0px_#000000] text-slate-200"
                : "bg-white border-[#334155] shadow-[3px_3px_0px_#334155] text-slate-800"
            }`}
          >
            <div
              className={`flex justify-between border-b border-dashed pb-1 ${
                isDark ? "border-slate-700" : "border-slate-400"
              }`}
            >
              <span>Status:</span>
              <span
                className={`font-black ${
                  status.includes("Conflict") ||
                  status.includes("Oscillation") ||
                  status.includes("Error") ||
                  status === "Canvas is empty" ||
                  status.startsWith("Add")
                    ? "text-red-500"
                    : status !== "Idle"
                      ? isDark
                        ? "text-emerald-400"
                        : "text-green-700"
                      : isDark
                        ? "text-slate-300"
                        : "text-slate-600"
                }`}
              >
                {status}
              </span>
            </div>

            <div
              className={`flex justify-between border-b border-dashed pb-1 ${
                isDark ? "border-slate-700" : "border-slate-400"
              }`}
            >
              <span>Execution Time:</span>
              <span className="font-bold text-sky-400">{solveTime} ms</span>
            </div>

            <div
              className={`flex justify-between border-b border-dashed pb-1 ${
                isDark ? "border-slate-700" : "border-slate-400"
              }`}
            >
              <span>Circuit Size:</span>
              <span className={isDark ? "text-slate-100" : "text-slate-800"}>
                {simMode === "digital"
                  ? `${gateCount + switchCount + ledCount} digital parts`
                  : `${nodeCount}x${nodeCount} MNA`}
              </span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span>Backend:</span>
              <span
                className={`font-bold px-1.5 py-0.5 text-[10px] uppercase border ${
                  isDark
                    ? "bg-[#0f172a] text-emerald-400 border-emerald-500/40"
                    : "bg-[#334155] text-[#fce6b6] border-slate-900"
                }`}
              >
                {simMode === "digital" ? "DLCD / C++ WASM" : "Eigen3 / C++ WASM"}
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
                        title="Click row to apply these switch states to canvas"
                        className={`cursor-pointer transition-colors ${
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
                Tip: Tap any row to load inputs onto canvas
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
    </div>
  );
}
