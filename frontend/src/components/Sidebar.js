"use client"

const circuitComponents = [
  { type: 'voltage_source', label: '9V Battery', symbol: '⚡' },
  { type: 'resistor', label: 'Resistor', symbol: '〰️' },
  { type: 'ground', label: 'Ground', symbol: '⏚' },
  { type: 'wire', label: 'Wire Node', symbol: '🔗' }
];

export default function Sidebar() {
  
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-full h-full bg-[#c8e1e9] flex flex-col font-mono text-slate-800">
      
      <div className="p-4 border-b-2 border-slate-800 bg-[#a8d5ba] shadow-[0_4px_0px_rgba(51,65,85,0.1)] z-10">
        <h2 className="font-bold uppercase tracking-widest text-sm text-center">Toolbox</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {circuitComponents.map((c) => (
          <div
            key={c.type} 
            onDragStart={(event) => onDragStart(event, c.type)}
            draggable
            className="flex items-center gap-3 p-3 bg-[#F9F8F4] border-2 border-slate-800 shadow-[4px_4px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#334155] cursor-grab active:cursor-grabbing transition-all"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#fce6b6] border-2 border-slate-800 font-bold text-lg shrink-0">
              {c.symbol}
            </div>
            <span className="font-bold text-sm uppercase tracking-wide truncate">
              {c.label}
            </span>
          </div>
        ))}
      </div>
      <div className="p-4 border-t-2 border-slate-800 text-xs font-bold text-slate-600 bg-[#F9F8F4] text-center uppercase tracking-widest shrink-0">
        [ Drag to Graph ]
      </div>

    </aside>
  );
}