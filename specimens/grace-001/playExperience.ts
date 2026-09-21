import {
  applyEconomyAction,
  availableActions,
  economyActions,
  remainingDemand,
  type Stocks,
} from "./culture.ts";
import type {
  WorldResponseDisposition,
  WorldResponseId,
} from "./kernel.ts";
import {
  appendEvent,
  replaySession,
  type GraceSession,
  type GraceSessionInputEvent,
} from "./session.ts";

export type PlayActionId =
  | "return-client-call"
  | "grocery-run"
  | "pray"
  | "rest";

export type DayPhase = "morning" | "midday" | "evening" | "night";

export interface PlayScene {
  eyebrow: string;
  title: string;
  body: string;
  focus: string;
  resources: {
    time: number;
    cash: number;
    food: number;
    transport: number;
    attention: number;
  };
}

export interface PlayAction {
  id: PlayActionId;
  label: string;
  shortLabel: string;
  tone: "relation" | "supply" | "practice";
  economyActionId: string;
  events: GraceSessionInputEvent[];
}

export interface PlayActionPreview {
  actionId: PlayActionId;
  label: string;
  cost: Partial<Stocks>;
  foreclosed: string[];
  residualDemands: string[];
  authority: "none";
  nonClaims: string[];
}

export interface ConsequenceBeat {
  actionId: PlayActionId;
  title: string;
  lines: string[];
  spent: Partial<Stocks>;
  foreclosed: string[];
  residualDemands: string[];
}

export interface ResolvedPlayAction {
  session: GraceSession;
  preview: PlayActionPreview;
  beat: ConsequenceBeat;
}

export interface EncounterOffer {
  id: "red-door-after-rest" | "no-optimize-rupture";
  kind: "maddjack" | "maddclown";
  title: string;
  body: string;
  events: GraceSessionInputEvent[];
  acceptLabel: string;
  dismissLabel: string;
  nonClaims: string[];
}

export interface WorldResponseOption {
  id: WorldResponseDisposition;
  label: string;
  note: string;
}

export interface WorldResponseOffer {
  id: WorldResponseId;
  kind: "world";
  title: string;
  body: string;
  options: WorldResponseOption[];
  nonClaims: string[];
}

export interface DayAttendance {
  title: "THE HOUSE TAKES ATTENDANCE";
  completed: string[];
  open: string[];
  practiced: string[];
  changed: string[];
  strange: string[];
  nonClaims: string[];
}

const actionCatalog: Record<PlayActionId, PlayAction> = {
  "return-client-call": {
    id: "return-client-call",
    label: "Return the housing call",
    shortLabel: "Make the call",
    tone: "relation",
    economyActionId: "client-call",
    events: [
      {type: "focus", threadId: "client-housing"},
      {type: "story_card", cardId: "relation.make-call"},
      {type: "economy_action", actionId: "client-call"},
    ],
  },
  "grocery-run": {
    id: "grocery-run",
    label: "Use the trip for groceries",
    shortLabel: "Grocery run",
    tone: "supply",
    economyActionId: "grocery-run",
    events: [{type: "economy_action", actionId: "grocery-run"}],
  },
  pray: {
    id: "pray",
    label: "Take a prayer block",
    shortLabel: "Pray",
    tone: "practice",
    economyActionId: "prayer-block",
    events: [
      {type: "story_card", cardId: "practice.pray"},
      {type: "economy_action", actionId: "prayer-block"},
    ],
  },
  rest: {
    id: "rest",
    label: "Take a real rest block",
    shortLabel: "Rest",
    tone: "practice",
    economyActionId: "rest-block",
    events: [
      {type: "story_card", cardId: "practice.rest"},
      {type: "economy_action", actionId: "rest-block"},
    ],
  },
};

const playOrder: PlayActionId[] = [
  "return-client-call",
  "grocery-run",
  "pray",
  "rest",
];

const ordinaryEconomyActionIds = new Set([
  "client-call",
  "grocery-run",
  "prayer-block",
  "rest-block",
]);

function requiredDemandOpen(session: GraceSession, demandId: string): boolean {
  const replay = replaySession(session);
  const demand = replay.culture.demands.find((candidate) => candidate.id === demandId);
  return Boolean(demand && remainingDemand(demand) > 0);
}

