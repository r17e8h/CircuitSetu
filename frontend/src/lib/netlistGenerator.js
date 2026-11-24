// Netlist Generator & Simulation Bridge
// Handles both Analog (MNA Solver) and Digital Logic (DLCD) simulations

export function generateSimulationPayload(components, wires) {
  let parent = {};
  
  function find(i) {
    if (parent[i] === undefined) parent[i] = i;
    if (parent[i] === i) return i;
    return parent[i] = find(parent[i]);
  } 
  function union(i, j) {
    let rootI = find(i);
    let rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  }
  wires.forEach(w => {
    let pin1 = `${w.from}-${w.fromPort || w.fromSide || 'left'}`;
    let pin2 = `${w.to}-${w.toPort || w.toSide || 'right'}`;
    union(pin1, pin2);
  });
  let groups = {};
  components.forEach(c => {
    ['left', 'right'].forEach(side => {
      let pin = `${c.id}-${side}`;
      let root = find(pin);
      if (!groups[root]) groups[root] = { id: null, hasGround: false };
      
      if (c.type === 'ground') groups[root].hasGround = true;
    });
  });
  let nextNodeId = 1;
  Object.keys(groups).forEach(root => {
    if (groups[root].hasGround) {
      groups[root].id = 0;
    } else {
      groups[root].id = nextNodeId++; 
    }
  });
  let payload = components
    .filter(c => c.type !== 'ground') 
    .map(c => {
      let engType = c.type === 'battery' ? 'voltage_source' : c.type;
      let val = c.value !== undefined ? Number(c.value) : 
                (engType === 'voltage_source' ? 0.0 : 
                 engType === 'resistor' ? 0.0 : 0.0);
                
      return {
        id: c.id.toString(),
        type: engType,
        value: val,
        nodeA: groups[find(`${c.id}-left`)]?.id ?? 0,
        nodeB: groups[find(`${c.id}-right`)]?.id ?? 0
      };
    });

  return JSON.stringify(payload);
}

