"use client";

import { useState, useEffect, useRef } from "react";
import { FaBatteryFull } from "react-icons/fa";
import { 
  TbCircuitResistor, 
  TbCircuitGround, 
  TbCircuitAmmeter, 
  TbCircuitVoltmeter 
} from "react-icons/tb";
import { 
  getDefaultPorts, 
  getPortPosition, 
  createComponent, 
  isDigitalType,
  getComponentDimensions 
} from "../lib/digitalSchema";

const analogIconMap = {
  battery: <FaBatteryFull className="text-xl" />,
  resistor: <TbCircuitResistor className="text-xl" />,
  ground: <TbCircuitGround className="text-xl" />,
  ammeter: <TbCircuitAmmeter className="text-xl" />,
  voltmeter: <TbCircuitVoltmeter className="text-xl" />
};

export default function CircuitCanvas({
  components,
  setComponents,
  wires,
  setWires,
  selectedComponent,
  setSelectedComponent,
  simResults,
  setSimResults,
  hasAttemptedRun,
  simMode = "digital",
  onTriggerSim,
  isDark = false
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [wireStart, setWireStart] = useState(null);
  const [currentPointer, setCurrentPointer] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredMeterId, setHoveredMeterId] = useState(null);

  // Gesture tracking to distinguish click/tap from drag
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setZoom(0.7);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("circuit_components", JSON.stringify(components));
    localStorage.setItem("circuit_wires", JSON.stringify(wires));
  }, [components, wires]);

  function startWire(id, portId) {
    setWireStart({ id, portId, side: portId });
  }

  function getComponent(id) {
    return components.find((c) => c.id === id);
  }

  function deleteComponent(id) {
    const updatedComponents = components.filter((c) => c.id !== id);
    const updatedWires = wires.filter((w) => w.from !== id && w.to !== id);
    setComponents(updatedComponents);
    setWires(updatedWires);
    if (selectedComponent === id) setSelectedComponent(null);
    if (onTriggerSim) {
      onTriggerSim(updatedComponents, updatedWires);
    }
  }

  function deleteWire(index) {
    const updatedWires = wires.filter((_, idx) => idx !== index);
    setWires(updatedWires);
    if (onTriggerSim) {
      onTriggerSim(components, updatedWires);
    }
  }

  function toggleSwitch(comp) {
    const nextState = comp.state === 1 ? 0 : 1;
    const updatedComponents = components.map((c) =>
      c.id === comp.id ? { ...c, state: nextState } : c
    );
    setComponents(updatedComponents);
    if (onTriggerSim) {
      onTriggerSim(updatedComponents, wires);
    }
  }

  function drop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/reactflow") || e.dataTransfer.getData("component");
    if (!type) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom - 40;
    const y = (e.clientY - rect.top - pan.y) / zoom - 20;

    const newComp = createComponent(type, x, y);
    const updatedComponents = [...components, newComp];
    setComponents(updatedComponents);

    if (onTriggerSim && isDigitalType(type)) {
      onTriggerSim(updatedComponents, wires);
    }
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  // Helper to get connected net for a specific component's port
  function getConnectedNetId(compId, portId) {
    const wire = wires.find(
      (w) =>
        (w.from === compId && (w.fromPort === portId || w.fromSide === portId)) ||
        (w.to === compId && (w.toPort === portId || w.toSide === portId))
    );
    return wire?.netId;
  }

  // Get wire start coordinates for live drafting line
  const startComp = wireStart ? getComponent(wireStart.id) : null;
  const startPos = startComp ? getPortPosition(startComp, wireStart.portId || wireStart.side) : null;

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none transition-colors duration-200 ${
        isPanning ? "cursor-grabbing" : "cursor-default"
      } ${isDark ? "bg-[#0d131f]" : "bg-[#F9F8F4]"}`}
      style={{
        backgroundImage: isDark
          ? "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)"
          : "linear-gradient(#e2e2e2 1px, transparent 1px), linear-gradient(90deg, #e2e2e2 1px, transparent 1px)",
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        touchAction: "none"
      }}
      onDrop={drop}
      onDragOver={allowDrop}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          setIsPanning(true);
          setSelectedComponent(null);
          setWireStart(null);
        }
      }}
      onPointerLeave={() => {
        setIsPanning(false);
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - pan.x) / zoom;
        const canvasY = (e.clientY - rect.top - pan.y) / zoom;
        setCurrentPointer({ x: canvasX, y: canvasY });

        if (isPanning) {
          setPan((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
          return;
        }

        if (draggingId !== null) {
          hasMovedRef.current = true;
          const x = canvasX - 40;
          const y = canvasY - 20;

          setComponents((prev) =>
            prev.map((c) => (c.id === draggingId ? { ...c, x, y } : c))
          );
        }
      }}
      onPointerUp={(e) => {
        if (isPanning) {
          setIsPanning(false);
          return;
        }

        setDraggingId(null);

        // Check if completing a wire connection
        if (wireStart) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left - pan.x) / zoom;
          const y = (e.clientY - rect.top - pan.y) / zoom;

          let targetComp = null;
          let targetPortId = null;

          components.forEach((c) => {
            const ports = c.ports && c.ports.length > 0 ? c.ports : getDefaultPorts(c.type);
            ports.forEach((p) => {
              const portX = c.x + p.offsetX;
              const portY = c.y + p.offsetY;
              if (Math.hypot(x - portX, y - portY) < 18) {
                targetComp = c;
                targetPortId = p.id;
              }
            });
          });

          if (
            targetComp &&
            !(targetComp.id === wireStart.id && targetPortId === (wireStart.portId || wireStart.side))
          ) {
            const newWire = {
              id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              from: wireStart.id,
              fromPort: wireStart.portId || wireStart.side,
              fromSide: wireStart.portId || wireStart.side,
              to: targetComp.id,
              toPort: targetPortId,
              toSide: targetPortId
            };
            const updatedWires = [...wires, newWire];
            setWires(updatedWires);
            if (onTriggerSim) {
              onTriggerSim(components, updatedWires);
            }
          }
          setWireStart(null);
        }
      }}
    >
      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col z-50">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          className={`w-8 h-8 border-2 border-b-0 font-bold flex items-center justify-center transition-colors pb-[2px] cursor-pointer ${
            isDark
              ? "bg-[#1e293b] text-slate-100 border-[#475569] shadow-[4px_0_0px_#000000] hover:bg-[#334155] active:bg-[#065f46]"
              : "bg-[#fce6b6] text-slate-800 border-[#334155] shadow-[4px_0_0px_#334155] hover:bg-[#a8d5ba] active:bg-[#64a982]"
          }`}
          title="Zoom In"
        >
          ＋
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          className={`w-8 h-8 border-2 font-bold text-xl flex items-center justify-center transition-colors pb-[2px] cursor-pointer ${
            isDark
              ? "bg-[#1e293b] text-slate-100 border-[#475569] shadow-[4px_4px_0px_#000000] hover:bg-[#334155] active:bg-[#065f46]"
              : "bg-[#fce6b6] text-slate-800 border-[#334155] shadow-[4px_4px_0px_#334155] hover:bg-[#a8d5ba] active:bg-[#64a982]"
          }`}
          title="Zoom Out"
        >
          －
        </button>
      </div>

      {/* Canvas Viewport with Zoom and Pan */}
      <div
        className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {/* SVG Wiring Layer */}
        <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-0">
          {/* Render All Connected Wires */}
          {wires.map((wire, i) => {
            const from = getComponent(wire.from);
            const to = getComponent(wire.to);
            if (!from || !to) return null;

            const fromPos = getPortPosition(from, wire.fromPort || wire.fromSide);
            const toPos = getPortPosition(to, wire.toPort || wire.toSide);

            // Dynamic live state coloring using simResults.nets[wire.netId]
            // In Dark Mode:
            // 1 (HIGH): Bright Green (#22c55e)
            // 0 (LOW): Silver Slate (#94a3b8) - clearly visible against dark canvas!
            // -1 (Floating / Unconnected): Dashed Amber (#fbbf24)
            // -2 (Short Circuit / Conflict): Vivid Red (#f87171)
            const netState = simResults?.nets ? simResults.nets[wire.netId] : undefined;

            let strokeColor = isDark ? "#94a3b8" : "#334155";
            let strokeDash = undefined;
            let strokeWidth = 3;

            if (netState !== undefined) {
              if (netState === 1) {
                strokeColor = "#22c55e"; // HIGH: Bright Green
                strokeWidth = 3.5;
              } else if (netState === 0) {
                strokeColor = isDark ? "#94a3b8" : "#334155"; // LOW
                strokeWidth = 3;
              } else if (netState === -1) {
                strokeColor = isDark ? "#fbbf24" : "#f59e0b"; // Floating
                strokeDash = "6,4";
                strokeWidth = 2.5;
              } else if (netState === -2) {
                strokeColor = isDark ? "#f87171" : "#ef4444"; // Conflict
                strokeWidth = 4;
              }
            }

            return (
              <g key={wire.id || i} className="group cursor-pointer">
                {/* Thicker transparent line for effortless tap/click hit area */}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="transparent"
                  strokeWidth="14"
                  className="pointer-events-auto"
                  onClick={() => deleteWire(i)}
                />
                {/* Visual Wire */}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  className="pointer-events-none group-hover:stroke-red-500 transition-colors"
                />
              </g>
            );
          })}

          {/* Live drafting wire while dragging */}
          {wireStart && startPos && (
            <line
              x1={startPos.x}
              y1={startPos.y}
              x2={currentPointer.x}
              y2={currentPointer.y}
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray="4,4"
              strokeLinecap="round"
              className="pointer-events-none animate-pulse"
            />
          )}
        </svg>

        {/* Components Layer */}
        {components.map((comp) => {
          const isActive = selectedComponent === comp.id;
          const isDigital = isDigitalType(comp.type);
          const ports = comp.ports && comp.ports.length > 0 ? comp.ports : getDefaultPorts(comp.type);
          const dims = getComponentDimensions(comp.type);

          // Error validation for analog inputs
          const isInputType = comp.type === "resistor" || comp.type === "battery";
          const isZero = Number(comp.value) === 0 || !comp.value;
          const showError = hasAttemptedRun && isInputType && isZero;

          // LED state styling
          const ledNetId = comp.type === "LED" ? getConnectedNetId(comp.id, "in") : null;
          const ledState = comp.type === "LED" && simResults?.nets && ledNetId !== undefined 
            ? simResults.nets[ledNetId] 
            : (simResults?.ledStates?.[comp.id] ?? comp.state ?? -1);

          return (
            <div
              key={comp.id}
              className={`absolute flex flex-col items-center justify-center border-2 font-mono cursor-grab active:cursor-grabbing z-10 transition-all pointer-events-auto select-none ${
                isActive
                  ? isDark
                    ? "bg-[#064e3b] border-[#22c55e] text-emerald-100 translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_#000000]"
                    : "bg-[#a8d5ba] border-green-600 text-slate-900 translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_#334155]"
                  : showError
                    ? isDark
                      ? "bg-[#450a0a] border-red-500 shadow-[4px_4px_0px_#ef4444] text-red-200"
                      : "bg-[#fff5f5] border-red-500 shadow-[4px_4px_0px_#ef4444] text-[#334155]"
                    : isDark
                      ? "bg-[#1e293b] border-[#475569] shadow-[4px_4px_0px_#000000] text-slate-100"
                      : "bg-[#F9F8F4] border-[#334155] shadow-[4px_4px_0px_#334155] text-[#334155]"
              }`}
              style={{
                left: comp.x,
                top: comp.y,
                width: `${dims.width}px`,
                height: `${dims.height}px`
              }}
              onMouseEnter={() => {
                if (comp.type === "ammeter" || comp.type === "voltmeter") {
                  setHoveredMeterId(comp.id);
                }
              }}
              onMouseLeave={() => setHoveredMeterId(null)}
              onPointerDown={(e) => {
                if (e.target.classList.contains("port")) return;
                setSelectedComponent(comp.id);
                setDraggingId(comp.id);
                pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                hasMovedRef.current = false;
              }}
              onPointerUp={(e) => {
                if (e.target.classList.contains("port")) return;
                const dist = Math.hypot(
                  e.clientX - pointerStartRef.current.x,
                  e.clientY - pointerStartRef.current.y
                );
                const elapsed = Date.now() - pointerStartRef.current.time;

                // Detect quick tap/click to toggle SWITCH directly on canvas
                if (comp.type === "SWITCH" && dist < 6 && elapsed < 350) {
                  toggleSwitch(comp);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                deleteComponent(comp.id);
              }}
            >
              {/* Delete Button on Selected */}
              {isActive && (
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    deleteComponent(comp.id);
                  }}
                  className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 text-white border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-sm z-40 shadow-[2px_2px_0px_#000000] active:translate-y-[1px] active:translate-x-[1px] cursor-pointer"
                  title="Delete component"
                >
                  ×
                </button>
              )}

              {/* Zero-value warning badge */}
              {showError && (
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-xs animate-bounce shadow-[2px_2px_0px_rgba(0,0,0,1)] z-30">
                  !
                </div>
              )}

              {/* Dynamic Multi-Port Pin Rendering */}
              {ports.map((port) => {
                const isWireStart =
                  wireStart?.id === comp.id &&
                  (wireStart?.portId === port.id || wireStart?.side === port.id);

                return (
                  <div
                    key={port.id}
                    data-port-id={port.id}
                    title={`${port.label || port.id} (${port.type})`}
                    className={`port absolute w-[10px] h-[10px] border-2 cursor-crosshair z-20 transition-all ${
                      isDark ? "border-[#000000]" : "border-[#334155]"
                    } ${
                      isWireStart
                        ? "bg-[#22c55e] scale-125"
                        : isDark
                          ? "bg-[#fce6b6] hover:bg-[#38bdf8]"
                          : "bg-[#fce6b6] hover:bg-[#c8e1e9]"
                    }`}
                    style={{
                      left: `${port.offsetX - 5}px`,
                      top: `${port.offsetY - 5}px`
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      startWire(comp.id, port.id);
                    }}
                  />
                );
              })}

              {/* COMPONENT BODY RENDERING */}

              {/* A. SWITCH Component: Interactive on-canvas toggle */}
              {comp.type === "SWITCH" && (
                <div 
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer px-1 py-0.5"
                  onClick={() => toggleSwitch(comp)}
                >
                  <div className="flex items-center gap-1.5 pointer-events-none">
                    <span
                      className={`text-xs font-black px-2 py-0.5 border-2 transition-all ${
                        isDark ? "border-[#000000]" : "border-[#334155]"
                      } ${
                        comp.state === 1
                          ? "bg-[#22c55e] text-slate-950 shadow-[0_0_10px_#22c55e]"
                          : isDark
                            ? "bg-[#334155] text-slate-300"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {comp.state === 1 ? "1" : "0"}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-tight ${
                        comp.state === 1
                          ? isDark ? "text-emerald-400" : "text-emerald-700"
                          : isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {comp.state === 1 ? "ON" : "OFF"}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 pointer-events-none ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    SWITCH
                  </span>
                </div>
              )}

              {/* B. LED Component: Real-time glowing state */}
              {comp.type === "LED" && (
                <div className="flex flex-col items-center justify-center pointer-events-none w-full h-full">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDark ? "border-[#000000]" : "border-[#334155]"
                    } ${
                      ledState === 1
                        ? "bg-[#22c55e] shadow-[0_0_16px_#22c55e,0_0_4px_#4ade80]"
                        : ledState === 0
                          ? isDark ? "bg-[#0f172a] border-slate-700" : "bg-[#334155]"
                          : ledState === -2
                            ? "bg-[#ef4444] shadow-[0_0_14px_#ef4444]"
                            : "bg-[#f59e0b] border-dashed"
                    }`}
                  >
                    <span className="text-[8px] font-black text-white">
                      {ledState === 1 ? "1" : ledState === 0 ? "0" : ledState === -2 ? "!" : "?"}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    LED
                  </span>
                </div>
              )}

              {/* C. Logic Gates: AND, OR, NOT, NAND, NOR, XOR, XNOR */}
              {isDigital && comp.type !== "SWITCH" && comp.type !== "LED" && (
                <div className="flex flex-col items-center justify-center pointer-events-none w-full h-full">
                  <span
                    className={`text-xs font-black tracking-wider uppercase ${
                      isDark ? "text-slate-100" : "text-slate-800"
                    }`}
                  >
                    {comp.type}
                  </span>
                  <div
                    className={`flex items-center gap-3 text-[7px] font-bold uppercase tracking-tighter ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <span>{comp.type === "NOT" ? "IN" : "A / B"}</span>
                    <span>OUT</span>
                  </div>
                </div>
              )}

              {/* D. Analog Components */}
              {!isDigital && (
                <div
                  className={`flex flex-col items-center pointer-events-none ${
                    isDark ? "text-slate-100" : "text-[#334155]"
                  }`}
                >
                  {analogIconMap[comp.type]}
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-[2px]">
                    {comp.type}
                  </span>
                </div>
              )}

              {/* Analog Meter Value Hover Tooltip */}
              {hoveredMeterId === comp.id && simResults?.status === "success" && (
                <div
                  className={`absolute -top-10 left-1/2 transform -translate-x-1/2 border-2 px-3 py-1 text-xs font-bold font-mono whitespace-nowrap z-50 pointer-events-none ${
                    isDark
                      ? "bg-[#0f172a] border-[#22c55e] text-white shadow-[2px_2px_0px_#000000]"
                      : "bg-[#334155] border-[#fce6b6] text-white shadow-[2px_2px_0px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  {comp.type === "voltmeter" && (
                    <span className={isDark ? "text-emerald-400" : "text-[#a8d5ba]"}>
                      {Number(simResults.voltages?.[comp.id] || 0).toFixed(3)} V
                    </span>
                  )}
                  {comp.type === "ammeter" && (
                    <span className={isDark ? "text-sky-300" : "text-[#c8e1e9]"}>
                      {Math.abs(Number(simResults.currents?.[comp.id] || 0)).toFixed(3)} A
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