function isEconomyActionAvailable(session: GraceSession, actionId: string): boolean {
  const replay = replaySession(session);
  return availableActions(replay.culture).some((action) => action.id === actionId);
}

export function deriveDayPhase(session: GraceSession): DayPhase {
  const time = replaySession(session).culture.stocks.time;
  if (time >= 4) return "morning";
  if (time >= 2) return "midday";
  if (time >= 1) return "evening";
  return "night";
}

export function derivePlayScene(session: GraceSession): PlayScene {
  const replay = replaySession(session);
  const phase = deriveDayPhase(session);
  const focus = replay.story.threads.find(
    (thread) => thread.id === replay.story.foregroundThreadId,
  );
  const requiredOpen = replay.culture.demands.filter(
    (demand) => demand.required && remainingDemand(demand) > 0,
  );
  const groceriesMadeItHome = replay.culture.history.some(
    (receipt) => receipt.actionId === "grocery-run",
  );

  if (replay.story.projectionsHiddenTurns > 0) {
    return {
      eyebrow: `${phase} · MADDcl0wn has the meter covers on`,
      title: "No numbers for this part",
      body:
        "The underlying world still exists, but the next choice has to be made without turning Tuesday into a dashboard.",
      focus: focus?.label ?? "One thing now",
      resources: {...replay.culture.stocks},
    };
  }

  if ((phase === "evening" || phase === "night") && groceriesMadeItHome) {
    return {
      eyebrow: `Tuesday · ${phase}`,
      title: "Groceries made it home",
      body:
        "There is more food in the house now. The vehicle noise is still unresolved, and whatever was not carried earlier is arriving at the edge of evening.",
      focus: focus?.label ?? "Choose what still gets carried",
      resources: {...replay.culture.stocks},
    };
  }

  if (requiredOpen.length === 0) {
    return {
      eyebrow: `Tuesday · ${phase} · a little room opened`,
      title: "Nothing required is screaming right now",
      body:
        "The day is not finished. It has simply stopped demanding that every next move be triage.",
      focus: focus?.label ?? "Choose what to carry next",
      resources: {...replay.culture.stocks},
    };
  }

  if (phase === "midday") {
    return {
      eyebrow: "Tuesday · midday",
      title:
        replay.story.external.clientHousing === "attempted"
          ? "The waiting part"
          : "Midday is already smaller",
      body:
        replay.story.external.clientHousing === "attempted"
          ? "The housing call is out in the world now. It has not answered yet. Other needs keep spending the same finite day."
          : "Morning used some of the day. The callback, food, recovery, and the car are still competing for what remains.",
      focus: focus?.label ?? "One thing now",
      resources: {...replay.culture.stocks},
    };
  }

  if (phase === "evening") {
    return {
      eyebrow: "Tuesday · evening",
      title: "Evening narrows the board",
      body:
        "The day has fewer branches now. Anything still open is becoming something Grace may have to carry rather than finish.",
      focus: focus?.label ?? "What still gets carried?",
      resources: {...replay.culture.stocks},
    };
  }

  if (phase === "night") {
    return {
      eyebrow: "Tuesday · night",
      title: "Tuesday is out of spendable time",
      body:
        "Open needs still exist. The difference is that tonight no longer has another ordinary time block to give them.",
      focus: focus?.label ?? "Carry the remainder honestly",
      resources: {...replay.culture.stocks},
    };
  }

  return {
    eyebrow: "Tuesday · morning · ordinary pressure",
    title: "Morning squeeze",
    body:
      "Heaven needs the morning to keep moving, while the housing callback and the rest of the day are already asking for their share.",
    focus: focus?.label ?? "Get Heaven out the door",
    resources: {...replay.culture.stocks},
  };
}

export function derivePlayActions(session: GraceSession): PlayAction[] {
  return playOrder
    .filter((id) => {
      const action = actionCatalog[id];
      if (!isEconomyActionAvailable(session, action.economyActionId)) return false;
      if (id === "return-client-call" && !requiredDemandOpen(session, "client-callback")) {
        return false;
      }
      return true;
    })
    .slice(0, 4)
    .map((id) => structuredClone(actionCatalog[id]));
}

