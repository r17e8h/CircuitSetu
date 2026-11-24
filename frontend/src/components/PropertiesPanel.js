"use client";

import { useState, useEffect } from "react";
import { isDigitalType, getDefaultPorts } from "../lib/digitalSchema";

export default function PropertiesPanel({ 
  components, 
  setComponents, 
  selectedComponent,
  simResults,
  onTriggerSim,
  isDark = false
}) {
  const comp = components.find((c) => c.id === selectedComponent);
  const [inputValue, setInputValue] = useState(comp?.value !== undefined ? comp.value.toString() : "");

  useEffect(() => {
    if (comp && comp.value !== undefined) {
      setInputValue(comp.value.toString());
    } else {
      setInputValue("");
    }
  }, [comp?.id, comp?.value]);

  const isDigital = comp ? isDigitalType(comp.type) : false;

  function toggleSwitch() {
    if (!comp || comp.type !== "SWITCH") return;
    const nextState = comp.state === 1 ? 0 : 1;
    const updated = components.map((c) =>
      c.id === comp.id ? { ...c, state: nextState } : c
    );
    setComponents(updated);
    if (onTriggerSim) {
      onTriggerSim(updated);
    }
  }

  return (
    <div
      className={`w-full h-full flex flex-col font-mono transition-colors duration-200 ${
        isDark ? "bg-[#0f172a] text-slate-100" : "bg-[#bfe3cc] text-slate-800"
      }`}
    >
      {/* HEADER */}
      <div
        className={`p-3 border-b-2 z-10 shrink-0 transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#1e293b] shadow-[0_4px_0px_#000000]"
            : "border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)]"
        }`}
      >
        <h2 className="font-bold uppercase tracking-widest text-xs md:text-sm text-center">
          Properties
        </h2>
      </div>

      {/* CONTENT */}
      <div className="p-3 flex-1 overflow-y-auto">
        {!comp && (
          <p
            className={`text-xs text-center mt-6 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Select a component to inspect
          </p>
        )}

        {comp && (
          <div
            className={`border-2 p-3 flex flex-col gap-3 transition-colors ${
              isDark
                ? "bg-[#1e293b] border-[#475569] shadow-[4px_4px_0px_#000000] text-slate-100"
                : "bg-[#F9F8F4] border-[#334155] shadow-[4px_4px_0px_#334155] text-slate-800"
            }`}
          >
            {/* Component Title & Type */}
            <div
              className={`flex justify-between items-center border-b-2 pb-2 ${
                isDark ? "border-[#334155]" : "border-[#334155]"
              }`}
            >
              <span className="font-black text-sm uppercase">
                {comp.type}
              </span>
              <span
                className={`text-[10px] border-2 px-1.5 py-0.5 font-bold ${
                  isDark
                    ? "bg-[#0f172a] border-[#475569] text-emerald-400"
                    : "bg-[#fce6b6] border-[#334155] text-slate-800"
                }`}
              >
                {isDigital ? "DIGITAL" : "ANALOG"}
              </span>
            </div>

            {/* A. DIGITAL COMPONENT: Hide analog resistance/voltage inputs */}
            {isDigital && (
              <div className="flex flex-col gap-2.5">
                {comp.type === "SWITCH" && (
                  <div>
                    <span className="text-xs font-bold block mb-1">Switch Logic Level</span>
                    <button
                      onClick={toggleSwitch}
                      className={`w-full py-2 px-3 border-2 text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                        isDark ? "border-[#000000] shadow-[2px_2px_0px_#000000]" : "border-[#334155] shadow-[2px_2px_0px_#334155]"
                      } ${
                        comp.state === 1 
                          ? "bg-[#22c55e] text-slate-950 shadow-[0_0_8px_#22c55e]" 
                          : isDark
                            ? "bg-[#334155] text-slate-200 hover:bg-[#475569]"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      <span>State:</span>
                      <span
                        className={`px-2 py-0.5 border font-mono ${
                          isDark
                            ? "border-slate-800 bg-[#0f172a] text-white"
                            : "border-[#334155] bg-white text-slate-900"
                        }`}
                      >
                        {comp.state === 1 ? "1 (HIGH)" : "0 (LOW)"}
                      </span>
                    </button>
                    <p
                      className={`text-[10px] mt-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Tip: Click or tap the switch directly on the canvas to toggle.
                    </p>
                  </div>
                )}

                {comp.type === "LED" && (() => {
                  const ledState = simResults?.ledStates?.[comp.id] ?? -1;

                  return (
                    <div>
                      <span className="text-xs font-bold block mb-1">LED Indicator</span>
                      <div
                        className={`flex items-center gap-2 p-2 border-2 ${
                          isDark
                            ? "bg-[#0f172a] border-[#475569]"
                            : "bg-white border-[#334155]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border transition-all ${
                            isDark ? "border-[#000000]" : "border-[#334155]"
                          } ${
                            ledState === 1
                              ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]"
                              : ledState === 0
                                ? "bg-[#334155]"
                                : ledState === -2
                                  ? "bg-[#ef4444] shadow-[0_0_8px_#ef4444]"
                                  : "bg-[#f59e0b] border-dashed"
                          }`}
                        />
                        <span className="text-xs font-bold uppercase">
                          {ledState === 1
                            ? "Lit (HIGH / 1)"
                            : ledState === 0
                              ? "Unlit (LOW / 0)"
                              : ledState === -2
                                ? "Conflict / Short (!)"
                                : "Floating / Unconnected (?)"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"].includes(comp.type) && (
                  <div
                    className={`border-2 p-2 text-[11px] ${
                      isDark
                        ? "bg-[#0f172a] border-[#475569] text-slate-300"
                        : "bg-white border-[#334155] text-slate-700"
                    }`}
                  >
                    <span
                      className={`font-bold block uppercase mb-1 ${
                        isDark ? "text-emerald-400" : "text-slate-800"
                      }`}
                    >
                      Gate Specification
                    </span>
                    <p className="leading-snug">
                      {comp.type === "NOT" && "Inverts single digital input (1 ➔ 0, 0 ➔ 1)."}
                      {comp.type === "AND" && "Outputs 1 only when both inputs A and B are 1."}
                      {comp.type === "OR" && "Outputs 1 when at least one input is 1."}
                      {comp.type === "NAND" && "Outputs 0 only when both inputs A and B are 1."}
                      {comp.type === "NOR" && "Outputs 1 only when both inputs are 0."}
                      {comp.type === "XOR" && "Outputs 1 when inputs differ (odd parity)."}
                      {comp.type === "XNOR" && "Outputs 1 when inputs are identical (even parity)."}
                    </p>
                  </div>
                )}

                {/* Ports list */}
                <div
                  className={`border-t pt-2 ${
                    isDark ? "border-slate-700" : "border-slate-300"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Terminals ({getDefaultPorts(comp.type).length} Pins)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {getDefaultPorts(comp.type).map((p) => (
                      <span 
                        key={p.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                          isDark
                            ? "border-[#475569] bg-[#0f172a] text-emerald-300"
                            : "border-[#334155] bg-[#fce6b6] text-slate-800"
                        }`}
                      >
                        {p.label}: {p.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* B. ANALOG COMPONENT: Show Resistance/Voltage inputs */}
            {!isDigital && (comp.type === "battery" || comp.type === "resistor") && (
              <>
                <label className="text-xs font-bold block mb-1">
                  {comp.type === "battery" ? "Voltage (V)" : "Resistance (Ω)"}
                </label>

                <input
                  type="number"
                  value={inputValue}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setInputValue(raw);
                    const parsed = Number(raw);
                    const val = raw === "" || Number.isNaN(parsed) ? 0 : parsed;
                    setComponents((prev) =>
                      prev.map((c) =>
                        c.id === comp.id ? { ...c, value: val } : c
                      )
                    );
                  }}
                  onBlur={() => {
                    if (inputValue === "") {
                      const defaultVal = comp.type === "battery" ? 9 : 100;
                      setInputValue(defaultVal.toString());
                      setComponents((prev) =>
                        prev.map((c) =>
                          c.id === comp.id ? { ...c, value: defaultVal } : c
                        )
                      );
                    }
                  }}
                  className={`w-full border-2 p-1.5 text-sm font-bold focus:outline-none transition-colors shadow-inner ${
                    isDark
                      ? "bg-[#0f172a] border-[#475569] text-slate-100 focus:bg-[#1e293b]"
                      : "bg-white border-[#334155] text-slate-900 focus:bg-[#fce6b6]"
                  }`}
                />              </>
            )}

            {!isDigital && comp.type !== "battery" && comp.type !== "resistor" && (
              <p
                className={`text-xs italic ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Passive analog instrument.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
