"use client";

import { FaBatteryFull } from "react-icons/fa";
import { 
  TbCircuitResistor, 
  TbCircuitGround, 
  TbCircuitAmmeter, 
  TbCircuitVoltmeter 
} from "react-icons/tb";

// Custom Neo-Brutalist SVG Logic Gate Icons
function SwitchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="3" fill="#22c55e" />
      <circle cx="19" cy="12" r="3" fill="#cbd5e1" />
      <path d="M7.5 10.5 L16.5 6" />
    </svg>
  );
}

function LedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="6" fill="#fce6b6" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function AndGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M20 10h6" />
      <path d="M8 2h4a8 8 0 0 1 8 8 8 8 0 0 1-8 8H8V2z" fill="#F9F8F4" />
    </svg>
  );
}

function OrGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M21 10h5" />
      <path d="M7 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill="#F9F8F4" />
    </svg>
  );
}

function NotGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10h6M20 10h6" />
      <polygon points="8,3 18,10 8,17" fill="#F9F8F4" />
      <circle cx="19.5" cy="10" r="1.5" fill="#F9F8F4" />
    </svg>
  );
}

function NandGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M22 10h4" />
      <path d="M8 2h4a8 8 0 0 1 8 8 8 8 0 0 1-8 8H8V2z" fill="#F9F8F4" />
      <circle cx="21" cy="10" r="1.5" fill="#F9F8F4" />
    </svg>
  );
}

function NorGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M22 10h4" />
      <path d="M7 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill="#F9F8F4" />
      <circle cx="21.5" cy="10" r="1.5" fill="#F9F8F4" />
    </svg>
  );
}

function XorGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h6M1 15h6M22 10h5" />
      <path d="M4 2c3 5 3 11 0 16" />
      <path d="M8 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill="#F9F8F4" />
    </svg>
  );
}

function XnorGateIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h6M1 15h6M23 10h4" />
      <path d="M4 2c3 5 3 11 0 16" />
      <path d="M8 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill="#F9F8F4" />
      <circle cx="22.5" cy="10" r="1.5" fill="#F9F8F4" />
    </svg>
  );
}

const analogComponents = [
  { type: "battery", label: "Battery", icon: <FaBatteryFull className="text-xl" /> },
  { type: "resistor", label: "Resistor", icon: <TbCircuitResistor className="text-xl" /> },
  { type: "ground", label: "Ground", icon: <TbCircuitGround className="text-xl" /> },
  { type: "ammeter", label: "Ammeter", icon: <TbCircuitAmmeter className="text-xl" /> },
  { type: "voltmeter", label: "Voltmeter", icon: <TbCircuitVoltmeter className="text-xl" /> }
];

const digitalComponents = [
  { type: "SWITCH", label: "SWITCH", icon: <SwitchIcon /> },
  { type: "LED", label: "LED", icon: <LedIcon /> },
  { type: "AND", label: "AND", icon: <AndGateIcon /> },
  { type: "OR", label: "OR", icon: <OrGateIcon /> },
  { type: "NOT", label: "NOT", icon: <NotGateIcon /> },
  { type: "NAND", label: "NAND", icon: <NandGateIcon /> },
  { type: "NOR", label: "NOR", icon: <NorGateIcon /> },
  { type: "XOR", label: "XOR", icon: <XorGateIcon /> },
  { type: "XNOR", label: "XNOR", icon: <XnorGateIcon /> }
];

export default function Sidebar({ onAddComponent, simMode = "digital", setSimMode }) {
  function dragStart(e, type) {
    e.dataTransfer.setData("component", type);
    e.dataTransfer.effectAllowed = "move";
  }

  const activeComponents = simMode === "digital" ? digitalComponents : analogComponents;

  return (
    <aside className="w-full h-full bg-[#c8e1e9] flex flex-col font-mono text-slate-800">
      
      {/* Title Header */}
      <div className="p-3 border-b-2 border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)] z-10 shrink-0 flex items-center justify-between">
        <h2 className="font-bold uppercase tracking-widest text-xs md:text-sm">
          Toolbox
        </h2>
        <span className="text-[10px] font-bold px-1.5 py-0.5 border border-[#334155] bg-[#F9F8F4] uppercase">
          {simMode === "digital" ? "DLCD" : "Analog"}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b-2 border-[#334155] bg-[#F9F8F4] shrink-0">
        <button
          onClick={() => setSimMode && setSimMode("digital")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-r-2 border-[#334155] ${
            simMode === "digital"
              ? "bg-[#a8d5ba] text-[#334155] shadow-inner font-extrabold"
              : "bg-[#F9F8F4] text-slate-600 hover:bg-[#fce6b6]"
          }`}
        >
          ⚡ Digital
        </button>
        <button
          onClick={() => setSimMode && setSimMode("analog")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            simMode === "analog"
              ? "bg-[#a8d5ba] text-[#334155] shadow-inner font-extrabold"
              : "bg-[#F9F8F4] text-slate-600 hover:bg-[#fce6b6]"
          }`}
        >
          🔋 Analog
        </button>
      </div>
      
      {/* Component Palette List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {activeComponents.map((c) => (
          <div
            key={c.type}
            draggable
            onDragStart={(e) => dragStart(e, c.type)}
            onClick={() => onAddComponent && onAddComponent(c.type)}
            className="flex items-center gap-3 p-2.5 bg-[#F9F8F4] border-2 border-[#334155] shadow-[4px_4px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#334155] cursor-pointer active:scale-95 transition-all select-none"
          >
            <div className="w-9 h-9 flex items-center justify-center bg-[#fce6b6] border-2 border-[#334155] text-[#334155] shrink-0 pointer-events-none">
              {c.icon}
            </div>
            <span className="font-bold text-xs uppercase tracking-wide truncate pointer-events-none">
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t-2 border-[#334155] text-[11px] font-bold text-slate-600 bg-[#F9F8F4] text-center uppercase tracking-widest shrink-0 hidden md:block">
        [ Drag to Graph ]
      </div>
      <div className="p-3 border-t-2 border-[#334155] text-[11px] font-bold text-slate-600 bg-[#F9F8F4] text-center uppercase tracking-widest shrink-0 md:hidden">
        [ Tap to Add ]
      </div>

    </aside>
  );
}
