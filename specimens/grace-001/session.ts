import {
  initialArchaeologyState,
  visitArchaeologyScene,
  type ArchaeologySceneId,
  type ArchaeologyState,
} from "./archaeology.ts";
import {
  chooseParty,
  initialApertureState,
  recordFlashbackReflection,
  returnFromPossibleWorld,
  togglePossibleWorldPrinciple,
  type ApertureState,
  type PartyMemberId,
  type PossibleWorldPrincipleId,
} from "./apertures.ts";
import {applyEconomyAction, initialCultureState, type CultureState} from "./culture.ts";
import {
  applyWorldResponse,
  chooseFocus,
  drawQuestProposal,
  initialState,
  playCard,
  type GraceState,
  type WorldResponseDisposition,
  type WorldResponseId,
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
  | {type: "seed_card_envelope"; envelope: PortableCardEnvelope}
  | {type: "choose_party"; members: PartyMemberId[]}
  | {type: "flashback_reflection"; sourceEventId: string; presentReflection: string}
  | {type: "possible_world_toggle"; principleId: PossibleWorldPrincipleId}
  | {type: "possible_world_return"}
  | {type: "archaeology_visit"; sceneId: ArchaeologySceneId; choiceId: string}
  | {type: "world_response"; responseId: WorldResponseId; disposition: WorldResponseDisposition};

export type GraceSessionEvent = GraceSessionInputEvent & {id: string};

const delayedWorldTurnActions = new Set([
  "client-call",
  "grocery-run",
  "prayer-block",
  "rest-block",
]);

export interface GraceSession {
  schema: "full-measure.grace-session.v1";
  events: GraceSessionEvent[];
}

export interface ReplayedGraceSession {
  story: GraceState;
  culture: CultureState;
  meaning: MeaningState;
  apertures: ApertureState;
  archaeology: ArchaeologyState;
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
  let apertures = initialApertureState();
  let archaeology = initialArchaeologyState();
  let lastProposal: ReturnType<typeof drawQuestProposal> | null = null;

  for (let eventIndex = 0; eventIndex < session.events.length; eventIndex += 1) {
    const event = session.events[eventIndex];
    const previousEvent = session.events[eventIndex - 1];

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
      case "choose_party":
        apertures = chooseParty(apertures, event.members);
        break;
      case "flashback_reflection": {
        const sourceExistsEarlier = session.events
          .slice(0, eventIndex)
          .some((candidate) => candidate.id === event.sourceEventId);
        if (!sourceExistsEarlier) {
          throw new Error(`Unknown earlier flashback source event: ${event.sourceEventId}`);
        }
        if (
          !previousEvent ||
          previousEvent.type !== "economy_action" ||
          previousEvent.actionId !== "reflection-block"
        ) {
          throw new Error("flashback reflection requires an immediately preceding reflection-block");
        }
        apertures = recordFlashbackReflection(
          apertures,
          event.sourceEventId,
          event.presentReflection,
        );
        break;
      }
      case "possible_world_toggle":
        apertures = togglePossibleWorldPrinciple(apertures, event.principleId);
        break;
      case "possible_world_return":
        if (
          !previousEvent ||
          previousEvent.type !== "economy_action" ||
          previousEvent.actionId !== "worldbuilding-block"
        ) {
          throw new Error("possible-world return requires an immediately preceding worldbuilding-block");
        }
        apertures = returnFromPossibleWorld(apertures);
        break;
      case "archaeology_visit":
        if (
          !previousEvent ||
          previousEvent.type !== "economy_action" ||
          previousEvent.actionId !== "storyship-block"
        ) {
          throw new Error("archaeology visit requires an immediately preceding storyship-block");
        }
        archaeology = visitArchaeologyScene(archaeology, {
          sceneId: event.sceneId,
          choiceId: event.choiceId,
          party: apertures.party,
        });
        break;
      case "world_response": {
        const priorEvents = session.events.slice(0, eventIndex);
        const duplicate = priorEvents.some(
          (candidate) =>
            candidate.type === "world_response" &&
            candidate.responseId === event.responseId,
        );
        if (duplicate) {
          throw new Error(`duplicate world response: ${event.responseId}`);
        }

        if (event.responseId === "housing-coordinator-callback") {
          const callIndex = priorEvents.findIndex(
            (candidate) =>
              candidate.type === "economy_action" &&
              candidate.actionId === "client-call",
          );
          if (callIndex < 0) {
            throw new Error("housing coordinator callback requires an earlier attempted call");
          }

          const laterTurns = priorEvents
            .slice(callIndex + 1)
            .filter(
              (candidate) =>
                candidate.type === "economy_action" &&
                delayedWorldTurnActions.has(candidate.actionId),
            ).length;
          if (laterTurns < 2) {
            throw new Error("housing coordinator callback requires two later ordinary turns");
          }
        }

        story = applyWorldResponse(story, event.responseId, event.disposition);
        break;
      }
    }
  }

  return {story, culture, meaning, apertures, archaeology, lastProposal};
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
