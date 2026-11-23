import { DIGITAL_COMPONENT_DEFS } from "./digitalComponents";

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
    let pin1 = `${w.from}-${w.fromSide}`;
    let pin2 = `${w.to}-${w.toSide}`;
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
        nodeA: groups[find(`${c.id}-left`)].id,
        nodeB: groups[find(`${c.id}-right`)].id
      };
    });

  return JSON.stringify(payload);
}
export function generateDigitalPayload(components, wires) {
  const parent = new Map();

  const find = (key) => {
    if (!parent.has(key)) parent.set(key, key);
    if (parent.get(key) !== key) {
      parent.set(key, find(parent.get(key)));
    }
    return parent.get(key);
  };

  const union = (keyA, keyB) => {
    const rootA = find(keyA);
    const rootB = find(keyB);
    if (rootA !== rootB) parent.set(rootA, rootB);
  };

  for (const comp of components) {
    const ports = comp.ports || DIGITAL_COMPONENT_DEFS[comp.type]?.ports || [];
    for (const port of ports) {
      find(`${comp.id}:${port.id}`);
    }
  }

  for (const wire of wires) {
    const fromComp = wire.from ?? wire.fromComp;
    const fromPort = wire.fromSide ?? wire.fromPort;
    const toComp = wire.to ?? wire.toComp;
    const toPort = wire.toSide ?? wire.toPort;

    if (fromComp !== undefined && fromPort && toComp !== undefined && toPort) {
      union(`${fromComp}:${fromPort}`, `${toComp}:${toPort}`);
    }
  }

  const rootToNet = new Map();
  let netCounter = 1;

  const getNetId = (compId, portId) => {
    const root = find(`${compId}:${portId}`);
    if (!rootToNet.has(root)) {
      rootToNet.set(root, `net_${netCounter++}`);
    }
    return rootToNet.get(root);
  };

  const serializedComponents = components.map((comp) => {
    const ports = comp.ports || DIGITAL_COMPONENT_DEFS[comp.type]?.ports || [];
    const inNets = [];
    let outNet = "";

    for (const port of ports) {
      const netId = getNetId(comp.id, port.id);
      if (port.dir === "in") inNets.push(netId);
      if (port.dir === "out") outNet = netId;
    }

    if (comp.type === "SWITCH") {
      return {
        id: String(comp.id),
        type: "SWITCH",
        state: comp.state ?? 0,
        out_net: outNet,
      };
    }

    if (comp.type === "LED") {
      return {
        id: String(comp.id),
        type: "LED",
        in_nets: inNets,
      };
    }

    return {
      id: String(comp.id),
      type: comp.type,
      in_nets: inNets,
      out_net: outNet,
    };
  });

  const wireNetMap = {};
  for (const wire of wires) {
    const fromComp = wire.from ?? wire.fromComp;
    const fromPort = wire.fromSide ?? wire.fromPort;
    if (wire.id !== undefined && fromComp !== undefined && fromPort) {
      wireNetMap[wire.id] = getNetId(fromComp, fromPort);
    }
  }

  return {
    payloadJson: JSON.stringify({
      nets: Array.from(rootToNet.values()),
      components: serializedComponents,
    }),
    wireNetMap,
  };
}
