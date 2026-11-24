// Digital Logic & Circuit Components Schema
// Supports Multi-Port Components, 90° Rotation, Custom Labels, and Wire Junctions

export const ANALOG_COMPONENTS = [
  { type: "battery", label: "Battery" },
  { type: "resistor", label: "Resistor" },
  { type: "ground", label: "Ground" },
  { type: "ammeter", label: "Ammeter" },
  { type: "voltmeter", label: "Voltmeter" }
];

export const DIGITAL_COMPONENTS = [
  { type: "SWITCH", label: "Switch" },
  { type: "LED", label: "LED" },
  { type: "AND", label: "AND Gate" },
  { type: "OR", label: "OR Gate" },
  { type: "NOT", label: "NOT Gate" },
  { type: "NAND", label: "NAND Gate" },
  { type: "NOR", label: "NOR Gate" },
  { type: "XOR", label: "XOR Gate" },
  { type: "XNOR", label: "XNOR Gate" }
];

export const COMPONENT_DEFINITIONS = {
  // Analog Components
  battery: {
    label: "Battery",
    mode: "analog",
    width: 80,
    height: 40,
    defaultValue: 9,
    ports: [
      { id: "left", label: "+", type: "inout", offsetX: 0, offsetY: 20 },
      { id: "right", label: "-", type: "inout", offsetX: 80, offsetY: 20 }
    ]
  },
  resistor: {
    label: "Resistor",
    mode: "analog",
    width: 80,
    height: 40,
    defaultValue: 100,
    ports: [
      { id: "left", label: "A", type: "inout", offsetX: 0, offsetY: 20 },
      { id: "right", label: "B", type: "inout", offsetX: 80, offsetY: 20 }
    ]
  },
  ground: {
    label: "Ground",
    mode: "analog",
    width: 80,
    height: 40,
    defaultValue: 0,
    ports: [
      { id: "left", label: "G", type: "inout", offsetX: 0, offsetY: 20 },
      { id: "right", label: "G", type: "inout", offsetX: 80, offsetY: 20 }
    ]
  },
  ammeter: {
    label: "Ammeter",
    mode: "analog",
    width: 80,
    height: 40,
    defaultValue: 0,
    ports: [
      { id: "left", label: "+", type: "inout", offsetX: 0, offsetY: 20 },
      { id: "right", label: "-", type: "inout", offsetX: 80, offsetY: 20 }
    ]
  },
  voltmeter: {
    label: "Voltmeter",
    mode: "analog",
    width: 80,
    height: 40,
    defaultValue: 0,
    ports: [
      { id: "left", label: "+", type: "inout", offsetX: 0, offsetY: 20 },
      { id: "right", label: "-", type: "inout", offsetX: 80, offsetY: 20 }
    ]
  },

  // Digital Components
  SWITCH: {
    label: "Switch",
    mode: "digital",
    width: 80,
    height: 46,
    defaultState: 0,
    ports: [
      { id: "out", label: "OUT", type: "output", offsetX: 80, offsetY: 23 }
    ]
  },
  LED: {
    label: "LED",
    mode: "digital",
    width: 80,
    height: 46,
    defaultState: 0,
    ports: [
      { id: "in", label: "IN", type: "input", offsetX: 0, offsetY: 23 }
    ]
  },
  AND: {
    label: "AND Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in1", label: "A", type: "input", offsetX: 0, offsetY: 15 },
      { id: "in2", label: "B", type: "input", offsetX: 0, offsetY: 35 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },
  OR: {
    label: "OR Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in1", label: "A", type: "input", offsetX: 0, offsetY: 15 },
      { id: "in2", label: "B", type: "input", offsetX: 0, offsetY: 35 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },
  NOT: {
    label: "NOT Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in", label: "A", type: "input", offsetX: 0, offsetY: 25 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },
  NAND: {
    label: "NAND Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in1", label: "A", type: "input", offsetX: 0, offsetY: 15 },
      { id: "in2", label: "B", type: "input", offsetX: 0, offsetY: 35 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },
  NOR: {
    label: "NOR Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in1", label: "A", type: "input", offsetX: 0, offsetY: 15 },
      { id: "in2", label: "B", type: "input", offsetX: 0, offsetY: 35 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },
  XOR: {
    label: "XOR Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in1", label: "A", type: "input", offsetX: 0, offsetY: 15 },
      { id: "in2", label: "B", type: "input", offsetX: 0, offsetY: 35 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },
  XNOR: {
    label: "XNOR Gate",
    mode: "digital",
    width: 80,
    height: 50,
    ports: [
      { id: "in1", label: "A", type: "input", offsetX: 0, offsetY: 15 },
      { id: "in2", label: "B", type: "input", offsetX: 0, offsetY: 35 },
      { id: "out", label: "Y", type: "output", offsetX: 80, offsetY: 25 }
    ]
  },

  JUNCTION: {
    label: "Junction",
    mode: "digital",
    width: 12,
    height: 12,
    ports: [
      { id: "p0", label: "J", type: "bidirectional", offsetX: 6, offsetY: 6 }
    ]
  }
};

