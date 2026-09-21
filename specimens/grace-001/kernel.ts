export type Deck = "pressure" | "practice" | "relation" | "wild";
export type ThreadState = "queued" | "focused" | "suspended" | "returned" | "closed";

export interface Thread {
  id: string;
  label: string;
  state: ThreadState;
  returnAddress?: string;
  residual?: string;
}

export interface Receipt {
  id: string;
  kind: "proposal" | "act" | "rule_change" | "hold" | "resume" | "world_response";
  cardId?: string;
  threadId?: string;
  claims: string[];
  nonClaims: string[];
}

export interface GraceState {
  clock: string;
  foregroundThreadId: string;
  threads: Thread[];
  meters: {
    body: number;
    attention: number;
    resilience: number;
    connection: number;
  };
  formation: {
    prayer: number;
    hydration: number;
    rest: number;
  };
  external: {
    clientHousing: "open" | "attempted" | "appointment_offered";
    schoolPickup: "pending" | "kept" | "missed";
    vehicleNoise: "unresolved" | "checked";
  };
  projectionsHiddenTurns: number;
  receipts: Receipt[];
}

export interface Card {
  id: string;
  deck: Deck;
  title: string;
  text: string;
}

export const cards: Record<string, Card> = {
  "practice.pray": {
    id: "practice.pray",
    deck: "practice",
    title: "Pray",
    text: "Restore orientation and resilience. This does not change external facts."
  },
  "practice.water": {
    id: "practice.water",
    deck: "practice",
    title: "Drink Water",
    text: "Restore body and attention; strengthen hydration formation."
  },
  "practice.rest": {
    id: "practice.rest",
    deck: "practice",
    title: "Rest",
    text: "Spend time to restore body and resilience."
  },
  "relation.make-call": {
    id: "relation.make-call",
    deck: "relation",
    title: "Make the Call",
    text: "Attempt one bounded call for the currently focused need."
  },
  "relation.ask-help": {
    id: "relation.ask-help",
    deck: "relation",
    title: "Ask for Help",
    text: "Create a help request without claiming acceptance or fulfillment."
  },
  "wild.no-optimize": {
    id: "wild.no-optimize",
    deck: "wild",
    title: "YOU MAY NOT OPTIMIZE THIS",
    text: "Hide numeric projections for the next three turns. The underlying state still exists."
  },
  "wild.wrong-door": {
    id: "wild.wrong-door",
    deck: "wild",
    title: "THE WRONG DOOR OPENS",
    text: "Offer one unresolved thread as a candidate focus. It does not become focused until chosen."
  }
};

export const initialState = (): GraceState => ({
  clock: "Tuesday 07:12",
  foregroundThreadId: "morning",
  threads: [
    { id: "morning", label: "Get Heaven out the door", state: "focused", residual: "school pickup later today" },
    { id: "client-housing", label: "Return housing-resource call", state: "queued", residual: "housing need remains unresolved" },
    { id: "vehicle", label: "Listen to the vehicle noise", state: "queued", residual: "cause unknown" }
  ],
  meters: { body: 5, attention: 4, resilience: 4, connection: 5 },
  formation: { prayer: 2, hydration: 2, rest: 2 },
  external: { clientHousing: "open", schoolPickup: "pending", vehicleNoise: "unresolved" },
  projectionsHiddenTurns: 0,
  receipts: []
});

const clamp = (n: number) => Math.max(0, Math.min(10, n));
const receiptId = (state: GraceState) => `grace-r${String(state.receipts.length + 1).padStart(3, "0")}`;

function copyState(state: GraceState): GraceState {
  return JSON.parse(JSON.stringify(state)) as GraceState;
}

