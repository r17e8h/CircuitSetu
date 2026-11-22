// Digital Logic & Circuit Components Schema
// Supports Multi-Port Components for Dual-Mode (Analog & Digital) Workspace

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
  }
};

export function getDefaultPorts(type) {
  const def = COMPONENT_DEFINITIONS[type];
  if (def && def.ports) {
    return def.ports.map(p => ({ ...p }));
  }
  return [
    { id: "left", label: "A", type: "inout", offsetX: 0, offsetY: 20 },
    { id: "right", label: "B", type: "inout", offsetX: 80, offsetY: 20 }
  ];
}

export function getComponentDimensions(type) {
  const def = COMPONENT_DEFINITIONS[type];
  return {
    width: def?.width || 80,
    height: def?.height || 40
  };
}

export function createComponent(type, x, y) {
  const def = COMPONENT_DEFINITIONS[type] || {};
  const isDigital = def.mode === "digital" || isDigitalType(type);

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type,
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
  const ports = comp.ports && comp.ports.length > 0 ? comp.ports : getDefaultPorts(comp.type);
  const port = ports.find(p => p.id === portId) || ports[0];
  if (port) {
    return {
      x: comp.x + port.offsetX,
      y: comp.y + port.offsetY
    };
  }
  if (portId === "right") return { x: comp.x + 80, y: comp.y + 20 };
  return { x: comp.x, y: comp.y + 20 };
}
