import type {PartyMemberId} from "./apertures.ts";

export type ArchaeologySceneId =
  | "porch-lemon-seeds"
  | "portable-witness-road"
  | "door-learns-morning";

export interface ArchaeologyChoice {
  id: string;
  label: string;
  candidateRelations: string[];
}

export interface ArchaeologySceneSeed {
  id: ArchaeologySceneId;
  title: string;
  sourceTitle: string;
  sourceKind: "bandcamp-corpus";
  sourceRef: string;
  status: "seed";
  canonical: false;
  location: string;
  sourceFacts: string[];
  motifs: string[];
  choices: ArchaeologyChoice[];
}

export interface ArchaeologyVisitWitness {
  id: string;
  sceneId: ArchaeologySceneId;
  sceneTitle: string;
  sourceTitle: string;
  sourceKind: "bandcamp-corpus";
  sourceRef: string;
  sourceFacts: string[];
  choiceId: string;
  choiceLabel: string;
  candidateRelations: string[];
  party: PartyMemberId[];
  partyPrompts: string[];
  claims: string[];
  nonClaims: string[];
}

export interface ArchaeologyState {
  visits: ArchaeologyVisitWitness[];
}

export const archaeologyScenes: ArchaeologySceneSeed[] = [
  {
    id: "porch-lemon-seeds",
    title: "After the Feast, Seeds in the Dirt",
    sourceTitle: "Forty-Two Lemon Seeds",
    sourceKind: "bandcamp-corpus",
    sourceRef: "BandCamp (4)(1).txt:998-1057",
    status: "seed",
    canonical: false,
    location: "house.porch",
    sourceFacts: [
      "the source scene takes place during porch cleanup after a gathering",
      "cups, cables, cocoa, a table, weather and lemon seeds share the same aftermath",
      "the source imagines discarded residue becoming planted future growth",
    ],
    motifs: ["lemon seeds", "porch", "cleanup", "cable", "roots", "open E", "future stranger"],
    choices: [
      {
        id: "plant-the-scraps",
        label: "Plant what can become something else",
        candidateRelations: ["scrap -> seed", "cleanup -> inheritance", "porch -> cultivation"],
      },
      {
        id: "leave-a-seat-open",
        label: "Leave one place ready for whoever comes next",
        candidateRelations: ["cleanup -> hospitality", "absence -> reserved welcome", "porch -> invitation"],
      },
      {
        id: "repair-the-cable",
        label: "Repair one broken carrier before leaving",
        candidateRelations: ["broken object -> repair", "repair -> continuity", "static -> carried signal"],
      },
    ],
  },
  {
    id: "portable-witness-road",
    title: "The Witness Seat Leaves the Porch",
    sourceTitle: "Static Knows the Road",
    sourceKind: "bandcamp-corpus",
    sourceRef: "BandCamp (4)(1).txt:1197-1246",
    status: "seed",
    canonical: false,
    location: "road.school",
    sourceFacts: [
      "the source moves from porch space into an open-road setting",
      "the witness seat becomes portable rather than fixed to one physical room",
      "static, fence wire, power lines, a cracked phone and distance become carriers",
    ],
    motifs: ["road", "portable witness", "static", "fence wire", "power line", "cracked phone", "weather"],
    choices: [
      {
        id: "carry-the-witness",
        label: "Carry the witness without carrying the whole room",
        candidateRelations: ["porch -> portable witness", "home -> carrier", "road -> relation"],
      },
      {
        id: "follow-the-static",
        label: "Follow the signal until it becomes uncertain",
        candidateRelations: ["static -> navigation candidate", "road -> signal", "distance -> transformed continuity"],
      },
      {
        id: "turn-back-with-something",
        label: "Return, but keep one thing learned on the road",
        candidateRelations: ["departure -> reversible crossing", "return -> changed attention", "distance -> comparison"],
      },
    ],
  },
  {
    id: "door-learns-morning",
    title: "The Room After the Spark",
    sourceTitle: "The Door Learns the Morning",
    sourceKind: "bandcamp-corpus",
    sourceRef: "BandCamp (4)(1).txt:5342-5396",
    status: "seed",
    canonical: false,
    location: "house.kitchen",
    sourceFacts: [
      "the source begins in the morning after an intense prior night rather than at a climax",
      "a chair, table, sink light, lemon, open E, cords and ordinary street activity remain",
      "the source treats aftermath, rest and portable witness as meaningful continuations",
    ],
    motifs: ["morning", "door", "chair", "table", "lemon", "open E", "aftermath", "rest"],
    choices: [
      {
        id: "sit-before-moving",
        label: "Sit before deciding what morning requires",
        candidateRelations: ["aftermath -> attention", "room -> witness", "rest -> next name"],
      },
      {
        id: "wash-one-pan",
        label: "Do one ordinary thing before naming the day",
        candidateRelations: ["ordinary act -> continuity", "cleanup -> grounding", "morning -> bounded action"],
      },
      {
        id: "open-the-door",
        label: "Let the room meet the street",
        candidateRelations: ["door -> crossing", "inside -> outside", "private witness -> public possibility"],
      },
    ],
  },
];

export function initialArchaeologyState(): ArchaeologyState {
  return {visits: []};
}

function sceneById(sceneId: ArchaeologySceneId): ArchaeologySceneSeed {
  const scene = archaeologyScenes.find((candidate) => candidate.id === sceneId);
  if (!scene) throw new Error(`Unknown archaeology scene: ${sceneId}`);
  return scene;
}

function promptsForParty(scene: ArchaeologySceneSeed, party: PartyMemberId[]): string[] {
  const prompts = [
    `Grace: what present constraint makes ${scene.title.toLowerCase()} matter now?`,
  ];
  if (party.includes("heaven")) {
    prompts.push("Heaven: what part of this place feels playable, safe, strange, or worth remembering?");
  }
  if (party.includes("paula")) {
    prompts.push("Paula: what could become shared practice here without turning care into obligation?");
  }
  return prompts;
}

export function visitArchaeologyScene(
  state: ArchaeologyState,
  input: {
    sceneId: ArchaeologySceneId;
    choiceId: string;
    party: PartyMemberId[];
  },
): ArchaeologyState {
  const scene = sceneById(input.sceneId);
  const choice = scene.choices.find((candidate) => candidate.id === input.choiceId);
  if (!choice) throw new Error(`Unknown archaeology choice ${input.choiceId} for ${input.sceneId}`);

  const next = structuredClone(state);
  next.visits.push({
    id: `archaeology.visit.${String(next.visits.length + 1).padStart(3, "0")}`,
    sceneId: scene.id,
    sceneTitle: scene.title,
    sourceTitle: scene.sourceTitle,
    sourceKind: scene.sourceKind,
    sourceRef: scene.sourceRef,
    sourceFacts: [...scene.sourceFacts],
    choiceId: choice.id,
    choiceLabel: choice.label,
    candidateRelations: [...choice.candidateRelations],
    party: [...input.party],
    partyPrompts: promptsForParty(scene, input.party),
    claims: [
      "the player visited a campaign scene derived from identified artistic source material",
      "the selected choice and candidate relations were retained as a campaign witness",
    ],
    nonClaims: [
      "source lyric is not automatically campaign history",
      "candidate relation is not admitted world fact",
      "scene seed does not prove that the depicted event occurred outside the campaign",
      "party prompt is not authority over the source material",
    ],
  });
  return next;
}