export function chooseFocus(state: GraceState, threadId: string): GraceState {
  const next = copyState(state);
  const target = next.threads.find((t) => t.id === threadId);
  if (!target) throw new Error(`Unknown thread: ${threadId}`);

  const current = next.threads.find((t) => t.id === next.foregroundThreadId);
  if (current && current.id !== threadId && current.state === "focused") {
    current.state = "suspended";
    current.returnAddress = `resume:${current.id}`;
  }

  target.state = "focused";
  next.foregroundThreadId = target.id;
  next.receipts.push({
    id: receiptId(next),
    kind: "resume",
    threadId: target.id,
    claims: [`${target.label} is now the local foreground focus`],
    nonClaims: ["this focus is not declared objectively more important than every other need"]
  });
  return next;
}

export function holdFocus(state: GraceState, reason = "held by player"): GraceState {
  const next = copyState(state);
  const current = next.threads.find((t) => t.id === next.foregroundThreadId);
  if (!current) throw new Error("No foreground thread.");
  current.state = "suspended";
  current.returnAddress = `resume:${current.id}`;
  next.receipts.push({
    id: receiptId(next),
    kind: "hold",
    threadId: current.id,
    claims: [`foreground thread suspended: ${reason}`, `return address preserved: ${current.returnAddress}`],
    nonClaims: ["suspended does not mean complete", "other residual needs are not erased"]
  });
  return next;
}

export type WorldResponseId = "housing-coordinator-callback";
export type WorldResponseDisposition = "answer" | "let-ring" | "hold-tomorrow";

export function applyWorldResponse(
  state: GraceState,
  responseId: WorldResponseId,
  disposition: WorldResponseDisposition,
): GraceState {
  const next = copyState(state);

  if (responseId !== "housing-coordinator-callback") {
    throw new Error(`Unknown world response: ${responseId}`);
  }
  if (next.external.clientHousing !== "attempted") {
    throw new Error("housing coordinator callback requires an earlier attempted call");
  }

  const claims = ["housing coordinator callback arrived"];
  const nonClaims = ["callback arrival != housing secured"];

  if (disposition === "answer") {
    next.external.clientHousing = "appointment_offered";
    const thread = next.threads.find((candidate) => candidate.id === "client-housing");
    if (thread) {
      thread.residual = "appointment offered; eligibility and housing remain unresolved";
    }
    claims.push("appointment was offered");
    nonClaims.push(
      "appointment offered != housing secured",
      "appointment offered != eligibility confirmed",
    );
  } else if (disposition === "let-ring") {
    claims.push("callback was not answered in this moment");
    nonClaims.push(
      "unanswered callback != refused help",
      "unanswered callback != closed need",
    );
  } else if (disposition === "hold-tomorrow") {
    const thread = next.threads.find((candidate) => candidate.id === "client-housing");
    if (thread) thread.returnAddress = "resume:client-housing";
    claims.push("callback response was deliberately deferred until tomorrow");
    nonClaims.push(
      "deferred != complete",
      "deferred != refused help",
    );
  } else {
    throw new Error(`Unknown world response disposition: ${String(disposition)}`);
  }

  next.receipts.push({
    id: receiptId(next),
    kind: "world_response",
    threadId: "client-housing",
    claims,
    nonClaims,
  });

  return next;
}

