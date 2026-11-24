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
  getPortDirection,
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

function getOrthogonalPoints(start, end, startDir = "right", endDir = "left") {
  const startIsHoriz = startDir === "left" || startDir === "right";
  const endIsHoriz = endDir === "left" || endDir === "right";

  if (startIsHoriz && endIsHoriz) {
    const midX = Math.round((start.x + end.x) / 2);
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  }
  if (!startIsHoriz && !endIsHoriz) {
    const midY = Math.round((start.y + end.y) / 2);
    return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
  }
  if (startIsHoriz && !endIsHoriz) {
    return [start, { x: end.x, y: start.y }, end];
  }
  return [start, { x: start.x, y: end.y }, end];
}

function pointsToSvgPath(points) {
  return points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");
}

function closestPointOnSegment(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: a.x, y: a.y, dist: Math.hypot(px - a.x, py - a.y) };
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return { x: Math.round(cx), y: Math.round(cy), dist: Math.hypot(px - cx, py - cy) };
}

export default function CircuitCanvas({
  components,
  setComponents,
  wires,
  setWires,
  selectedComponent,
  setSelectedComponent,
  simResults,
  hasAttemptedRun,
  onTriggerSim,
  isDark = false
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [wireStart, setWireStart] = useState(null);
  const [currentPointer, setCurrentPointer] = useState({ x: 0, y: 0 });
  const [wireSnapPreview, setWireSnapPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredMeterId, setHoveredMeterId] = useState(null);

  const canvasRef = useRef(null);
  const pointerStartRef = useRef({ x: 0, y: 0, compX: 0, compY: 0, time: 0 });
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const wireDragStartRef = useRef({ x: 0, y: 0, moved: false });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setZoom(0.75);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("circuit_components", JSON.stringify(components));
      localStorage.setItem("circuit_wires", JSON.stringify(wires));
    } catch (err) {
      console.error("Failed to save circuit state to localStorage:", err);
    }
  }, [components, wires]);

  function getComponent(id) {
    return components.find((c) => c.id === id);
  }

  function startWire(id, portId, clientX, clientY) {
    if (wireStart) {
      const startPort = wireStart.portId || wireStart.side;
      if (wireStart.id === id && startPort === portId) {
        setWireStart(null);
        setWireSnapPreview(null);
        return;
      }
      completePinConnection(wireStart.id, startPort, id, portId);
      setWireStart(null);
      setWireSnapPreview(null);
      return;
    }

    const comp = getComponent(id);
    const pos = comp ? getPortPosition(comp, portId) : { x: 0, y: 0 };
    setCurrentPointer(pos);
    setWireStart({ id, portId, side: portId });
    wireDragStartRef.current = { x: clientX, y: clientY, moved: false };
  }

  function completePinConnection(fromId, fromPort, toId, toPort) {
    if (fromId === toId && fromPort === toPort) return;
    const alreadyConnected = wires.some(
      (w) =>
        (w.from === fromId &&
          (w.fromPort || w.fromSide) === fromPort &&
          w.to === toId &&
          (w.toPort || w.toSide) === toPort) ||
        (w.to === fromId &&
          (w.toPort || w.toSide) === fromPort &&
          w.from === toId &&
          (w.fromPort || w.fromSide) === toPort)
    );
    if (alreadyConnected) return;

    const newWire = {
      id: `w-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      from: fromId,
      fromPort,
      fromSide: fromPort,
      to: toId,
      toPort,
      toSide: toPort
    };
    const updatedWires = [...wires, newWire];
    setWires(updatedWires);
    if (onTriggerSim) {
      onTriggerSim(components, updatedWires);
    }
  }

  function splitWireWithJunction(wireIdx, jx, jy, sourceCompId, sourcePortId) {
    const targetWire = wires[wireIdx];
    if (!targetWire) return;

    const junction = createComponent("JUNCTION", jx - 6, jy - 6);
    const w1 = {
      id: `w-${Date.now()}-a-${Math.floor(Math.random() * 1000)}`,
      from: targetWire.from,
      fromPort: targetWire.fromPort || targetWire.fromSide,
      fromSide: targetWire.fromPort || targetWire.fromSide,
      to: junction.id,
      toPort: "p0",
      toSide: "p0"
    };
    const w2 = {
      id: `w-${Date.now()}-b-${Math.floor(Math.random() * 1000)}`,
      from: junction.id,
      fromPort: "p0",
      fromSide: "p0",
      to: targetWire.to,
      toPort: targetWire.toPort || targetWire.toSide,
      toSide: targetWire.toPort || targetWire.toSide
    };
    const w3 = {
      id: `w-${Date.now()}-c-${Math.floor(Math.random() * 1000)}`,
      from: sourceCompId,
      fromPort: sourcePortId,
      fromSide: sourcePortId,
      to: junction.id,
      toPort: "p0",
      toSide: "p0"
    };

    const updatedComponents = [...components, junction];
    const updatedWires = [
      ...wires.slice(0, wireIdx),
      ...wires.slice(wireIdx + 1),
      w1,
      w2,
      w3
    ];

    setComponents(updatedComponents);
    setWires(updatedWires);
    if (onTriggerSim) {
      onTriggerSim(updatedComponents, updatedWires);
    }
  }

  function findNearestWirePoint(x, y, maxDist) {
    let best = null;
    wires.forEach((wire, idx) => {
      const from = getComponent(wire.from);
      const to = getComponent(wire.to);
      if (!from || !to) return;

      const fPort = wire.fromPort || wire.fromSide;
      const tPort = wire.toPort || wire.toSide;
      const start = getPortPosition(from, fPort);
      const end = getPortPosition(to, tPort);
      const pts = getOrthogonalPoints(
        start,
        end,
        getPortDirection(from, fPort),
        getPortDirection(to, tPort)
      );

      for (let k = 0; k < pts.length - 1; k++) {
        const hit = closestPointOnSegment(x, y, pts[k], pts[k + 1]);
        if (Math.hypot(hit.x - start.x, hit.y - start.y) < 10) continue;
        if (Math.hypot(hit.x - end.x, hit.y - end.y) < 10) continue;

        if (hit.dist < (best ? best.dist : maxDist)) {
          best = { wireIdx: idx, x: hit.x, y: hit.y, dist: hit.dist };
        }
      }
    });
    return best;
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
    const type =
      e.dataTransfer.getData("application/reactflow") ||
      e.dataTransfer.getData("component");
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

  function getConnectedNetId(compId, portId) {
    const wire = wires.find(
      (w) =>
        (w.from === compId && (w.fromPort === portId || w.fromSide === portId)) ||
        (w.to === compId && (w.toPort === portId || w.toSide === portId))
    );
    return wire?.netId;
  }
  const portConnectionCounts = {};
  wires.forEach((w) => {
    const k1 = `${w.from}:${w.fromPort || w.fromSide}`;
    const k2 = `${w.to}:${w.toPort || w.toSide}`;
    portConnectionCounts[k1] = (portConnectionCounts[k1] || 0) + 1;
    portConnectionCounts[k2] = (portConnectionCounts[k2] || 0) + 1;
  });

  const startComp = wireStart ? getComponent(wireStart.id) : null;
  const startPortId = wireStart ? wireStart.portId || wireStart.side : null;
  const startPos = startComp ? getPortPosition(startComp, startPortId) : null;
  const startDir = startComp ? getPortDirection(startComp, startPortId) : "right";
  const draftTarget = wireSnapPreview || currentPointer;
  const draftPoints =
    wireStart && startPos
      ? getOrthogonalPoints(startPos, draftTarget, startDir, "left")
      : [];

  return (
    <div
      ref={canvasRef}
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
      onDragOver={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || e.target.tagName === "svg") {
          setIsPanning(true);
          panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y
          };
          setSelectedComponent(null);
          setWireStart(null);
          setWireSnapPreview(null);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
        }
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - pan.x) / zoom;
        const canvasY = (e.clientY - rect.top - pan.y) / zoom;
        setCurrentPointer({ x: canvasX, y: canvasY });

        if (isPanning) {
          setPan({
            x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
            y: panStartRef.current.panY + (e.clientY - panStartRef.current.y)
          });
          return;
        }

        if (wireStart) {
          if (
            Math.hypot(
              e.clientX - wireDragStartRef.current.x,
              e.clientY - wireDragStartRef.current.y
            ) > 6
          ) {
            wireDragStartRef.current.moved = true;
          }
          const wireTol = (e.pointerType === "touch" ? 22 : 14) / zoom;
          const wireHit = findNearestWirePoint(canvasX, canvasY, wireTol);
          setWireSnapPreview(wireHit);
        }

        if (draggingId !== null) {
          const dx = (e.clientX - pointerStartRef.current.x) / zoom;
          const dy = (e.clientY - pointerStartRef.current.y) / zoom;
          if (Math.hypot(dx, dy) < 3 && !hasMovedRef.current) return;

          hasMovedRef.current = true;
          const x = Math.round(pointerStartRef.current.compX + dx);
          const y = Math.round(pointerStartRef.current.compY + dy);

          setComponents((prev) =>
            prev.map((c) => (c.id === draggingId ? { ...c, x, y } : c))
          );
        }
      }}
      onPointerUp={(e) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {}

        if (isPanning) {
          setIsPanning(false);
          return;
        }

        setDraggingId(null);

        if (wireStart) {
          if (!wireDragStartRef.current.moved) {
            return;
          }

          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left - pan.x) / zoom;
          const y = (e.clientY - rect.top - pan.y) / zoom;
          const pinTol = (e.pointerType === "touch" ? 28 : 18) / zoom;

          let targetComp = null;
          let targetPortId = null;
          let minDist = pinTol;

          components.forEach((c) => {
            const compPorts =
              c.ports && c.ports.length > 0 ? c.ports : getDefaultPorts(c.type);
            compPorts.forEach((p) => {
              const pos = getPortPosition(c, p.id);
              const d = Math.hypot(x - pos.x, y - pos.y);
              if (d < minDist) {
                minDist = d;
                targetComp = c;
                targetPortId = p.id;
              }
            });
          });

          const startPort = wireStart.portId || wireStart.side;
          if (targetComp && targetPortId) {
            completePinConnection(wireStart.id, startPort, targetComp.id, targetPortId);
          } else {
            // Otherwise check for mid-wire T-junction snap
            const wireTol = (e.pointerType === "touch" ? 22 : 14) / zoom;
            const wireHit = findNearestWirePoint(x, y, wireTol);
            if (wireHit) {
              splitWireWithJunction(
                wireHit.wireIdx,
                wireHit.x,
                wireHit.y,
                wireStart.id,
                startPort
              );
            }
          }

          setWireStart(null);
          setWireSnapPreview(null);
        }
      }}
    >
      {wireStart && (
        <div
          className={`absolute top-2.5 left-1/2 -translate-x-1/2 z-40 px-3 py-1 border-2 text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
            isDark
              ? "bg-[#0f172a] border-emerald-400 text-emerald-300 shadow-[3px_3px_0px_#000]"
              : "bg-[#fce6b6] border-slate-900 text-slate-900 shadow-[3px_3px_0px_#334155]"
          }`}
        >
          <span>Tap target pin or wire</span>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              setWireStart(null);
              setWireSnapPreview(null);
            }}
            className="px-1.5 py-0.5 bg-red-500 text-white border border-black text-[9px] font-black cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 flex flex-col z-30">
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
          {wires.map((wire, i) => {
            const from = getComponent(wire.from);
            const to = getComponent(wire.to);
            if (!from || !to) return null;

            const fPort = wire.fromPort || wire.fromSide;
            const tPort = wire.toPort || wire.toSide;
            const fromPos = getPortPosition(from, fPort);
            const toPos = getPortPosition(to, tPort);
            const pts = getOrthogonalPoints(
              fromPos,
              toPos,
              getPortDirection(from, fPort),
              getPortDirection(to, tPort)
            );
            const pathD = pointsToSvgPath(pts);

            const netState = simResults?.nets ? simResults.nets[wire.netId] : undefined;

            let strokeColor = isDark ? "#94a3b8" : "#334155";
            let strokeDash = undefined;
            let strokeWidth = 3;

            if (netState !== undefined) {
              if (netState === 1) {
                strokeColor = "#22c55e";
                strokeWidth = 3.5;
              } else if (netState === 0) {
                strokeColor = isDark ? "#94a3b8" : "#334155";
                strokeWidth = 3;
              } else if (netState === -1) {
                strokeColor = isDark ? "#fbbf24" : "#f59e0b";
                strokeDash = "6,4";
                strokeWidth = 2.5;
              } else if (netState === -2) {
                strokeColor = isDark ? "#f87171" : "#ef4444";
                strokeWidth = 4;
              }
            }

            return (
              <g key={wire.id || i} className="group cursor-pointer">
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  strokeLinejoin="round"
                  className="pointer-events-auto"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (wireStart) {
                      const rect = canvasRef.current.getBoundingClientRect();
                      const cx = (e.clientX - rect.left - pan.x) / zoom;
                      const cy = (e.clientY - rect.top - pan.y) / zoom;
                      const hit = findNearestWirePoint(cx, cy, 30 / zoom);
                      if (hit) {
                        splitWireWithJunction(
                          hit.wireIdx,
                          hit.x,
                          hit.y,
                          wireStart.id,
                          wireStart.portId || wireStart.side
                        );
                        setWireStart(null);
                        setWireSnapPreview(null);
                        return;
                      }
                    }
                    deleteWire(i);
                  }}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="pointer-events-none group-hover:stroke-red-500 transition-colors"
                />
              </g>
            );
          })}

          {components.map((comp) => {
            if (comp.type === "JUNCTION") return null;
            const ports =
              comp.ports && comp.ports.length > 0 ? comp.ports : getDefaultPorts(comp.type);
            return ports.map((p) => {
              const count = portConnectionCounts[`${comp.id}:${p.id}`] || 0;
              if (count < 2) return null;
              const pos = getPortPosition(comp, p.id);
              const netId = getConnectedNetId(comp.id, p.id);
              const state = netId !== undefined ? simResults?.nets?.[netId] : undefined;
              const dotFill =
                state === 1
                  ? "#22c55e"
                  : state === -2
                    ? "#ef4444"
                    : isDark
                      ? "#e2e8f0"
                      : "#1e293b";
              return (
                <circle
                  key={`dot-${comp.id}-${p.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={4.5}
                  fill={dotFill}
                  stroke={isDark ? "#0f172a" : "#ffffff"}
                  strokeWidth={1.5}
                  className="pointer-events-none"
                />
              );
            });
          })}

          {wireStart && draftPoints.length > 0 && (
            <path
              d={pointsToSvgPath(draftPoints)}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray="4,4"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="pointer-events-none animate-pulse"
            />
          )}

          {wireStart && wireSnapPreview && (
            <circle
              cx={wireSnapPreview.x}
              cy={wireSnapPreview.y}
              r={5.5}
              fill="#22c55e"
              stroke="#0f172a"
              strokeWidth={1.5}
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Components Layer */}
        {components.map((comp) => {
          const isActive = selectedComponent === comp.id;
          const isDigital = isDigitalType(comp.type);
          const ports =
            comp.ports && comp.ports.length > 0 ? comp.ports : getDefaultPorts(comp.type);
          const dims = getComponentDimensions(comp);
          const rotation = comp.rotation || 0;
          const displayName = comp.label?.trim() ? comp.label.trim() : comp.type;

          if (comp.type === "JUNCTION") {
            const jNetId = getConnectedNetId(comp.id, "p0");
            const jState = jNetId !== undefined ? simResults?.nets?.[jNetId] : undefined;
            const jColor =
              jState === 1
                ? "bg-[#22c55e] border-slate-900 shadow-[0_0_8px_#22c55e]"
                : jState === -2
                  ? "bg-[#ef4444] border-slate-900"
                  : isDark
                    ? "bg-slate-200 border-slate-900"
                    : "bg-slate-800 border-white";

            return (
              <div
                key={comp.id}
                title="Solder Junction (drag to move, select to delete)"
                style={{
                  left: comp.x,
                  top: comp.y,
                  width: `${dims.width}px`,
                  height: `${dims.height}px`
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (wireStart) {
                    completePinConnection(
                      wireStart.id,
                      wireStart.portId || wireStart.side,
                      comp.id,
                      "p0"
                    );
                    setWireStart(null);
                    setWireSnapPreview(null);
                    return;
                  }
                  setSelectedComponent(comp.id);
                  setDraggingId(comp.id);
                  pointerStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    compX: comp.x,
                    compY: comp.y,
                    time: Date.now()
                  };
                  hasMovedRef.current = false;
                  try {
                    canvasRef.current?.setPointerCapture(e.pointerId);
                  } catch {}
                }}
                className={`absolute rounded-full border-2 cursor-grab active:cursor-grabbing z-20 pointer-events-auto transition-transform ${jColor} ${
                  isActive ? "scale-150 ring-2 ring-amber-400" : ""
                }`}
              >
                {isActive && (
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      deleteComponent(comp.id);
                    }}
                    className="absolute -top-4 -left-4 w-5 h-5 bg-red-500 text-white border border-slate-900 rounded-full flex items-center justify-center font-bold text-xs z-40 cursor-pointer"
                    title="Delete junction"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }

          const isInputType = comp.type === "resistor" || comp.type === "battery";
          const isZero = Number(comp.value) === 0 || !comp.value;
          const showError = hasAttemptedRun && isInputType && isZero;

          const ledPortId = comp.type === "LED" ? ports[0]?.id || "in" : null;
          const ledNetId = comp.type === "LED" ? getConnectedNetId(comp.id, ledPortId) : null;
          const ledState =
            comp.type === "LED" && simResults?.nets && ledNetId !== undefined
              ? simResults.nets[ledNetId]
              : (simResults?.ledStates?.[comp.id] ?? comp.state ?? -1);

          return (
            <div
              key={comp.id}
              className={`absolute flex flex-col items-center justify-center border-2 font-mono cursor-grab active:cursor-grabbing z-10 transition-colors pointer-events-auto select-none ${
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
                if (e.target.closest(".port")) return;
                setSelectedComponent(comp.id);
                setDraggingId(comp.id);
                pointerStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  compX: comp.x,
                  compY: comp.y,
                  time: Date.now()
                };
                hasMovedRef.current = false;
                try {
                  canvasRef.current?.setPointerCapture(e.pointerId);
                } catch {}
              }}
              onPointerUp={(e) => {
                if (e.target.closest(".port")) return;
                const dist = Math.hypot(
                  e.clientX - pointerStartRef.current.x,
                  e.clientY - pointerStartRef.current.y
                );
                const elapsed = Date.now() - pointerStartRef.current.time;

                if (comp.type === "SWITCH" && dist < 8 && elapsed < 350) {
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
                  className="absolute -top-3.5 -left-3.5 w-7 h-7 md:w-6 md:h-6 bg-red-500 text-white border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-sm z-40 shadow-[2px_2px_0px_#000000] active:translate-y-[1px] active:translate-x-[1px] cursor-pointer"
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

              {ports.map((port) => {
                const isWireStart =
                  wireStart?.id === comp.id &&
                  (wireStart?.portId === port.id || wireStart?.side === port.id);
                const absPos = getPortPosition(comp, port.id);
                const relX = absPos.x - comp.x;
                const relY = absPos.y - comp.y;

                return (
                  <div
                    key={port.id}
                    data-port-id={port.id}
                    title={`${port.label || port.id} (${port.type})`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      startWire(comp.id, port.id, e.clientX, e.clientY);
                      try {
                        canvasRef.current?.setPointerCapture(e.pointerId);
                      } catch {}
                    }}
                    style={{
                      left: `${relX - 11}px`,
                      top: `${relY - 11}px`
                    }}
                    className="port absolute w-[22px] h-[22px] flex items-center justify-center cursor-crosshair z-20"
                  >
                    <span
                      className={`block w-[10px] h-[10px] border-2 transition-all pointer-events-none ${
                        isDark ? "border-[#000000]" : "border-[#334155]"
                      } ${
                        isWireStart
                          ? "bg-[#22c55e] scale-125"
                          : isDark
                            ? "bg-[#fce6b6] hover:bg-[#38bdf8]"
                            : "bg-[#fce6b6] hover:bg-[#c8e1e9]"
                      }`}
                    />
                  </div>
                );
              })}

              {/* COMPONENT BODY RENDERING */}
              {comp.type === "SWITCH" && (
                <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none px-1 py-0.5">
                  <div className="flex items-center gap-1.5">
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
                          ? isDark
                            ? "text-emerald-400"
                            : "text-emerald-700"
                          : isDark
                            ? "text-slate-400"
                            : "text-slate-500"
                      }`}
                    >
                      {comp.state === 1 ? "ON" : "OFF"}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 truncate max-w-full px-1 ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {displayName}
                  </span>
                </div>
              )}

              {comp.type === "LED" && (
                <div className="flex flex-col items-center justify-center pointer-events-none w-full h-full px-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDark ? "border-[#000000]" : "border-[#334155]"
                    } ${
                      ledState === 1
                        ? "bg-[#22c55e] shadow-[0_0_16px_#22c55e,0_0_4px_#4ade80]"
                        : ledState === 0
                          ? isDark
                            ? "bg-[#0f172a] border-slate-700"
                            : "bg-[#334155]"
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
                    className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 truncate max-w-full ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {displayName}
                  </span>
                </div>
              )}

              {isDigital && comp.type !== "SWITCH" && comp.type !== "LED" && (
                <div className="flex flex-col items-center justify-center pointer-events-none w-full h-full px-1">
                  <span
                    className={`text-xs font-black tracking-wider uppercase ${
                      isDark ? "text-slate-100" : "text-slate-800"
                    }`}
                  >
                    {comp.type}
                  </span>
                  {comp.label?.trim() ? (
                    <span
                      className={`text-[8px] font-bold uppercase truncate max-w-full ${
                        isDark ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      {comp.label.trim()}
                    </span>
                  ) : (
                    <div
                      className={`flex items-center gap-3 text-[7px] font-bold uppercase tracking-tighter ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <span>{comp.type === "NOT" ? "IN" : "A / B"}</span>
                      <span>OUT</span>
                    </div>
                  )}
                </div>
              )}

              {!isDigital && (
                <div
                  className={`flex flex-col items-center justify-center pointer-events-none ${
                    isDark ? "text-slate-100" : "text-[#334155]"
                  }`}
                >
                  <div style={{ transform: `rotate(${rotation}deg)` }}>
                    {analogIconMap[comp.type]}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-[2px] truncate max-w-full px-1">
                    {displayName}
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