export function getDefaultPorts(type) {
  const def = COMPONENT_DEFINITIONS[type];
  if (def && def.ports) {
    return def.ports.map((p) => ({ ...p }));
  }
  return [
    { id: "left", label: "A", type: "inout", offsetX: 0, offsetY: 20 },
    { id: "right", label: "B", type: "inout", offsetX: 80, offsetY: 20 }
  ];
}

export function getComponentDimensions(compOrType, explicitRotation = 0) {
  const isObj = typeof compOrType === "object" && compOrType !== null;
  const type = isObj ? compOrType.type : compOrType;
  const rotation = (((isObj ? compOrType.rotation : explicitRotation) || 0) % 360 + 360) % 360;

  const def = COMPONENT_DEFINITIONS[type];
  const baseW = def?.width || 80;
  const baseH = def?.height || 40;

  if (rotation === 90 || rotation === 270) {
    return { width: baseH, height: baseW };
  }
  return { width: baseW, height: baseH };
}

export function createComponent(type, x, y) {
  const def = COMPONENT_DEFINITIONS[type] || {};
  const isDigital = def.mode === "digital" || isDigitalType(type);

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type,
    label: "",
    rotation: 0,
    x: Math.round(x),
    y: Math.round(y),
    ports: getDefaultPorts(type),
    state: isDigital ? (def.defaultState ?? 0) : undefined,
    value: !isDigital ? (def.defaultValue ?? 0) : undefined
  };
}

export function isDigitalType(type) {
  return [
    "SWITCH", "LED", "AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"
  ].includes(type);
}

export function getPortPosition(comp, portId) {
  if (!comp) return { x: 0, y: 0 };
  const def = COMPONENT_DEFINITIONS[comp.type];
  const baseW = def?.width || 80;
  const baseH = def?.height || 40;

  const ports = comp.ports && comp.ports.length > 0 ? comp.ports : getDefaultPorts(comp.type);
  const port = ports.find((p) => p.id === portId) || ports[0];

  const ox = port ? port.offsetX : portId === "right" ? baseW : 0;
  const oy = port ? port.offsetY : baseH / 2;

  const rotation = (((comp.rotation || 0) % 360) + 360) % 360;
  const cx = baseW / 2;
  const cy = baseH / 2;
  const dx = ox - cx;
  const dy = oy - cy;

  if (rotation === 90) {
    return { x: comp.x + baseH / 2 - dy, y: comp.y + baseW / 2 + dx };
  }
  if (rotation === 180) {
    return { x: comp.x + cx - dx, y: comp.y + cy - dy };
  }
  if (rotation === 270) {
    return { x: comp.x + baseH / 2 + dy, y: comp.y + baseW / 2 - dx };
  }
  return { x: comp.x + ox, y: comp.y + oy };
}

export function getPortDirection(comp, portId) {
  if (!comp || comp.type === "JUNCTION") return "right";

  const def = COMPONENT_DEFINITIONS[comp.type];
  const baseW = def?.width || 80;
  const baseH = def?.height || 40;

  const ports = comp.ports && comp.ports.length > 0 ? comp.ports : getDefaultPorts(comp.type);
  const port = ports.find((p) => p.id === portId) || ports[0];

  let baseDir = "right";
  if (port) {
    if (port.offsetX === 0) baseDir = "left";
    else if (port.offsetX === baseW) baseDir = "right";
    else if (port.offsetY === 0) baseDir = "top";
    else if (port.offsetY === baseH) baseDir = "bottom";
  } else if (portId === "left" || portId === "in" || portId === "in1" || portId === "in2") {
    baseDir = "left";
  }

  const dirs = ["right", "bottom", "left", "top"];
  const steps = Math.round((((comp.rotation || 0) % 360) + 360) % 360 / 90);
  return dirs[(dirs.indexOf(baseDir) + steps) % 4];
}
