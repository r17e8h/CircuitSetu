"use client"

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  useReactFlow, 
  Background, 
  Controls 
} from 'reactflow';
import 'reactflow/dist/style.css';

function FlowArea() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onDragOver = useCallback((event) => {
    event.preventDefault(); 
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: { label: `${type.toUpperCase()}` },
        
        style: { 
          background: '#F9F8F4', 
          border: '2px solid #334155', 
          boxShadow: '4px 4px 0px #334155',
          borderRadius: '0px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: '#334155'
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background color="#ccc" gap={24} size={2} />
        <Controls 
          className="bg-[#fce6b6] border-2 border-slate-800 shadow-[4px_4px_0px_#334155] rounded-none fill-slate-800" 
          showInteractive={false} 
        />
      </ReactFlow>
    </div>
  );
}
export default function CircuitCanvas() {
  return (
    <ReactFlowProvider>
      <FlowArea />
    </ReactFlowProvider>
  );
}