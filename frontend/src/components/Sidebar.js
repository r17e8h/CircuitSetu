"use client";

import { FaBatteryFull } from "react-icons/fa";
import { 
  TbCircuitResistor, 
  TbCircuitGround, 
  TbCircuitAmmeter, 
  TbCircuitVoltmeter 
} from "react-icons/tb";

// Custom Neo-Brutalist SVG Logic Gate Icons with theme awareness
function SwitchIcon({ isDark }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#e2e8f0" : "#334155"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="3" fill="#22c55e" />
      <circle cx="19" cy="12" r="3" fill={isDark ? "#475569" : "#cbd5e1"} />
      <path d="M7.5 10.5 L16.5 6" />
    </svg>
  );
}

function LedIcon({ isDark }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#e2e8f0" : "#334155"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="6" fill={isDark ? "#f59e0b" : "#fce6b6"} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function AndGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M20 10h6" />
      <path d="M8 2h4a8 8 0 0 1 8 8 8 8 0 0 1-8 8H8V2z" fill={fill} />
    </svg>
  );
}

function OrGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M21 10h5" />
      <path d="M7 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill={fill} />
    </svg>
  );
}

function NotGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10h6M20 10h6" />
      <polygon points="8,3 18,10 8,17" fill={fill} />
      <circle cx="19.5" cy="10" r="1.5" fill={fill} />
    </svg>
  );
}

function NandGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M22 10h4" />
      <path d="M8 2h4a8 8 0 0 1 8 8 8 8 0 0 1-8 8H8V2z" fill={fill} />
      <circle cx="21" cy="10" r="1.5" fill={fill} />
    </svg>
  );
}

function NorGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h6M2 15h6M22 10h4" />
      <path d="M7 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill={fill} />
      <circle cx="21.5" cy="10" r="1.5" fill={fill} />
    </svg>
  );
}

function XorGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h6M1 15h6M22 10h5" />
      <path d="M4 2c3 5 3 11 0 16" />
      <path d="M8 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill={fill} />
    </svg>
  );
}

function XnorGateIcon({ isDark }) {
  const fill = isDark ? "#1e293b" : "#F9F8F4";
  const stroke = isDark ? "#e2e8f0" : "#334155";
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5h6M1 15h6M23 10h4" />
      <path d="M4 2c3 5 3 11 0 16" />
      <path d="M8 2c3 5 3 11 0 16 5 0 11-3 14-8-3-5-9-8-14-8z" fill={fill} />
      <circle cx="22.5" cy="10" r="1.5" fill={fill} />
    </svg>
  );
}

