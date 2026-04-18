"use client";

import { FaBatteryFull } from "react-icons/fa"
import { TbCircuitResistor, TbCircuitSwitchOpen, TbCircuitGround, TbCircuitAmmeter, TbCircuitVoltmeter } from "react-icons/tb";
const components = [
  { type: "battery", label: "Battery", icon: <FaBatteryFull className="text-xl" /> },
  { type: "resistor", label: "Resistor", icon: <TbCircuitResistor className="text-xl" /> },
  { type: "ground", label: "Ground", icon: <TbCircuitGround className="text-xl" /> },
  { type: "ammeter", label: "Ammeter", icon: <TbCircuitAmmeter className="text-xl" /> },
  { type: "voltmeter", label: "Voltmeter", icon: <TbCircuitVoltmeter className="text-xl" /> }
];

export default function Sidebar({ onAddComponent }) {

  function dragStart(e, type) {
    e.dataTransfer.setData("component", type);
    e.dataTransfer.effectAllowed = "move"; 
  }

  return (
    <aside className="w-full h-full bg-[#c8e1e9] flex flex-col font-mono text-slate-800">
      
      <div className="p-4 border-b-2 border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)] z-10 shrink-0">
        <h2 className="font-bold uppercase tracking-widest text-sm text-center">Toolbox</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {components.map((c) => (
          <div
            key={c.type}
            draggable
            onDragStart={(e) => dragStart(e, c.type)}
            onClick={() => onAddComponent && onAddComponent(c.type)}
            className="flex items-center gap-3 p-3 bg-[#F9F8F4] border-2 border-[#334155] shadow-[4px_4px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#334155] cursor-pointer active:scale-95 transition-all select-none"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#fce6b6] border-2 border-[#334155] text-[#334155] shrink-0 pointer-events-none">
              {c.icon}
            </div>
            <span className="font-bold text-sm uppercase tracking-wide truncate pointer-events-none">
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 border-t-2 border-[#334155] text-xs font-bold text-slate-600 bg-[#F9F8F4] text-center uppercase tracking-widest shrink-0 hidden md:block">
        [ Drag to Graph ]
      </div>
      <div className="p-4 border-t-2 border-[#334155] text-xs font-bold text-slate-600 bg-[#F9F8F4] text-center uppercase tracking-widest shrink-0 md:hidden">
        [ Tap to Add ]
      </div>

    </aside>
  );
}