export function previewPlayAction(
  session: GraceSession,
  actionId: PlayActionId,
): PlayActionPreview {
  const action = actionCatalog[actionId];
  if (!action) throw new Error(`Unknown play action: ${actionId}`);

  const before = replaySession(session).culture;
  if (!availableActions(before).some((candidate) => candidate.id === action.economyActionId)) {
    throw new Error(`Play action is not currently affordable: ${actionId}`);
  }

  const after = applyEconomyAction(before, action.economyActionId);
  const receipt = after.history.at(-1);
  if (!receipt) throw new Error(`Economy action emitted no receipt: ${action.economyActionId}`);

  return {
    actionId,
    label: action.label,
    cost: structuredClone(economyActions[action.economyActionId].costs),
    foreclosed: [...receipt.opportunityCost],
    residualDemands: [...receipt.residualDemands],
    authority: "none",
    nonClaims: [
      "foreclosed action != morally worse or better action",
      "available action != required action",
      "cost preview != prediction of every downstream consequence",
    ],
  };
}

function beatFor(
  actionId: PlayActionId,
  preview: PlayActionPreview,
): ConsequenceBeat {
  const common = {
    actionId,
    spent: structuredClone(preview.cost),
    foreclosed: [...preview.foreclosed],
    residualDemands: [...preview.residualDemands],
  };

  switch (actionId) {
    case "return-client-call":
      return {
        ...common,
        title: "Call attempted",
        lines: [
          "The housing-resource callback was attempted.",
          "The broader housing need is still open.",
          "Dinner at home and the rest of Tuesday are still open.",
        ],
      };
    case "grocery-run":
      return {
        ...common,
        title: "The trip becomes food",
        lines: [
          "Cash, transport, time, and attention became four additional food servings.",
          "The vehicle question is still unresolved.",
          "Tuesday has fewer branches now, but more food.",
        ],
      };
    case "pray":
      return {
        ...common,
        title: "A little room inside the pressure",
        lines: [
          "Prayer changed attention and resilience in the declared game state.",
          "No external problem was silently solved.",
          "The day resumes from the same world with a different posture.",
        ],
      };
    case "rest":
      return {
        ...common,
        title: "Grace actually rests",
        lines: [
          "Two scarce time blocks were given to recovery.",
          "Attention returned; the unfinished demands did not disappear.",
          "Something at the edge of sleep may now be close enough to notice.",
        ],
      };
  }
}

export function resolvePlayAction(
  session: GraceSession,
  actionId: PlayActionId,
): ResolvedPlayAction {
  const action = actionCatalog[actionId];
  if (!action) throw new Error(`Unknown play action: ${actionId}`);
  const preview = previewPlayAction(session, actionId);

  let next = session;
  for (const event of action.events) {
    next = appendEvent(next, event);
  }

  replaySession(next);

  return {
    session: next,
    preview,
    beat: beatFor(actionId, preview),
  };
}

function completedPlayTurns(session: GraceSession): number {
  return session.events.filter(
    (event) => event.type === "economy_action" && ordinaryEconomyActionIds.has(event.actionId),
  ).length;
}

export function deriveWorldResponseOffer(
  session: GraceSession,
): WorldResponseOffer | null {
  const replay = replaySession(session);
  if (replay.story.external.clientHousing !== "attempted") return null;

  const alreadyHandled = session.events.some(
    (event) =>
      event.type === "world_response" &&
      event.responseId === "housing-coordinator-callback",
  );
  if (alreadyHandled) return null;

  const callIndex = session.events.findIndex(
    (event) => event.type === "economy_action" && event.actionId === "client-call",
  );
  if (callIndex < 0) return null;

  const laterTurns = session.events
    .slice(callIndex + 1)
    .filter(
      (event) =>
        event.type === "economy_action" &&
        ordinaryEconomyActionIds.has(event.actionId),
    ).length;

  if (laterTurns < 2) return null;

  return {
    id: "housing-coordinator-callback",
    kind: "world",
    title: "The phone rings back",
    body:
      "The housing coordinator is returning Grace's earlier call. The original attempt did not guarantee this; now the response has actually arrived.",
    options: [
      {
        id: "answer",
        label: "Answer",
        note: "Take the call now. An appointment may be offered; housing is not thereby secured.",
      },
      {
        id: "let-ring",
        label: "Let it ring",
        note: "The callback still happened. Grace does not answer in this moment.",
      },
      {
        id: "hold-tomorrow",
        label: "Hold it for tomorrow",
        note: "Preserve a return address instead of pretending tonight can carry everything.",
      },
    ],
    nonClaims: [
      "callback arrival != housing secured",
      "world response != reward for a morally correct prior move",
    ],
  };
}