export default function Sidebar({ onAddComponent, simMode = "digital", setSimMode, isDark = false }) {
  function dragStart(e, type) {
    e.dataTransfer.setData("component", type);
    e.dataTransfer.effectAllowed = "move";
  }

  const analogComponents = [
    { type: "battery", label: "Battery", icon: <FaBatteryFull className="text-xl" /> },
    { type: "resistor", label: "Resistor", icon: <TbCircuitResistor className="text-xl" /> },
    { type: "ground", label: "Ground", icon: <TbCircuitGround className="text-xl" /> },
    { type: "ammeter", label: "Ammeter", icon: <TbCircuitAmmeter className="text-xl" /> },
    { type: "voltmeter", label: "Voltmeter", icon: <TbCircuitVoltmeter className="text-xl" /> }
  ];

  const digitalComponents = [
    { type: "SWITCH", label: "SWITCH", icon: <SwitchIcon isDark={isDark} /> },
    { type: "LED", label: "LED", icon: <LedIcon isDark={isDark} /> },
    { type: "AND", label: "AND", icon: <AndGateIcon isDark={isDark} /> },
    { type: "OR", label: "OR", icon: <OrGateIcon isDark={isDark} /> },
    { type: "NOT", label: "NOT", icon: <NotGateIcon isDark={isDark} /> },
    { type: "NAND", label: "NAND", icon: <NandGateIcon isDark={isDark} /> },
    { type: "NOR", label: "NOR", icon: <NorGateIcon isDark={isDark} /> },
    { type: "XOR", label: "XOR", icon: <XorGateIcon isDark={isDark} /> },
    { type: "XNOR", label: "XNOR", icon: <XnorGateIcon isDark={isDark} /> }
  ];

  const activeComponents = simMode === "digital" ? digitalComponents : analogComponents;

  return (
    <aside
      className={`w-full h-full flex flex-col font-mono transition-colors duration-200 ${
        isDark ? "bg-[#0f172a] text-slate-100" : "bg-[#c8e1e9] text-slate-800"
      }`}
    >
      {/* Title Header */}
      <div
        className={`hidden md:flex p-3 border-b-2 z-10 shrink-0 items-center justify-between transition-colors duration-200 ${
          isDark
            ? "border-[#334155] bg-[#1e293b] shadow-[0_4px_0px_#000000]"
            : "border-[#334155] bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)]"
        }`}
      >
        <h2 className="font-bold uppercase tracking-widest text-xs md:text-sm">
          Toolbox
        </h2>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 border uppercase ${
            isDark
              ? "border-[#475569] bg-[#0f172a] text-emerald-400"
              : "border-[#334155] bg-[#F9F8F4] text-slate-800"
          }`}
        >
          {simMode === "digital" ? "DLCD" : "Analog"}
        </span>
      </div>
      {/* Mode Switcher Tabs */}
      <div
        className={`flex border-b-2 shrink-0 ${
          isDark ? "border-[#334155] bg-[#0b0f17]" : "border-[#334155] bg-[#F9F8F4]"
        }`}
      >
        <button
          onClick={() => setSimMode && setSimMode("digital")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-r-2 ${
            isDark ? "border-[#334155]" : "border-[#334155]"
          } ${
            simMode === "digital"
              ? isDark
                ? "bg-[#10b981] text-slate-950 font-black shadow-inner"
                : "bg-[#a8d5ba] text-[#334155] font-extrabold shadow-inner"
              : isDark
                ? "bg-[#1e293b] text-slate-300 hover:bg-[#334155]"
                : "bg-[#F9F8F4] text-slate-600 hover:bg-[#fce6b6]"
          }`}
        >
          ⚡ Digital
        </button>
        <button
          onClick={() => setSimMode && setSimMode("analog")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            simMode === "analog"
              ? isDark
                ? "bg-[#10b981] text-slate-950 font-black shadow-inner"
                : "bg-[#a8d5ba] text-[#334155] font-extrabold shadow-inner"
              : isDark
                ? "bg-[#1e293b] text-slate-300 hover:bg-[#334155]"
                : "bg-[#F9F8F4] text-slate-600 hover:bg-[#fce6b6]"
          }`}
        >
          🔋 Analog
        </button>
      </div>
      
      {/* Component Palette List */}
      <div className="flex-1 overflow-y-auto p-2.5 md:p-3.5 grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-2.5 content-start">
        {activeComponents.map((c) => (
          <div
            key={c.type}
            draggable
            onDragStart={(e) => dragStart(e, c.type)}
            onClick={() => onAddComponent && onAddComponent(c.type)}
            className={`flex items-center gap-2 md:gap-3 p-2 md:p-2.5 border-2 cursor-pointer active:scale-95 transition-all select-none ${
              isDark
                ? "bg-[#1e293b] border-[#475569] shadow-[3px_3px_0px_#000000] md:shadow-[4px_4px_0px_#000000] hover:bg-[#273549] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] text-slate-100"
                : "bg-[#F9F8F4] border-[#334155] shadow-[3px_3px_0px_#334155] md:shadow-[4px_4px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#334155] text-slate-800"
            }`}
          >
            <div
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border-2 shrink-0 pointer-events-none transition-colors ${
                isDark
                  ? "bg-[#0f172a] border-[#475569] text-emerald-400"
                  : "bg-[#fce6b6] border-[#334155] text-[#334155]"
              }`}
            >
              {c.icon}
            </div>
            <span className="font-bold text-[11px] md:text-xs uppercase tracking-wide truncate pointer-events-none">
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <div
        className={`p-3 border-t-2 text-[11px] font-bold text-center uppercase tracking-widest shrink-0 hidden md:block ${
          isDark
            ? "border-[#334155] bg-[#1e293b] text-slate-400"
            : "border-[#334155] bg-[#F9F8F4] text-slate-600"
        }`}
      >
        [ Drag to Graph ]
      </div>
      <div
        className={`p-3 border-t-2 text-[11px] font-bold text-center uppercase tracking-widest shrink-0 md:hidden ${
          isDark
            ? "border-[#334155] bg-[#1e293b] text-slate-400"
            : "border-[#334155] bg-[#F9F8F4] text-slate-600"
        }`}
      >
        [ Tap to Add ]
      </div>
    </aside>
  );
}
