"use client";

import { useState, useEffect } from "react";
import { isDigitalType, getDefaultPorts } from "../lib/digitalSchema";

export default function PropertiesPanel({ 
  components, 
  setComponents, 
  selectedComponent,
  simResults,
  onTriggerSim
}) {
  const comp = components.find((c) => c.id === selectedComponent);
  const [inputValue, setInputValue] = useState(comp?.value !== undefined ? comp.value.toString() : "");

  useEffect(() => {
    if (comp && comp.value !== undefined) {
      setInputValue(comp.value.toString());
    }
  }, [comp?.value]);

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
    <div className="w-full h-full bg-[#bfe3cc] flex flex-col font-mono text-slate-800">
      {/* HEADER */}
      <div className="p-3 border-b-2 border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)] z-10 shrink-0">
        <h2 className="font-bold uppercase tracking-widest text-xs md:text-sm text-center">
          Properties
        </h2>
      </div>

      {/* CONTENT */}
      <div className="p-3 flex-1 overflow-y-auto">
        {!selectedComponent && (
          <p className="text-xs text-slate-600 text-center mt-6">
            Select a component to inspect
          </p>
        )}

        {comp && (
          <div className="bg-[#F9F8F4] border-2 border-[#334155] p-3 shadow-[4px_4px_0px_#334155] flex flex-col gap-3">
            {/* Component Title & Type */}
            <div className="flex justify-between items-center border-b-2 border-[#334155] pb-2">
              <span className="font-black text-sm uppercase">
                {comp.type}
              </span>
              <span className="text-[10px] bg-[#fce6b6] border-2 border-[#334155] px-1.5 py-0.5 font-bold">
                {isDigital ? "DIGITAL" : "ANALOG"}
              </span>
            </div>

            {/* A. DIGITAL COMPONENT: Hide analog resistance/voltage inputs */}
            {isDigital && (
              <div className="flex flex-col gap-2">
                {comp.type === "SWITCH" && (
                  <div>
                    <span className="text-xs font-bold block mb-1">Switch Logic Level</span>
                    <button
                      onClick={toggleSwitch}
                      className={`w-full py-2 px-3 border-2 border-[#334155] text-xs font-black uppercase tracking-wider flex items-center justify-between shadow-[2px_2px_0px_#334155] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer ${
                        comp.state === 1 
                          ? "bg-[#22c55e] text-slate-900 shadow-[0_0_8px_#22c55e]" 
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span>State:</span>
                      <span className="px-2 py-0.5 border border-[#334155] bg-white font-mono">
                        {comp.state === 1 ? "1 (HIGH)" : "0 (LOW)"}
                      </span>
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Tip: Click or tap the switch directly on the canvas to toggle.
                    </p>
                  </div>
                )}

                {comp.type === "LED" && (
                  <div>
                    <span className="text-xs font-bold block mb-1">LED Indicator</span>
                    <div className="flex items-center gap-2 p-2 bg-white border-2 border-[#334155]">
                      <div 
                        className={`w-4 h-4 rounded-full border border-[#334155] ${
                          simResults?.ledStates?.[comp.id] === 1 || comp.state === 1
                            ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]"
                            : "bg-[#334155]"
                        }`}
                      />
                      <span className="text-xs font-bold uppercase">
                        {simResults?.ledStates?.[comp.id] === 1 || comp.state === 1 
                          ? "Lit (HIGH / 1)" 
                          : "Unlit (LOW / 0)"}
                      </span>
                    </div>
                  </div>
                )}

                {["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"].includes(comp.type) && (
                  <div className="bg-white border-2 border-[#334155] p-2 text-[11px]">
                    <span className="font-bold block text-slate-700 uppercase mb-1">
                      Gate Specification
                    </span>
                    <p className="text-slate-600 leading-snug">
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
                <div className="border-t border-slate-300 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Terminals ({getDefaultPorts(comp.type).length} Pins)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {getDefaultPorts(comp.type).map((p) => (
                      <span 
                        key={p.id}
                        className="text-[9px] font-bold px-1.5 py-0.5 border border-[#334155] bg-[#fce6b6]"
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
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    const val = Number(e.target.value);
                    setComponents((prev) =>
                      prev.map((c) =>
                        c.id === comp.id ? { ...c, value: val } : c
                      )
                    );
                  }}
                  onFocus={() => {
                    const defaultVal = comp.type === "battery" ? 9 : comp.type === "resistor" ? 100 : 0;
                    if (inputValue === defaultVal.toString()) {
                      setInputValue("");
                    }
                  }}
                  onBlur={() => {
                    if (inputValue === "") {
                      const defaultVal = comp.type === "battery" ? 9 : comp.type === "resistor" ? 100 : 0;
                      setInputValue(defaultVal.toString());
                      setComponents((prev) =>
                        prev.map((c) =>
                          c.id === comp.id ? { ...c, value: defaultVal } : c
                        )
                      );
                    }
                  }}
                  className="w-full bg-white border-2 border-[#334155] p-1.5 text-sm font-bold focus:outline-none focus:bg-[#fce6b6] transition-colors shadow-inner"
                />
              </>
            )}

            {!isDigital && comp.type !== "battery" && comp.type !== "resistor" && (
              <p className="text-xs text-slate-500 italic">
                Passive analog instrument.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