// Digital Logic Simulator & Net Resolver
// Resolves nets, propagates logic gate states, and detects conflicts
export function simulateDigitalCircuit(components, wires) {
  let parent = {};

  function find(i) {
    if (parent[i] === undefined) parent[i] = i;
    if (parent[i] === i) return i;
    return (parent[i] = find(parent[i]));
  }

  function union(i, j) {
    let rootI = find(i);
    let rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  }

  // 1. Group connected pins via wires
  wires.forEach((w) => {
    const p1 = `${w.from}:${w.fromPort || w.fromSide || "out"}`;
    const p2 = `${w.to}:${w.toPort || w.toSide || "in"}`;
    union(p1, p2);
  });

  // 2. Identify canonical net IDs for every connected pin cluster
  const rootToNetId = {};
  let nextNetNum = 0;

  function getNetIdForPin(pinKey) {
    const root = find(pinKey);
    if (!rootToNetId[root]) {
      rootToNetId[root] = `net_${nextNetNum++}`;
    }
    return rootToNetId[root];
  }

  const wiresWithNets = wires.map((w) => {
    const p1 = `${w.from}:${w.fromPort || w.fromSide || "out"}`;
    const p2 = `${w.to}:${w.toPort || w.toSide || "in"}`;
    const netId = getNetIdForPin(p1);
    getNetIdForPin(p2);
    return { ...w, netId };
  });

  function getPortNetId(compId, portId) {
    const pinKey = `${compId}:${portId}`;
    if (parent[pinKey] !== undefined) {
      return rootToNetId[find(pinKey)];
    }
    return null;
  }

  const allNetIds = Object.values(rootToNetId);

  // 3. Primary Solver: C++ WebAssembly Engine
  if (typeof window !== "undefined" && window.Module && typeof window.Module.cwrap === "function") {
    try {
      const runDigitalSim = window.Module.cwrap("run_digital_simulation", "string", ["string"]);
      const payload = JSON.stringify({
        nets: allNetIds,
        components: components.map((c) => ({
          id: c.id.toString(),
          type: c.type,
          state: c.state ?? 0,
          in_net: getPortNetId(c.id, "in") || "",
          in1_net: getPortNetId(c.id, "in1") || "",
          in2_net: getPortNetId(c.id, "in2") || "",
          out_net: getPortNetId(c.id, "out") || "",
        })),
      });

      const wasmResponse = JSON.parse(runDigitalSim(payload));

      if (wasmResponse && wasmResponse.status === "success" && wasmResponse.nets) {
        const ledStates = {};
        components.forEach((comp) => {
          if (comp.type === "LED") {
            const inNet = getPortNetId(comp.id, "in");
            ledStates[comp.id] =
              inNet !== null && wasmResponse.nets[inNet] !== undefined
                ? wasmResponse.nets[inNet]
                : -1;
          }
        });

        return {
          status: "success",
          nets: wasmResponse.nets,
          wires: wiresWithNets,
          ledStates,
          ticks: wasmResponse.ticks ?? 0,
          oscillating: wasmResponse.oscillating ?? false,
          warnings: wasmResponse.warnings ?? [],
        };
      }
    } catch (err) {
      console.warn("WASM digital solver fallback triggered:", err);
    }
  }

  // 4. Fallback Solver (runs only while WASM binary is still loading)
  const netStates = {};
  allNetIds.forEach((netId) => {
    netStates[netId] = -1;
  });

  function getPortValue(compId, portId) {
    const netId = getPortNetId(compId, portId);
    if (!netId || netStates[netId] === undefined) return -1;
    return netStates[netId];
  }

  const MAX_TICKS = 50;
  let changed = true;
  let ticks = 0;

  while (changed && ticks < MAX_TICKS) {
    changed = false;
    ticks++;

    const netDrivers = {};
    Object.keys(netStates).forEach((netId) => {
      netDrivers[netId] = [];
    });

    components.forEach((comp) => {
      if (comp.type === "SWITCH") {
        const outNet = getPortNetId(comp.id, "out");
        if (outNet && netDrivers[outNet]) {
          netDrivers[outNet].push(comp.state === 1 ? 1 : 0);
        }
      }
    });

    components.forEach((comp) => {
      const type = comp.type;
      if (["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"].includes(type)) {
        const outNet = getPortNetId(comp.id, "out");
        if (!outNet || !netDrivers[outNet]) return;

        let gateOutput = -1;
        if (type === "NOT") {
          const inVal = getPortValue(comp.id, "in");
          if (inVal === 1) gateOutput = 0;
          else if (inVal === 0) gateOutput = 1;
        } else {
          const in1 = getPortValue(comp.id, "in1");
          const in2 = getPortValue(comp.id, "in2");
          if (type === "AND") {
            if (in1 === 0 || in2 === 0) gateOutput = 0;
            else if (in1 === 1 && in2 === 1) gateOutput = 1;
          } else if (type === "OR") {
            if (in1 === 1 || in2 === 1) gateOutput = 1;
            else if (in1 === 0 && in2 === 0) gateOutput = 0;
          } else if (type === "NAND") {
            if (in1 === 0 || in2 === 0) gateOutput = 1;
            else if (in1 === 1 && in2 === 1) gateOutput = 0;
          } else if (type === "NOR") {
            if (in1 === 1 || in2 === 1) gateOutput = 0;
            else if (in1 === 0 && in2 === 0) gateOutput = 1;
          } else if (type === "XOR") {
            if ((in1 === 0 || in1 === 1) && (in2 === 0 || in2 === 1)) gateOutput = in1 ^ in2;
          } else if (type === "XNOR") {
            if ((in1 === 0 || in1 === 1) && (in2 === 0 || in2 === 1)) gateOutput = in1 === in2 ? 1 : 0;
          }
        }

        if (gateOutput !== -1) {
          netDrivers[outNet].push(gateOutput);
        }
      }
    });

    Object.keys(netDrivers).forEach((netId) => {
      const drivers = netDrivers[netId];
      let resolved = -1;
      if (drivers.length > 0) {
        const hasHigh = drivers.includes(1);
        const hasLow = drivers.includes(0);
        if (hasHigh && hasLow) resolved = -2;
        else if (hasHigh) resolved = 1;
        else if (hasLow) resolved = 0;
      }
      if (netStates[netId] !== resolved) {
        netStates[netId] = resolved;
        changed = true;
      }
    });
  }

  const ledStates = {};
  components.forEach((comp) => {
    if (comp.type === "LED") {
      const inNet = getPortNetId(comp.id, "in");
      ledStates[comp.id] = inNet !== null && netStates[inNet] !== undefined ? netStates[inNet] : -1;
    }
  });

  return {
    status: "success",
    nets: netStates,
    wires: wiresWithNets,
    ledStates,
    ticks,
    warnings: [],
  };
}

// Assigns netId to each wire without running full simulation
export function assignWireNetIds(wires) {
  let parent = {};

  function find(i) {
    if (parent[i] === undefined) parent[i] = i;
    if (parent[i] === i) return i;
    return (parent[i] = find(parent[i]));
  }

  function union(i, j) {
    let rootI = find(i);
    let rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  }

  wires.forEach(w => {
    const p1 = `${w.from}:${w.fromPort || w.fromSide || 'out'}`;
    const p2 = `${w.to}:${w.toPort || w.toSide || 'in'}`;
    union(p1, p2);
  });

  const rootToNetId = {};
  let nextNetNum = 0;

  return wires.map(w => {
    const p1 = `${w.from}:${w.fromPort || w.fromSide || 'out'}`;
    const root = find(p1);
    if (!rootToNetId[root]) {
      rootToNetId[root] = `net_${nextNetNum++}`;
    }
    return {
      ...w,
      netId: rootToNetId[root]
    };
  });
}
