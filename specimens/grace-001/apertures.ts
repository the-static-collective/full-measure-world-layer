export type PartyMemberId = "grace" | "heaven" | "paula";

export interface PartyMember {
  id: PartyMemberId;
  label: string;
  role: string;
  lenses: string[];
  nonClaims: string[];
}

export const partyMembers: Record<PartyMemberId, PartyMember> = {
  grace: {
    id: "grace",
    label: "Grace",
    role: "player-character",
    lenses: ["current responsibility", "scarcity", "faith practice", "building"],
    nonClaims: ["player-character does not mean sole owner of every relationship"],
  },
  heaven: {
    id: "heaven",
    label: "Heaven",
    role: "party-member",
    lenses: ["play", "child perspective", "surprise", "belonging"],
    nonClaims: ["not a morale bonus", "not a player-owned resource"],
  },
  paula: {
    id: "paula",
    label: "Paula",
    role: "party-member",
    lenses: ["witness", "community", "story-building", "mutual aid"],
    nonClaims: [
      "campaign role does not assert biography beyond the declared game seed",
      "party membership does not imply agreement with every player interpretation",
    ],
  },
};

export interface FlashbackWitness {
  id: string;
  sourceEventId: string;
  presentReflection: string;
  partyAtReturn: PartyMemberId[];
  claims: string[];
  nonClaims: string[];
}

export type PossibleWorldPrincipleId =
  | "food-without-proof"
  | "heaven-art-room"
  | "porch-around-house"
  | "community-kitchen"
  | "garden-everywhere";

export interface PossibleWorldPrinciple {
  id: PossibleWorldPrincipleId;
  label: string;
  asks: string;
}

export const possibleWorldPrinciples: PossibleWorldPrinciple[] = [
  {
    id: "food-without-proof",
    label: "Food without proving worth",
    asks: "How does supply remain available when access is not conditioned on deservingness?",
  },
  {
    id: "heaven-art-room",
    label: "A huge art room",
    asks: "What space, materials, cleanup and protected time make creativity ordinary?",
  },
  {
    id: "porch-around-house",
    label: "A porch around the whole house",
    asks: "What would make gathering, rest and arrival structurally easy?",
  },
  {
    id: "community-kitchen",
    label: "A community kitchen that stays open",
    asks: "Who replenishes, cleans, cooks, rests and decides when supply is low?",
  },
  {
    id: "garden-everywhere",
    label: "Garden everywhere",
    asks: "What land, water, labor, seasonality and care does abundance still require?",
  },
];

export interface PossibleWorldReturnWitness {
  id: string;
  worldId: "possible-world.grace-house";
  selectedPrinciples: PossibleWorldPrincipleId[];
  partyAtReturn: PartyMemberId[];
  tensions: string[];
  prompts: string[];
  claims: string[];
  nonClaims: string[];
}

export interface ApertureState {
  party: PartyMemberId[];
  flashbacks: FlashbackWitness[];
  possibleWorldSelection: PossibleWorldPrincipleId[];
  possibleWorldReturns: PossibleWorldReturnWitness[];
}

export function initialApertureState(): ApertureState {
  return {
    party: ["grace", "heaven"],
    flashbacks: [],
    possibleWorldSelection: [],
    possibleWorldReturns: [],
  };
}

export function chooseParty(
  state: ApertureState,
  members: PartyMemberId[],
): ApertureState {
  const normalized = Array.from(new Set(["grace", ...members])) as PartyMemberId[];
  for (const member of normalized) {
    if (!partyMembers[member]) throw new Error(`Unknown party member: ${member}`);
  }

  return {
    ...structuredClone(state),
    party: normalized,
  };
}

export function recordFlashbackReflection(
  state: ApertureState,
  sourceEventId: string,
  presentReflection: string,
): ApertureState {
  if (!sourceEventId) throw new Error("flashback requires a source event id");
  if (!presentReflection.trim()) throw new Error("flashback reflection must be non-empty");

  const next = structuredClone(state);
  next.flashbacks.push({
    id: `flashback.${String(next.flashbacks.length + 1).padStart(3, "0")}`,
    sourceEventId,
    presentReflection: presentReflection.trim(),
    partyAtReturn: [...next.party],
    claims: [
      "the player revisited an attributable earlier campaign event",
      "the present reflection was recorded after the source event",
    ],
    nonClaims: [
      "the source event was not edited",
      "later interpretation does not become an earlier fact",
      "remembering differently does not prove the past occurred differently",
    ],
  });
  return next;
}

export function togglePossibleWorldPrinciple(
  state: ApertureState,
  principleId: PossibleWorldPrincipleId,
): ApertureState {
  if (!possibleWorldPrinciples.some((principle) => principle.id === principleId)) {
    throw new Error(`Unknown possible-world principle: ${principleId}`);
  }

  const next = structuredClone(state);
  const selected = new Set(next.possibleWorldSelection);
  if (selected.has(principleId)) selected.delete(principleId);
  else selected.add(principleId);
  next.possibleWorldSelection = [...selected];
  return next;
}

export function partyPrompts(party: PartyMemberId[]): string[] {
  const prompts: string[] = [];
  if (party.includes("grace")) {
    prompts.push("What can Grace actually sustain here under finite time and attention?");
  }
  if (party.includes("heaven")) {
    prompts.push("What would make belonging, play and safety ordinary for a child here?");
  }
  if (party.includes("paula")) {
    prompts.push("What would let help circulate through community without turning people into resource units?");
  }
  return prompts;
}

export function possibleWorldTensions(
  principles: PossibleWorldPrincipleId[],
): string[] {
  const selected = new Set(principles);
  const tensions: string[] = [];

  if (selected.has("food-without-proof") || selected.has("community-kitchen")) {
    tensions.push("food still requires replenishment, storage, preparation and recovery time");
  }
  if (selected.has("heaven-art-room")) {
    tensions.push("creative abundance still consumes space, materials, cleanup and protected time");
  }
  if (selected.has("porch-around-house")) {
    tensions.push("open gathering space still requires maintenance, boundaries, weather planning and accessibility");
  }
  if (selected.has("garden-everywhere")) {
    tensions.push("gardens still require land, water, seasonality, labor and rest");
  }
  if (
    selected.has("food-without-proof") &&
    selected.has("community-kitchen") &&
    selected.has("garden-everywhere")
  ) {
    tensions.push("abundance systems can reinforce one another, but none abolish supply constraints");
  }
  if (tensions.length === 0) {
    tensions.push("no principles selected; the possible world remains intentionally unformed");
  }

  return tensions;
}

export function returnFromPossibleWorld(state: ApertureState): ApertureState {
  const next = structuredClone(state);
  next.possibleWorldReturns.push({
    id: `possible-world.return.${String(next.possibleWorldReturns.length + 1).padStart(3, "0")}`,
    worldId: "possible-world.grace-house",
    selectedPrinciples: [...next.possibleWorldSelection],
    partyAtReturn: [...next.party],
    tensions: possibleWorldTensions(next.possibleWorldSelection),
    prompts: partyPrompts(next.party),
    claims: [
      "the player explored a declared hypothetical world",
      "selected principles and encountered tensions were retained as design witnesses",
    ],
    nonClaims: [
      "the possible world is not present-world fact",
      "utopian desirability is not treated as feasibility proof",
      "returning from the possible world does not rewrite past events",
      "a party lens is not an authority ranking",
    ],
  });
  return next;
}
