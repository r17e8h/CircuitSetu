"use client"
import { FaBatteryFull } from "react-icons/fa"
import { TbCircuitResistor, TbCircuitSwitchOpen, TbCircuitGround, TbCircuitAmmeter, TbCircuitVoltmeter } from "react-icons/tb";
import { useState, useEffect } from "react";

const iconMap = {
  battery: <FaBatteryFull className="text-xl" />,
  switch: <TbCircuitSwitchOpen className="text-xl" />,
  resistor: <TbCircuitResistor className="text-xl" />,
  ground: <TbCircuitGround className="text-xl" />,
  ammeter: <TbCircuitAmmeter className="text-xl" />,
  voltmeter: <TbCircuitVoltmeter className="text-xl" />
}

export default function CircuitCanvas({
  components,
  setComponents,
  wires,
  setWires,
  selectedComponent,
  setSelectedComponent,
  simResults 
}) {

  const [draggingId, setDraggingId] = useState(null)
  const [wireStart, setWireStart] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [hoveredMeterId, setHoveredMeterId] = useState(null)

  useEffect(() => {
    localStorage.setItem('circuit_components', JSON.stringify(components));
    localStorage.setItem('circuit_wires', JSON.stringify(wires));
  }, [components, wires]);

  function startWire(id, side){
    setWireStart({ id, side })
  }

  function handleMouseDown(id){
    setDraggingId(id)
  }

  function drop(e){
    e.preventDefault()
    const type = e.dataTransfer.getData("application/reactflow") || e.dataTransfer.getData("component")
    if(!type) return;

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left - pan.x) / zoom) - 40 
    const y = ((e.clientY - rect.top - pan.y) / zoom) - 20

    setComponents([
      ...components,
      {
        id: Date.now(),
        type,
        x,
        y,
        value: type === "battery" ? 0 : type === "resistor" ? 0 : 0
      }
    ])
  }

  function allowDrop(e){
    e.preventDefault()
  }

  function getComponent(id){
    return components.find(c=>c.id===id)
  }

  function deleteComponent(id){
    setComponents(prev => prev.filter(c => c.id !== id))
    setWires(prev => prev.filter(w => w.from !== id && w.to !== id))
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-[#F9F8F4] ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
      style={{
        backgroundImage: 'linear-gradient(#e2e2e2 1px, transparent 1px), linear-gradient(90deg, #e2e2e2 1px, transparent 1px)',
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }}
      onDrop={drop}
      onDragOver={allowDrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setIsPanning(true)
          setSelectedComponent(null)
        }
      }}
      
      onMouseLeave={() => setIsPanning(false)}

      onMouseMove={(e) => {
        if (isPanning) {
          setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }))
          return
        }
        if(draggingId === null) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left - pan.x) / zoom) - 40
        const y = ((e.clientY - rect.top - pan.y) / zoom) - 20

        setComponents(prev =>
          prev.map(c => c.id === draggingId ? { ...c, x, y } : c)
        )
      }}

      onMouseUp={(e) => {
        if (isPanning) {
          setIsPanning(false)
          return
        }

        setDraggingId(null)
        if(!wireStart) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left - pan.x) / zoom)
        const y = ((e.clientY - rect.top - pan.y) / zoom)

        let target = null
        let targetSide = null

        components.forEach(c => {
          const leftPortX = c.x
          const rightPortX = c.x + 80
          const portY = c.y + 20

          if(Math.abs(x - leftPortX) < 15 && Math.abs(y - portY) < 15){
            target = c; targetSide = "left";
          }
          if(Math.abs(x - rightPortX) < 15 && Math.abs(y - portY) < 15){
            target = c; targetSide = "right";
          }
        })

        if(!target || (target.id === wireStart.id && targetSide === wireStart.side)){
          setWireStart(null)
          return
        }

        setWires(prev => [...prev, {
          from: wireStart.id,
          to: target.id,
          fromSide: wireStart.side,
          toSide: targetSide
        }])
        setWireStart(null)
      }}
    >
      <div className="absolute bottom-6 left-6 flex flex-col z-50">
        <button 
          onClick={() => setZoom(z => Math.min(z + 0.2, 2))} 
          className="w-8 h-8 bg-[#fce6b6] border-2 border-[#334155] border-b-0 shadow-[4px_0_0px_#334155] hover:bg-[#a8d5ba] active:bg-[#64a982] font-bold flex items-center justify-center transition-colors pb-[2px] cursor-pointer"
          title="Zoom In"
        >
          ＋
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} 
          className="w-8 h-8 bg-[#fce6b6] border-2 border-[#334155] shadow-[4px_4px_0px_#334155] hover:bg-[#a8d5ba] active:bg-[#64a982] active:translate-y-[2px] active:shadow-[4px_2px_0px_#334155] font-bold text-xl flex items-center justify-center transition-colors pb-[2px] cursor-pointer"
          title="Zoom Out"
        >
          －
        </button>
      </div>
      <div 
        className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-0">
          {wires.map((wire, i) => {
            const from = getComponent(wire.from)
            const to = getComponent(wire.to)
            if(!from || !to) return null

            const fromX = from.x + (wire.fromSide === "left" ? 0 : 80)
            const fromY = from.y + 20
            const toX = to.x + (wire.toSide === "left" ? 0 : 80)
            const toY = to.y + 20

            return(
              <line
                key={i}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="#334155"
                strokeWidth="3"
                className="cursor-pointer hover:stroke-red-500 transition-colors pointer-events-auto"
                onClick={() => setWires(prev => prev.filter((_, index) => index !== i))}
              />
            )
          })}
        </svg>
        {components.map(comp => {
          const isActive = selectedComponent === comp.id;

          return(
            <div
              key={comp.id}
              className={`absolute flex flex-col items-center justify-center w-[80px] h-[40px] border-2 font-mono text-[#334155] cursor-grab active:cursor-grabbing z-10 transition-colors pointer-events-auto ${
                isActive 
                  ? 'bg-[#a8d5ba] border-green-600 translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_#334155]' 
                  : 'bg-[#F9F8F4] border-[#334155] shadow-[4px_4px_0px_#334155]'
              }`}
              style={{ left: comp.x, top: comp.y }}
              onMouseEnter={() => {
                if (comp.type === 'ammeter' || comp.type === 'voltmeter') {
                  setHoveredMeterId(comp.id);
                }
              }}
              onMouseLeave={() => setHoveredMeterId(null)}

              onMouseDown={(e)=>{
                if(e.target.classList.contains("port")) return
                setSelectedComponent(comp.id)
                handleMouseDown(comp.id)
              }}
              onContextMenu={(e)=>{
                e.preventDefault()
                deleteComponent(comp.id)
              }}
            >
              <div
                className={`port absolute left-[-7px] top-[13px] w-[10px] h-[10px] border-2 border-[#334155] cursor-crosshair z-20 ${wireStart?.id === comp.id && wireStart?.side === 'left' ? 'bg-[#a8d5ba]' : 'bg-[#fce6b6] hover:bg-[#c8e1e9]'}`}
                onMouseDown={(e)=>{
                  e.stopPropagation(); startWire(comp.id, "left");
                }}
              />

              <div className="flex flex-col items-center pointer-events-none">
                {iconMap[comp.type]}
                <span className="text-[9px] font-bold uppercase tracking-wider mt-[2px]">{comp.type}</span>
              </div>
              {hoveredMeterId === comp.id && simResults?.status === "success" && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#334155] border-2 border-[#fce6b6] text-white px-3 py-1 text-xs font-bold font-mono shadow-[2px_2px_0px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap z-50">
                  {comp.type === 'voltmeter' && (
                    <span className="text-[#a8d5ba]">
                      {Number(simResults.voltages?.[comp.id] || 0).toFixed(3)} V
                    </span>
                  )}
                  {comp.type === 'ammeter' && (
                    <span className="text-[#c8e1e9]">
                      {Math.abs(Number(simResults.currents?.[comp.id] || 0)).toFixed(3)} A
                    </span>
                  )}
                </div>
              )}

              <div
                className={`port absolute right-[-7px] top-[13px] w-[10px] h-[10px] border-2 border-[#334155] cursor-crosshair z-20 ${wireStart?.id === comp.id && wireStart?.side === 'right' ? 'bg-[#a8d5ba]' : 'bg-[#fce6b6] hover:bg-[#c8e1e9]'}`}
                onMouseDown={(e)=>{
                  e.stopPropagation(); startWire(comp.id, "right");
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}