export function resolveWorldResponse(
  session: GraceSession,
  responseId: WorldResponseId,
  disposition: WorldResponseDisposition,
): GraceSession {
  const offer = deriveWorldResponseOffer(session);
  if (!offer || offer.id !== responseId) {
    throw new Error(`World response is not currently available: ${responseId}`);
  }
  if (!offer.options.some((option) => option.id === disposition)) {
    throw new Error(`Unknown world response disposition: ${disposition}`);
  }

  const next = appendEvent(session, {
    type: "world_response",
    responseId,
    disposition,
  });
  replaySession(next);
  return next;
}

export function deriveDayAttendance(session: GraceSession): DayAttendance | null {
  const replay = replaySession(session);
  if (replay.culture.stocks.time > 0) return null;

  const completed = replay.culture.demands
    .filter((demand) => remainingDemand(demand) === 0)
    .map((demand) => demand.label);
  const open = replay.culture.demands
    .filter((demand) => remainingDemand(demand) > 0)
    .map((demand) => demand.label);
  const practiced = Object.entries(replay.culture.traces)
    .filter(([, amount]) => amount > 0)
    .map(([trace]) => trace);
  const changed: string[] = [];
  const strange: string[] = [];

  if (replay.story.external.clientHousing === "appointment_offered") {
    changed.push("A housing appointment was offered; eligibility and housing remain unresolved.");
  } else if (replay.story.external.clientHousing === "attempted") {
    changed.push("The housing callback attempt is on record; the broader need remains open.");
  }
  if (replay.culture.stocks.food > 1) {
    changed.push(`Food supply ended at ${replay.culture.stocks.food} servings.`);
  }
  if (replay.meaning.dreams.length > 0) {
    strange.push("The Red Door was remembered.");
  }
  if (replay.meaning.cards.length > 0) {
    strange.push(`${replay.meaning.cards.length} remembered card(s) now carry lineage.`);
  }
  if (replay.archaeology.visits.length > 0) {
    strange.push(`${replay.archaeology.visits.length} Storyship archaeology visit(s) entered today's witness.`);
  }

  return {
    title: "THE HOUSE TAKES ATTENDANCE",
    completed,
    open,
    practiced,
    changed,
    strange,
    nonClaims: [
      "end of day != resolution of every open need",
      "unfinished != failed",
      "completed local scope != optimal day",
      "culture trace != human worth",
    ],
  };
}

export function deriveEncounterOffer(session: GraceSession): EncounterOffer | null {
  const replay = replaySession(session);
  const latestEconomy = [...session.events]
    .reverse()
    .find((event) => event.type === "economy_action");

  if (
    latestEconomy?.type === "economy_action" &&
    latestEconomy.actionId === "rest-block" &&
    replay.meaning.dreams.length === 0
  ) {
    return {
      id: "red-door-after-rest",
      kind: "maddjack",
      title: "Something followed Grace to the edge of sleep",
      body:
        "A red door, floodwater, three useless keys, Heaven laughing on the other side. The game can retain the dream without deciding what it means.",
      events: [{type: "dream_red_door"}],
      acceptLabel: "Remember the dream",
      dismissLabel: "Let it pass",
      nonClaims: [
        "encounter offer != prophecy",
        "dream witness != divine instruction",
      ],
    };
  }

  const alreadyRuptured = session.events.some(
    (event) =>
      event.type === "story_card" &&
      event.cardId === "wild.no-optimize",
  );

  if (completedPlayTurns(session) >= 3 && !alreadyRuptured) {
    return {
      id: "no-optimize-rupture",
      kind: "maddclown",
      title: "The room refuses to become a spreadsheet",
      body:
        "For three turns, the numbers can disappear. The state remains underneath; only the optimization surface goes dark.",
      events: [{type: "story_card", cardId: "wild.no-optimize"}],
      acceptLabel: "LET THE CLOWN HAVE IT",
      dismissLabel: "Not this time",
      nonClaims: [
        "wild presentation change != external occurrence",
        "hidden projection != erased state",
      ],
    };
  }

  return null;
}
