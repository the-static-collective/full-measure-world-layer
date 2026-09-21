export type Resource = "time" | "cash" | "food" | "transport" | "attention";
export type CultureTrace = "hospitality" | "stewardship" | "discipleship" | "prayer" | "rest" | "mutual_aid";

export interface Stocks {
  time: number;
  cash: number;
  food: number;
  transport: number;
  attention: number;
}

export interface Demand {
  id: string;
  label: string;
  amount: number;
  met: number;
  required: boolean;
}

export interface CultureState {
  stocks: Stocks;
  demands: Demand[];
  traces: Record<CultureTrace, number>;
  history: EconomyReceipt[];
}

export interface EconomyAction {
  id: string;
  label: string;
  costs: Partial<Stocks>;
  produces?: Partial<Stocks>;
  addresses?: { demandId: string; amount: number }[];
  traces?: Partial<Record<CultureTrace, number>>;
  note: string;
}

export interface EconomyReceipt {
  id: string;
  actionId: string;
  consumed: Partial<Stocks>;
  produced: Partial<Stocks>;
  demandDelta: { demandId: string; before: number; after: number }[];
  cultureDelta: Partial<Record<CultureTrace, number>>;
  opportunityCost: string[];
  residualDemands: string[];
  nonClaims: string[];
}

export const economyActions: Record<string, EconomyAction> = {
  "feed-home": {
    id: "feed-home",
    label: "Make Dinner at Home",
    costs: { time: 1, food: 1 },
    addresses: [{ demandId: "home-dinner", amount: 1 }],
    traces: { stewardship: 1 },
    note: "Use the one ready serving and one time block to meet tonight's home meal."
  },
  "share-meal": {
    id: "share-meal",
    label: "Share the Ready Meal",
    costs: { time: 1, food: 1 },
    addresses: [{ demandId: "neighbor-meal", amount: 1 }],
    traces: { hospitality: 1, mutual_aid: 1 },
    note: "Give the one ready serving to a neighbor who also needs dinner."
  },
  "grocery-run": {
    id: "grocery-run",
    label: "Grocery Run",
    costs: { time: 2, cash: 18, transport: 1, attention: 1 },
    produces: { food: 4 },
    traces: { stewardship: 1 },
    note: "Convert scarce money, transport and time into several future servings."
  },
  "client-call": {
    id: "client-call",
    label: "Return the Client Call",
    costs: { time: 1, attention: 1 },
    addresses: [{ demandId: "client-callback", amount: 1 }],
    traces: { stewardship: 1 },
    note: "Spend one focused time block on the housing-resource callback."
  },
  "check-vehicle": {
    id: "check-vehicle",
    label: "Check the Vehicle",
    costs: { time: 2, cash: 8, transport: 1, attention: 1 },
    addresses: [{ demandId: "vehicle-check", amount: 1 }],
    traces: { stewardship: 1 },
    note: "Spend time, money and the available trip to investigate the unresolved noise."
  },
  "prayer-block": {
    id: "prayer-block",
    label: "Take a Prayer Block",
    costs: { time: 1 },
    produces: { attention: 1 },
    traces: { prayer: 1 },
    note: "Spend real time in prayer; restore attention without changing external facts."
  },
  "rest-block": {
    id: "rest-block",
    label: "Take a Rest Block",
    costs: { time: 2 },
    produces: { attention: 2 },
    addresses: [{ demandId: "rest", amount: 1 }],
    traces: { rest: 1 },
    note: "Use scarce time now to recover attention for later."
  },
  "teach-one-thing": {
    id: "teach-one-thing",
    label: "Teach One Thing",
    costs: { time: 2, attention: 1 },
    traces: { discipleship: 1 },
    note: "Invest in voluntary apprenticeship/formation. This creates no ownership of another person's future labor."
  },
  "reflection-block": {
    id: "reflection-block",
    label: "Reflect on an Earlier Moment",
    costs: { time: 1, attention: 1 },
    note: "Spend present time and attention to revisit an earlier campaign event without altering what happened."
  },
  "worldbuilding-block": {
    id: "worldbuilding-block",
    label: "Build a Possible World",
    costs: { time: 1, attention: 1 },
    note: "Spend present time and attention to explore a hypothetical world; imagination does not create external supply."
  },
  "storyship-block": {
    id: "storyship-block",
    label: "Visit a Storyship Scene",
    costs: { time: 1, attention: 1 },
    note: "Spend present time and attention to enter an artistic source-derived scene; source material does not become history by being visited."
  }
};

