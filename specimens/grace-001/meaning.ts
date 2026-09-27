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

export interface UpperRoomAnchor {
  id: string;
  scriptureAnchor: string;
  label: string;
}

export const upperRoomAnchors: UpperRoomAnchor[] = [
  {id: "be-still", scriptureAnchor: "Psalm 46:10", label: "Be still"},
  {id: "come-rest", scriptureAnchor: "Matthew 11:28", label: "Come / rest"},
  {id: "ask-wisdom", scriptureAnchor: "James 1:5", label: "Ask for wisdom"},
];

export interface UpperRoomReturnWitness {
  id: string;
  kind: "upper-room-return";
  enteredFrom: string;
  anchorId: string;
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
  parentCardId?: string;
  lineage: string[];
  claims: string[];
  nonClaims: string[];
}

export interface PortableCardEnvelope {
  schema: "full-measure.portable-card.v1";
  envelopeId: string;
  sourceCard: RememberedWordCard;
  offeredBy: string;
  offeredTo?: string;
  claims: string[];
  nonClaims: string[];
}

export interface MeaningState {
  dreams: DreamWitness[];
  returns: UpperRoomReturnWitness[];
  cards: RememberedWordCard[];
}

export function initialMeaningState(): MeaningState {
  return {dreams: [], returns: [], cards: []};
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
      "an unknown woman says: You keep trying the keys",
    ],
    interpretation: "unresolved",
    possibleRelations: ["door", "access", "persistence", "protection", "relinquishment"],
    claims: ["Grace experienced this dream in the campaign fiction"],
    nonClaims: [
      "the dream is not declared prophetic",
      "the dream does not establish divine instruction",
      "symbolic resemblance does not establish external causation",
    ],
  });
  return next;
}

export function enterUpperRoomFromDream(
  state: MeaningState,
  dreamId = "dream.red-door.001",
  playerNote?: string,
  anchorId = "be-still",
): MeaningState {
  const dream = state.dreams.find((item) => item.id === dreamId);
  if (!dream) throw new Error(`Unknown dream witness: ${dreamId}`);
  const anchor = upperRoomAnchors.find((item) => item.id === anchorId);
  if (!anchor) throw new Error(`Unknown Upper Room anchor: ${anchorId}`);

  const next = structuredClone(state);
  const id = `upper-room.return.${String(next.returns.length + 1).padStart(3, "0")}`;
  next.returns.push({
    id,
    kind: "upper-room-return",
    enteredFrom: dream.id,
    anchorId: anchor.id,
    scriptureAnchor: anchor.scriptureAnchor,
    practice: "prayer",
    durationMinutes: 4,
    playerNote,
    claims: [
      "Grace entered Upper Room from an attributable dream witness",
      `${anchor.scriptureAnchor} was retained as the player-selected textual anchor`,
      "Grace prayed during this return",
    ],
    nonClaims: [
      "the passage is not declared a prediction of later events",
      "the return does not prove an interpretation of the dream",
      "anchor selection does not establish divine instruction",
      "prayer does not guarantee the desired external outcome",
    ],
  });
  return next;
}

export function makeRememberedWordCard(
  state: MeaningState,
  returnId: string,
): MeaningState {
  const source = state.returns.find((item) => item.id === returnId);
  if (!source) throw new Error(`Unknown Upper Room return: ${returnId}`);

  const next = structuredClone(state);
  const existing = next.cards.find((card) => card.sourceReturnId === returnId && !card.parentCardId);
  if (existing) return next;

  const id = `remembered-word.${String(next.cards.length + 1).padStart(3, "0")}`;
  next.cards.push({
    id,
    title: "REMEMBERED WORD",
    sourceReturnId: source.id,
    scriptureAnchor: source.scriptureAnchor,
    generation: 1,
    lineage: [id],
    claims: ["this card descends from an attributable Upper Room return"],
    nonClaims: [
      "carrying the card does not establish one correct interpretation",
      "drawing the card does not make an external event occur",
    ],
  });
  return next;
}

export function makePortableCardEnvelope(
  state: MeaningState,
  cardId: string,
  offeredBy: string,
  offeredTo?: string,
): PortableCardEnvelope {
  const source = state.cards.find((card) => card.id === cardId);
  if (!source) throw new Error(`Unknown card: ${cardId}`);
  return {
    schema: "full-measure.portable-card.v1",
    envelopeId: `card-envelope:${source.id}:${offeredBy}`,
    sourceCard: structuredClone(source),
    offeredBy,
    offeredTo,
    claims: ["this envelope carries an attributable card lineage proposal"],
    nonClaims: [
      "export does not prove physical custody transfer",
      "offer does not compel acceptance",
      "receiving lineage does not transfer the source holder's authority or interpretation",
    ],
  };
}

export function seedDescendantFromEnvelope(
  state: MeaningState,
  envelope: PortableCardEnvelope,
): MeaningState {
  if (envelope.schema !== "full-measure.portable-card.v1") {
    throw new Error("Unsupported portable card envelope.");
  }
  const next = structuredClone(state);
  const duplicate = next.cards.find((card) => card.parentCardId === envelope.sourceCard.id);
  if (duplicate) return next;

  const id = `remembered-word.${String(next.cards.length + 1).padStart(3, "0")}`;
  next.cards.push({
    id,
    title: envelope.sourceCard.title,
    sourceReturnId: envelope.sourceCard.sourceReturnId,
    scriptureAnchor: envelope.sourceCard.scriptureAnchor,
    generation: envelope.sourceCard.generation + 1,
    parentCardId: envelope.sourceCard.id,
    lineage: [...envelope.sourceCard.lineage, id],
    claims: [
      "this descendant was seeded from an attributable portable card envelope",
      `parent card: ${envelope.sourceCard.id}`,
    ],
    nonClaims: [
      "descendant creation does not prove physical transfer of the parent card",
      "the descendant does not inherit the prior holder's interpretation or authority",
      "card lineage does not make an external event occur",
    ],
  });
  return next;
}
