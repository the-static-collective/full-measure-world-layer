export interface DreamWitness {
  id: string;
  kind: "dream";
  title: string;
  experienced: string[];
  interpretation: "unresolved" | "held" | "player_noted";
  possibleRelations: string[];
  claims: string[];
  nonClaims: string[];
}

export interface UpperRoomReturnWitness {
  id: string;
  kind: "upper-room-return";
  enteredFrom: string;
  scriptureAnchor: string;
  practice: "prayer" | "reading" | "stillness";
  durationMinutes: number;
  playerNote?: string;
  claims: string[];
  nonClaims: string[];
}

export interface RememberedWordCard {
  id: string;
  title: string;
  sourceReturnId: string;
  scriptureAnchor: string;
  generation: number;
  claims: string[];
  nonClaims: string[];
}

export interface MeaningState {
  dreams: DreamWitness[];
  returns: UpperRoomReturnWitness[];
  cards: RememberedWordCard[];
}

export function initialMeaningState(): MeaningState {
  return { dreams: [], returns: [], cards: [] };
}

export function recordRedDoorDream(state: MeaningState): MeaningState {
  const next = structuredClone(state);
  if (next.dreams.some((dream) => dream.id === "dream.red-door.001")) return next;
  next.dreams.push({
    id: "dream.red-door.001",
    kind: "dream",
    title: "The Red Door",
    experienced: [
      "a red door in a flooded street",
      "Heaven on the other side, laughing",
      "three keys that do not fit",
      "an unknown woman says: You keep trying the keys"
    ],
    interpretation: "unresolved",
    possibleRelations: ["door", "access", "persistence", "protection", "relinquishment"],
    claims: ["Grace experienced this dream in the campaign fiction"],
    nonClaims: [
      "the dream is not declared prophetic",
      "the dream does not establish divine instruction",
      "symbolic resemblance does not establish external causation"
    ]
  });
  return next;
}

export function enterUpperRoomFromDream(
  state: MeaningState,
  dreamId = "dream.red-door.001",
  playerNote?: string
): MeaningState {
  const dream = state.dreams.find((item) => item.id === dreamId);
  if (!dream) throw new Error(`Unknown dream witness: ${dreamId}`);

  const next = structuredClone(state);
  const id = `upper-room.return.${String(next.returns.length + 1).padStart(3, "0")}`;
  next.returns.push({
    id,
    kind: "upper-room-return",
    enteredFrom: dream.id,
    scriptureAnchor: "Psalm 46:10",
    practice: "prayer",
    durationMinutes: 4,
    playerNote,
    claims: [
      "Grace entered Upper Room from an attributable dream witness",
      "Psalm 46:10 was retained as the textual anchor",
      "Grace prayed during this return"
    ],
    nonClaims: [
      "the passage is not declared a prediction of later events",
      "the return does not prove an interpretation of the dream",
      "prayer does not guarantee the desired external outcome"
    ]
  });
  return next;
}

export function makeRememberedWordCard(
  state: MeaningState,
  returnId: string
): MeaningState {
  const source = state.returns.find((item) => item.id === returnId);
  if (!source) throw new Error(`Unknown Upper Room return: ${returnId}`);

  const next = structuredClone(state);
  const existing = next.cards.find((card) => card.sourceReturnId === returnId);
  if (existing) return next;

  next.cards.push({
    id: `remembered-word.${String(next.cards.length + 1).padStart(3, "0")}`,
    title: "REMEMBERED WORD",
    sourceReturnId: source.id,
    scriptureAnchor: source.scriptureAnchor,
    generation: 1,
    claims: ["this card descends from an attributable Upper Room return"],
    nonClaims: [
      "carrying the card does not establish one correct interpretation",
      "drawing the card does not make an external event occur"
    ]
  });
  return next;
}
