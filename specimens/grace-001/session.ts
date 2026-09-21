import {applyEconomyAction, initialCultureState, type CultureState} from "./culture.ts";
import {
  chooseFocus,
  drawQuestProposal,
  initialState,
  playCard,
  type GraceState,
} from "./kernel.ts";
import {
  enterUpperRoomFromDream,
  initialMeaningState,
  makeRememberedWordCard,
  recordRedDoorDream,
  seedDescendantFromEnvelope,
  type MeaningState,
  type PortableCardEnvelope,
} from "./meaning.ts";

export type GraceSessionInputEvent =
  | {type: "focus"; threadId: string}
  | {type: "story_card"; cardId: string}
  | {type: "economy_action"; actionId: string}
  | {type: "dm_roll"; seed: number}
  | {type: "dream_red_door"}
  | {type: "upper_room_return"; dreamId: string; playerNote?: string; anchorId?: string}
  | {type: "remembered_word"; returnId: string}
  | {type: "seed_card_envelope"; envelope: PortableCardEnvelope};

export type GraceSessionEvent = GraceSessionInputEvent & {id: string};

export interface GraceSession {
  schema: "full-measure.grace-session.v1";
  events: GraceSessionEvent[];
}

export interface ReplayedGraceSession {
  story: GraceState;
  culture: CultureState;
  meaning: MeaningState;
  lastProposal: ReturnType<typeof drawQuestProposal> | null;
}

export function emptySession(): GraceSession {
  return {schema: "full-measure.grace-session.v1", events: []};
}

export function appendEvent(
  session: GraceSession,
  event: GraceSessionInputEvent
): GraceSession {
  return {
    ...session,
    events: [
      ...session.events,
      {
        ...event,
        id: `grace-event-${String(session.events.length + 1).padStart(4, "0")}`,
      } as GraceSessionEvent,
    ],
  };
}

export function replaySession(session: GraceSession): ReplayedGraceSession {
  if (session.schema !== "full-measure.grace-session.v1") {
    throw new Error(`Unsupported Grace session schema: ${String((session as {schema?: string}).schema)}`);
  }

  let story = initialState();
  let culture = initialCultureState();
  let meaning = initialMeaningState();
  let lastProposal: ReturnType<typeof drawQuestProposal> | null = null;

  for (const event of session.events) {
    switch (event.type) {
      case "focus":
        story = chooseFocus(story, event.threadId);
        break;
      case "story_card":
        story = playCard(story, event.cardId);
        break;
      case "economy_action":
        culture = applyEconomyAction(culture, event.actionId);
        break;
      case "dm_roll":
        lastProposal = drawQuestProposal(story, event.seed);
        break;
      case "dream_red_door":
        meaning = recordRedDoorDream(meaning);
        break;
      case "upper_room_return":
        meaning = enterUpperRoomFromDream(meaning, event.dreamId, event.playerNote, event.anchorId ?? "be-still");
        break;
      case "remembered_word":
        meaning = makeRememberedWordCard(meaning, event.returnId);
        break;
      case "seed_card_envelope":
        meaning = seedDescendantFromEnvelope(meaning, event.envelope);
        break;
    }
  }

  return {story, culture, meaning, lastProposal};
}

export function encodeSession(session: GraceSession): string {
  return JSON.stringify(session);
}

export function decodeSession(raw: string): GraceSession {
  const parsed = JSON.parse(raw) as GraceSession;
  if (parsed.schema !== "full-measure.grace-session.v1" || !Array.isArray(parsed.events)) {
    throw new Error("Invalid Grace session payload.");
  }
  return parsed;
}

export const GRACE_SESSION_STORAGE_KEY = "full-measure.grace-session.v1";
