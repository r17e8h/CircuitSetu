"use client"

import { useState, useEffect } from 'react'

export default function PropertiesPanel({ components, setComponents, selectedComponent }){

const selected = components.find(c => c.id === selectedComponent)

const comp = components.find(c => c.id === selectedComponent)

const [inputValue, setInputValue] = useState(comp ? comp.value.toString() : "")

useEffect(() => {
  if (comp) {
    setInputValue(comp.value.toString())
  }
}, [comp?.value])

return (
  <div className="w-full h-full bg-[#bfe3cc] flex flex-col font-mono text-slate-800">

    {/* HEADER */}
    <div className="p-4 border-b-2 border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)] z-10 shrink-0">
      <h2 className="font-bold uppercase tracking-widest text-sm text-center">
        Properties
      </h2>
    </div>

    {/* CONTENT */}
    
    <div className="p-2 flex-1 overflow-hidden">
        <div className="min-h-[10px] flex items-center justify-center"></div>

      {!selectedComponent && (
        <p className="text-sm text-slate-500 text-center mt-10">
          Select a component
        </p>
      )}

      {selectedComponent && (() => {
        const compId = typeof selectedComponent === 'object' ? selectedComponent?.id : selectedComponent;
        const comp = components.find(c => c.id === selectedComponent)
        if (!comp) return null

        return (
          <div className="bg-[#F9F8F4] border-2 border-[#334155] p-3 shadow-[4px_4px_0px_#334155]">

            {/* TITLE */}
            <div className="flex justify-between items-center mb-3 border-b-2 border-[#334155] pb-2">
              <span className="font-bold text-sm uppercase">
                {comp.type}
              </span>
              <span className="text-[10px] bg-[#fce6b6] border-2 border-[#334155] px-1 font-bold">
                ID: {comp.id}
              </span>
            </div>

            {/* INPUT */}
            {(comp.type === "battery" || comp.type === "resistor") && (
              <>
                <label className="text-xs font-bold block mb-1">
                  {comp.type === "battery" ? "Voltage (V)" : "Resistance (Ω)"}
                </label>

                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    const val = Number(e.target.value)
                    setComponents(prev =>
                      prev.map(c =>
                        c.id === comp.id ? { ...c, value: val } : c
                      )
                    )
                  }}
                  onFocus={(e) => {
                    const defaultVal = comp.type === "battery" ? 9 : comp.type === "resistor" ? 100 : 0;
                    if (inputValue === defaultVal.toString()) {
                      setInputValue("");
                    }
                  }}
                  onBlur={(e) => {
                    if (inputValue === "") {
                      const defaultVal = comp.type === "battery" ? 9 : comp.type === "resistor" ? 100 : 0;
                      setInputValue(defaultVal.toString());
                      setComponents(prev =>
                        prev.map(c =>
                          c.id === comp.id ? { ...c, value: defaultVal } : c
                        )
                      )
                    }
                  }}
                  className="w-full bg-white border-2 border-[#334155] p-1.5 text-sm font-bold focus:outline-none focus:bg-[#fce6b6] transition-colors shadow-inner"
                />
              </>
            )}

          </div>
        )
      })()}

    </div>

  </div>
)
}