export function initialCultureState(): CultureState {
  return {
    stocks: { time: 4, cash: 18, food: 1, transport: 1, attention: 3 },
    demands: [
      { id: "home-dinner", label: "Dinner at home tonight", amount: 1, met: 0, required: true },
      { id: "client-callback", label: "Housing-resource callback", amount: 1, met: 0, required: true },
      { id: "vehicle-check", label: "Vehicle noise investigation", amount: 1, met: 0, required: false },
      { id: "rest", label: "Recovery before exhaustion compounds", amount: 1, met: 0, required: false },
      { id: "neighbor-meal", label: "Neighbor also needs dinner", amount: 1, met: 0, required: false }
    ],
    traces: {
      hospitality: 0,
      stewardship: 0,
      discipleship: 0,
      prayer: 0,
      rest: 0,
      mutual_aid: 0
    },
    history: []
  };
}

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canAfford(stocks: Stocks, costs: Partial<Stocks>): boolean {
  return (Object.entries(costs) as [Resource, number][]).every(([resource, amount]) => stocks[resource] >= amount);
}

export function availableActions(state: CultureState): EconomyAction[] {
  return Object.values(economyActions).filter((action) => canAfford(state.stocks, action.costs));
}

export function remainingDemand(demand: Demand): number {
  return Math.max(0, demand.amount - demand.met);
}

export function demandPressure(state: CultureState): {
  total: number;
  required: number;
  unresolved: { id: string; remaining: number; required: boolean }[];
} {
  const unresolved = state.demands
    .map((d) => ({ id: d.id, remaining: remainingDemand(d), required: d.required }))
    .filter((d) => d.remaining > 0);
  return {
    total: unresolved.reduce((sum, d) => sum + d.remaining, 0),
    required: unresolved.filter((d) => d.required).reduce((sum, d) => sum + d.remaining, 0),
    unresolved
  };
}

export function applyEconomyAction(state: CultureState, actionId: string): CultureState {
  const action = economyActions[actionId];
  if (!action) throw new Error(`Unknown economy action: ${actionId}`);
  if (!canAfford(state.stocks, action.costs)) {
    throw new Error(`Cannot afford ${actionId}`);
  }

  const beforeAvailable = new Set(availableActions(state).map((a) => a.id));
  const next = copy(state);

  for (const [resource, amount] of Object.entries(action.costs) as [Resource, number][]) {
    next.stocks[resource] -= amount;
  }
  for (const [resource, amount] of Object.entries(action.produces ?? {}) as [Resource, number][]) {
    next.stocks[resource] += amount;
  }

  const demandDelta: EconomyReceipt["demandDelta"] = [];
  for (const target of action.addresses ?? []) {
    const demand = next.demands.find((d) => d.id === target.demandId);
    if (!demand) throw new Error(`Unknown demand: ${target.demandId}`);
    const before = demand.met;
    demand.met = Math.min(demand.amount, demand.met + target.amount);
    demandDelta.push({ demandId: demand.id, before, after: demand.met });
  }

  for (const [trace, amount] of Object.entries(action.traces ?? {}) as [CultureTrace, number][]) {
    next.traces[trace] += amount;
  }

  const afterAvailable = new Set(availableActions(next).map((a) => a.id));
  const opportunityCost = [...beforeAvailable]
    .filter((id) => id !== actionId && !afterAvailable.has(id))
    .sort();

  const receipt: EconomyReceipt = {
    id: `economy-r${String(next.history.length + 1).padStart(3, "0")}`,
    actionId,
    consumed: copy(action.costs),
    produced: copy(action.produces ?? {}),
    demandDelta,
    cultureDelta: copy(action.traces ?? {}),
    opportunityCost,
    residualDemands: next.demands.filter((d) => remainingDemand(d) > 0).map((d) => d.id),
    nonClaims: [
      "available action != morally required action",
      "culture trace != human worth",
      "discipleship trace != ownership, obedience, or guaranteed future labor",
      "meeting one demand does not erase competing residual needs"
    ]
  };

  next.history.push(receipt);
  return next;
}

export function cultureUnlocks(state: CultureState): string[] {
  const unlocks: string[] = [];
  if (state.traces.hospitality >= 3) unlocks.push("shared-table-pattern");
  if (state.traces.discipleship >= 3) unlocks.push("apprenticeship-pattern");
  if (state.traces.prayer >= 3) unlocks.push("prayer-rhythm-pattern");
  if (state.traces.rest >= 3) unlocks.push("rest-is-normal-pattern");
  if (state.traces.mutual_aid >= 3) unlocks.push("mutual-aid-pattern");
  if (state.traces.stewardship >= 3) unlocks.push("stewardship-pattern");
  return unlocks;
}

export function summarizeCulture(state: CultureState): string {
  const pressure = demandPressure(state);
  const stocks = Object.entries(state.stocks).map(([k, v]) => `${k}=${v}`).join(" | ");
  const unresolved = pressure.unresolved.map((d) => `${d.id}:${d.remaining}${d.required ? "*" : ""}`).join(", ");
  const traces = Object.entries(state.traces).map(([k, v]) => `${k}=${v}`).join(" | ");
  return [
    `SUPPLY  ${stocks}`,
    `DEMAND  total=${pressure.total} required=${pressure.required} :: ${unresolved}`,
    `CULTURE ${traces}`,
    `OPTIONS ${availableActions(state).map((a) => a.id).join(", ")}`
  ].join("\n");
}
