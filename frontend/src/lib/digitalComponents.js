export const DIGITAL_COMPONENT_DEFS = {
  SWITCH: {
    type: "SWITCH",
    label: "Switch",
    category: "io",
    width: 60,
    height: 40,
    defaultState: 0,
    ports: [{ id: "out", dir: "out", offsetX: 60, offsetY: 20 }],
  },
  LED: {
    type: "LED",
    label: "LED",
    category: "io",
    width: 60,
    height: 40,
    ports: [{ id: "in1", dir: "in", offsetX: 0, offsetY: 20 }],
  },
  NOT: {
    type: "NOT",
    label: "NOT",
    category: "gate",
    width: 80,
    height: 40,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 20 },
    ],
  },
  AND: {
    type: "AND",
    label: "AND",
    category: "gate",
    width: 80,
    height: 60,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "in2", dir: "in", offsetX: 0, offsetY: 40 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 30 },
    ],
  },
  OR: {
    type: "OR",
    label: "OR",
    category: "gate",
    width: 80,
    height: 60,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "in2", dir: "in", offsetX: 0, offsetY: 40 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 30 },
    ],
  },
  NAND: {
    type: "NAND",
    label: "NAND",
    category: "gate",
    width: 80,
    height: 60,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "in2", dir: "in", offsetX: 0, offsetY: 40 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 30 },
    ],
  },
  NOR: {
    type: "NOR",
    label: "NOR",
    category: "gate",
    width: 80,
    height: 60,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "in2", dir: "in", offsetX: 0, offsetY: 40 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 30 },
    ],
  },
  XOR: {
    type: "XOR",
    label: "XOR",
    category: "gate",
    width: 80,
    height: 60,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "in2", dir: "in", offsetX: 0, offsetY: 40 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 30 },
    ],
  },
  XNOR: {
    type: "XNOR",
    label: "XNOR",
    category: "gate",
    width: 80,
    height: 60,
    ports: [
      { id: "in1", dir: "in", offsetX: 0, offsetY: 20 },
      { id: "in2", dir: "in", offsetX: 0, offsetY: 40 },
      { id: "out", dir: "out", offsetX: 80, offsetY: 30 },
    ],
  },
};

export const DIGITAL_COMPONENT_LIST = Object.values(DIGITAL_COMPONENT_DEFS);

export function createDigitalComponent(type, x, y) {
  const normalizedType = String(type || "").toUpperCase();
  const def = DIGITAL_COMPONENT_DEFS[normalizedType];
  if (!def) throw new Error(`Unknown digital component type: ${type}`);

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type: def.type,
    x,
    y,
    width: def.width,
    height: def.height,
    state: def.defaultState ?? 0,
    ports: def.ports.map((p) => ({ ...p })),
  };
}
