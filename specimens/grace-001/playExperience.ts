import {
  applyEconomyAction,
  availableActions,
  economyActions,
  remainingDemand,
  type Stocks,
} from "./culture.ts";
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

function requiredDemandOpen(session: GraceSession, demandId: string): boolean {
  const replay = replaySession(session);
  const demand = replay.culture.demands.find((candidate) => candidate.id === demandId);
  return Boolean(demand && remainingDemand(demand) > 0);
}

function isEconomyActionAvailable(session: GraceSession, actionId: string): boolean {
  const replay = replaySession(session);
  return availableActions(replay.culture).some((action) => action.id === actionId);
}

export function derivePlayScene(session: GraceSession): PlayScene {
  const replay = replaySession(session);
  const focus = replay.story.threads.find(
    (thread) => thread.id === replay.story.foregroundThreadId,
  );
  const requiredOpen = replay.culture.demands.filter(
    (demand) => demand.required && remainingDemand(demand) > 0,
  );

  if (replay.story.projectionsHiddenTurns > 0) {
    return {
      eyebrow: "MADDcl0wn has the meter covers on",
      title: "No numbers for this part",
      body:
        "The underlying world still exists, but the next choice has to be made without turning Tuesday into a dashboard.",
      focus: focus?.label ?? "One thing now",
      resources: {...replay.culture.stocks},
    };
  }

  if (requiredOpen.length === 0) {
    return {
      eyebrow: "Tuesday · a little room opened",
      title: "Nothing required is screaming right now",
      body:
        "The day is not finished. It has simply stopped demanding that every next move be triage.",
      focus: focus?.label ?? "Choose what to carry next",
      resources: {...replay.culture.stocks},
    };
  }

  return {
    eyebrow: "Tuesday · ordinary pressure",
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
  const ids = new Set(["client-call", "grocery-run", "prayer-block", "rest-block"]);
  return session.events.filter(
    (event) => event.type === "economy_action" && ids.has(event.actionId),
  ).length;
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