export function playCard(state: GraceState, cardId: string): GraceState {
  const card = cards[cardId];
  if (!card) throw new Error(`Unknown card: ${cardId}`);
  const next = copyState(state);
  const beforeExternal = JSON.stringify(next.external);
  const thread = next.threads.find((t) => t.id === next.foregroundThreadId);

  switch (cardId) {
    case "practice.pray":
      next.meters.attention = clamp(next.meters.attention + 2);
      next.meters.resilience = clamp(next.meters.resilience + 2);
      next.formation.prayer = clamp(next.formation.prayer + 1);
      break;
    case "practice.water":
      next.meters.body = clamp(next.meters.body + 2);
      next.meters.attention = clamp(next.meters.attention + 1);
      next.formation.hydration = clamp(next.formation.hydration + 1);
      break;
    case "practice.rest":
      next.meters.body = clamp(next.meters.body + 3);
      next.meters.resilience = clamp(next.meters.resilience + 1);
      next.formation.rest = clamp(next.formation.rest + 1);
      break;
    case "relation.make-call":
      if (!thread) throw new Error("No foreground thread.");
      if (thread.id !== "client-housing") {
        throw new Error("Make the Call is only lawful in this specimen when client-housing is foreground.");
      }
      next.external.clientHousing = "attempted";
      break;
    case "relation.ask-help":
      break;
    case "wild.no-optimize":
      next.projectionsHiddenTurns = 3;
      break;
    case "wild.wrong-door":
      break;
  }

  if (card.deck !== "wild" && next.projectionsHiddenTurns > 0) {
    next.projectionsHiddenTurns -= 1;
  }

  const claims: string[] = [`played ${card.title}`];
  const nonClaims: string[] = [];

  if (cardId === "practice.pray") {
    claims.push("attention/resilience projection changed");
    nonClaims.push("prayer did not change external facts", "no desired external outcome is guaranteed");
  }
  if (cardId === "relation.make-call") {
    claims.push("housing-resource call was attempted");
    nonClaims.push("attempt is not appointment", "appointment is not housing secured");
  }
  if (cardId === "relation.ask-help") {
    claims.push("help was requested");
    nonClaims.push("request is not acceptance", "offer is not commitment", "commitment is not fulfillment");
  }
  if (cardId === "wild.no-optimize") {
    claims.push("numeric projections are hidden for three turns");
    nonClaims.push("hidden projection does not erase underlying state", "wildcard does not establish a new external fact");
  }
  if (cardId === "wild.wrong-door") {
    claims.push("an unresolved thread may be offered as a candidate focus");
    nonClaims.push("candidate focus is not automatically selected", "salience is not authority");
  }

  if (card.deck === "practice" && beforeExternal !== JSON.stringify(next.external)) {
    throw new Error("Invariant violation: practice card changed external facts.");
  }

  next.receipts.push({
    id: receiptId(next),
    kind: card.deck === "wild" ? "rule_change" : "act",
    cardId,
    threadId: next.foregroundThreadId,
    claims,
    nonClaims
  });
  return next;
}

const pressureDeck = [
  "The Morning Is Late",
  "Client Needs Housing",
  "Pickup Clock",
  "Vehicle Noise",
  "A Friend Offers Help",
  "Quiet House"
];

export function rollD20(seed: number): number {
  const x = Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0;
  return (x % 20) + 1;
}

export function drawQuestProposal(state: GraceState, seed: number) {
  const roll = rollD20(seed);
  const pressure = pressureDeck[(roll - 1) % pressureDeck.length];
  return {
    kind: "proposal" as const,
    roll,
    pressure,
    respondsTo: state.foregroundThreadId,
    options: ["Spark", "Quest", "Party Arc", "Rest", "Hold", "Leave Open"],
    nonClaims: [
      "the rolled pressure has not occurred merely because it was proposed",
      "the roll does not authorize a crossing",
      "the proposal does not award a Deed, truth, virtue, guilt, or human worth"
    ]
  };
}

export function summarize(state: GraceState): string {
  const thread = state.threads.find((t) => t.id === state.foregroundThreadId);
  const meters = state.projectionsHiddenTurns > 0
    ? "projections: hidden by declared wildcard"
    : `body ${state.meters.body} | attention ${state.meters.attention} | resilience ${state.meters.resilience} | connection ${state.meters.connection}`;

  return [
    `${state.clock}`,
    `OTAAT: ${thread?.label ?? "none"}`,
    meters,
    `client housing: ${state.external.clientHousing}`,
    `school pickup: ${state.external.schoolPickup}`,
    `vehicle: ${state.external.vehicleNoise}`,
    `receipts: ${state.receipts.length}`
  ].join("\n");
}
