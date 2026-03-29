"use client"

import Link from "next/link"
import { FaArrowLeft } from "react-icons/fa"
import Sidebar from "../../components/Sidebar"
import SimulationPanel from "../../components/SimulationPanel"
import CircuitCanvas from "../../components/CircuitCanvas"

export default function SimulatorWorkspace() {
  return (
    <div className="flex flex-col w-full h-screen bg-[#F9F8F4] overflow-hidden text-slate-800 font-mono selection:bg-[#a8d5ba]">
      <div className="h-14 border-b-2 border-slate-800 bg-[#fce6b6] flex items-center px-6 justify-between shrink-0 z-20 shadow-[0_4px_0px_#334155]">
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-slate-800 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold border-2 border-slate-800 px-3 py-1 bg-[#F9F8F4] shadow-[2px_2px_0px_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <FaArrowLeft className="text-xs" /> Exit Workspace
          </Link>
          <div className="h-6 w-[2px] bg-slate-800"></div>
          <span className="font-bold tracking-widest uppercase text-xs flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-slate-800 bg-[#a8d5ba] animate-pulse"></span>
            CircuitSetu / Engine_Live
          </span>
        </div>
      </div>
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="w-64 border-r-2 border-slate-800 bg-[#c8e1e9] shrink-0 flex flex-col relative z-10 shadow-[4px_0_0px_rgba(51,65,85,0.1)]">
          <Sidebar />
        </div>
        <div 
          className="flex-1 relative h-full bg-[#F9F8F4]"
          style={{
            backgroundImage: 'linear-gradient(#e2e2e2 1px, transparent 1px), linear-gradient(90deg, #e2e2e2 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          <CircuitCanvas />
        </div>
        <div className="w-80 border-l-2 border-slate-800 bg-[#bfe3cc] shrink-0 flex flex-col relative z-10 shadow-[-4px_0_0px_rgba(51,65,85,0.1)]">
          <SimulationPanel />
        </div>

      </div>

    </div>
  )
}