
import {
  createGameState,
  currentQuest,
  hudSnapshot,
  takeGameAction,
} from "../tenet-arpg-001/game.mjs";

const clone = value => JSON.parse(JSON.stringify(value));
const fail = (code, description) => ({ ok: false, code, description });

export const FRONTIER_FORMAT = "full-measure.tenet-arpg-frontier";
export const FRONTIER_VERSION = 2;

function hashPosition(text, axis) {
  let acc = axis === "x" ? 17 : 31;
  for (const char of String(text)) acc = (acc * 33 + char.charCodeAt(0)) % 9973;
  const min = axis === "x" ? 8 : 10;
  const span = axis === "x" ? 84 : 78;
  return min + (acc % span);
}

function validAuthorityNone(value) {
  return value === null || value === "none";
}

export function terrainFromPlanZSenses(run) {
  if (
    !run ||
    run.schema !== "static-collective/planz-sense-run/v0" ||
    run.authority !== "none" ||
    run.selection !== "NONE" ||
    !Array.isArray(run.frames) ||
    !Array.isArray(run.unaryCandidates)
  ) {
    return fail("invalid-planz-senses", "Expected PLANZ-002 sense-run with authority none and no selection.");
  }

  for (const frame of run.frames) {
    if (
      frame?.schema !== "static-collective/planz-sense-frame/v0" ||
      frame.authority !== "none" ||
      frame.selection !== "NONE"
    ) {
      return fail("planz-authority-inflation", "Sense frames must remain non-authoritative and unselected.");
    }
  }

  const ruins = [];
  for (const candidate of run.unaryCandidates) {
    if (
      candidate?.schema !== "static-collective/planz-mutation-candidate/v0" ||
      candidate.authority !== "none" ||
      candidate.selection !== "NONE"
    ) {
      return fail("planz-candidate-inflation", "Mutation candidates may not become selected terrain actions.");
    }

    const planId = candidate.sourcePlanIds?.[0] ?? "unknown-plan";
    ruins.push({
      id: "ruin:" + candidate.candidateId,
      kind: "ruin",
      source: "planZ",
      title: candidate.chamber + " · " + planId,
      subtitle: "Unfinished history",
      x: hashPosition(candidate.candidateId, "x"),
      y: hashPosition(candidate.candidateId, "y"),
      inspection: {
        planId,
        chamber: candidate.chamber,
        proposal: candidate.proposal,
        residuals: clone(candidate.residuals ?? []),
        authority: "none",
        selection: "NONE",
      },
      commands: ["INSPECT"],
      laws: [
        "SENSE != CHOICE",
        "CANDIDATE != PLAN",
        "RUIN != QUEST",
      ],
    });
  }

  return { ok: true, ruins };
}

export function terrainFromMineralWitness(witness) {
  if (
    !witness ||
    witness.schema !== "gro.mineral-world-seed-001-witness.v0" ||
    witness.source?.dogram_status !== "OK" ||
    witness.locality_divergence?.same_seed !== true ||
    witness.action_to_work?.want_authority !== null ||
    witness.action_to_work?.want_executable !== false ||
    witness.descendant?.verification_status !== "OK" ||
    witness.descendant?.lineage_verified !== true
  ) {
    return fail("invalid-mineral-witness", "Expected verified GrO Mineral World-Seed witness.");
  }

  const seed = witness.source.seed_address;
  const sourceNode = {
    id: "mineral:" + seed,
    kind: "mineral",
    source: "GrO×GHoT",
    title: "Topology mineral",
    subtitle: witness.source.mineral_id,
    x: 17,
    y: 20,
    inspection: {
      seedAddress: seed,
      artifactAddress: witness.source.artifact_address,
      verifierStatus: witness.source.dogram_status,
      sameSeedDifferentLocalAffordance: true,
      mathAction: witness.locality_divergence.math_action,
      terrainAction: witness.locality_divergence.terrain_action,
      meaning: "Verified object; local use remains receiver-owned.",
    },
    commands: ["INSPECT"],
    laws: [
      "MINERAL != CONSEQUENCE",
      "SAME SEED != SAME LOCAL AFFORDANCE",
      "VERIFICATION != ADMISSION",
    ],
  };

  const child = {
    id: "mineral-descendant:" + witness.descendant.seed_address,
    kind: "mineral-descendant",
    source: "GrO×GHoT",
    title: "Mined descendant",
    subtitle: witness.descendant.mineral_id,
    x: 33,
    y: 13,
    inspection: {
      seedAddress: witness.descendant.seed_address,
      capability: witness.descendant.capability,
      artifactAddress: witness.descendant.artifact_address,
      parentCrossingId: witness.descendant.parent_crossing_id,
      ancestorRoadsRequired: witness.descendant.ancestor_roads_required,
      playableInNewLocality: witness.descendant.playable_in_new_locality,
      authorityHere: "none",
    },
    commands: ["INSPECT"],
    laws: [
      "ANCESTRY != AUTHORITY",
      "DESCENDANT ROAD != ANCESTOR ROAD",
      "PLAYABLE THERE != EXECUTABLE HERE",
    ],
  };

  return { ok: true, nodes: [sourceNode, child] };
}

export function terrainFromGraphFrontierWitness(witness) {
  if (
    !witness ||
    witness.schema !== "gro.tenet-012-witness.v0" ||
    witness.graph_frontier?.parent_count < 2 ||
    witness.graph_frontier?.authority !== null ||
    witness.graph_frontier?.semantic_effect !== "none" ||
    witness.recombinant?.inherited_authority !== false ||
    witness.recombinant?.canonicalizes_parents !== false ||
    witness.recombinant?.erases_parents !== false ||
    witness.descendant_v?.lineage_mode !== "graph-frontier-resumable" ||
    witness.descendant_v?.fresh_room_i_admit !== "R3_ADMIT"
  ) {
    return fail("invalid-graph-frontier-witness", "Expected verified GrO TENET-012 graph-frontier witness.");
  }

  const roots = witness.fork?.branch_roots ?? [];
  if (roots.length < 2) {
    return fail("frontier-parents-missing", "Recombinant terrain needs at least two preserved branch roots.");
  }

  const branchA = {
    id: "frontier-parent:" + roots[0],
    kind: "frontier-parent",
    source: "GrO",
    title: "Branch A",
    subtitle: "Preserved parent",
    x: 60,
    y: 18,
    inspection: {
      lineageRoot: roots[0],
      canonical: false,
      erased: false,
    },
    commands: ["INSPECT"],
  };
  const branchB = {
    id: "frontier-parent:" + roots[1],
    kind: "frontier-parent",
    source: "GrO",
    title: "Branch B",
    subtitle: "Preserved parent",
    x: 82,
    y: 18,
    inspection: {
      lineageRoot: roots[1],
      canonical: false,
      erased: false,
    },
    commands: ["INSPECT"],
  };
  const recombinant = {
    id: "recombinant:" + witness.recombinant.seed_address,
    kind: "recombinant",
    source: "GrO",
    title: "Recombinant W",
    subtitle: "Two lawful parents → third invitation",
    x: 71,
    y: 43,
    inspection: {
      seedAddress: witness.recombinant.seed_address,
      parentCrossingIds: clone(witness.recombinant.parent_crossing_ids ?? []),
      inheritedAuthority: false,
      canonicalizesParents: false,
      erasesParents: false,
      playableInRoomH: witness.recombinant.playable_in_room_h,
    },
    commands: ["INSPECT"],
    laws: [
      "FORK != CONFLICT",
      "RECOMBINATION != CANON",
      "PARENT SURVIVES CHILD",
    ],
  };
  const descendant = {
    id: "frontier-descendant:" + witness.descendant_v.seed_address,
    kind: "frontier-descendant",
    source: "GrO",
    title: "Frontier descendant V",
    subtitle: "History compacted, not erased",
    x: 71,
    y: 69,
    inspection: {
      seedAddress: witness.descendant_v.seed_address,
      lineageMode: witness.descendant_v.lineage_mode,
      frontierParentCount: witness.descendant_v.frontier_parent_count,
      graphFrontierBodiesCarried: witness.descendant_v.graph_frontier_bodies_carried,
      lineageCheckpointBodiesCarried: witness.descendant_v.lineage_checkpoint_bodies_carried,
      freshAdmission: witness.descendant_v.fresh_room_i_admit,
      playableInRoomI: witness.descendant_v.playable_in_room_i,
      authorityHere: "none",
    },
    commands: ["INSPECT"],
    laws: [
      "FRONTIER != HISTORY",
      "FRONTIER ROOT != AUTHORITY",
      "GRAPH PRUNING != GRAPH ERASURE",
    ],
  };

  return {
    ok: true,
    nodes: [branchA, branchB, recombinant, descendant],
    edges: [
      [branchA.id, recombinant.id],
      [branchB.id, recombinant.id],
      [recombinant.id, descendant.id],
    ],
  };
}

export function createFrontierState({
  warmThreadProposal,
  tenetgram,
  planzSenseRun,
  mineralWitness,
  graphFrontierWitness,
  fieldId = "neighborhood-a",
} = {}) {
  const warmThread = createGameState({ warmThreadProposal, tenetgram, fieldId });
  if (!warmThread.ok) return warmThread;

  const ruins = terrainFromPlanZSenses(planzSenseRun);
  if (!ruins.ok) return ruins;
  const minerals = terrainFromMineralWitness(mineralWitness);
  if (!minerals.ok) return minerals;
  const graph = terrainFromGraphFrontierWitness(graphFrontierWitness);
  if (!graph.ok) return graph;

  const livingQuestNode = {
    id: "living-quest:warm-thread",
    kind: "living-quest",
    source: "Full Measure×GHoT",
    title: "The Warm Thread",
    subtitle: "Living consequence region",
    x: 45,
    y: 78,
    inspection: {
      quest: currentQuest(warmThread),
      hud: hudSnapshot(warmThread),
    },
    commands: ["ENTER"],
    laws: [
      "QUEST VISIBLE != QUEST REQUIRED",
      "ENTER REGION != ACCEPT FUTURE STEPS",
    ],
  };

  return {
    ok: true,
    format: FRONTIER_FORMAT,
    version: FRONTIER_VERSION,
    mode: "frontier",
    fieldId,
    selectedNodeId: null,
    warmThread,
    nodes: [
      livingQuestNode,
      ...ruins.ruins,
      ...minerals.nodes,
      ...graph.nodes,
    ],
    edges: clone(graph.edges),
    emergentNodes: [],
    inspections: [],
    laws: [
      "PLAYABLE TOPOLOGY != UNIVERSAL AUTHORITY",
      "RUIN != QUEST",
      "VERIFIED MINERAL != LOCAL VALUE",
      "RECOMBINATION != CANON",
      "CONSEQUENCE MAY CHANGE FRONTIER",
      "FRONTIER CHANGE != XP",
    ],
  };
}

export function allFrontierNodes(state) {
  if (!state?.ok || state.format !== FRONTIER_FORMAT) return [];
  return [...state.nodes, ...state.emergentNodes].map(clone);
}

export function inspectFrontierNode(state, nodeId) {
  if (!state?.ok || state.format !== FRONTIER_FORMAT) {
    return fail("not-open", "Open the frontier first.");
  }
  const node = allFrontierNodes(state).find(item => item.id === nodeId);
  if (!node) return fail("node-not-found", "Frontier node not found.");

  const next = clone(state);
  next.selectedNodeId = nodeId;
  next.inspections.push({
    index: next.inspections.length,
    nodeId,
    kind: node.kind,
    authority: "attention-only",
    selected: false,
    executed: false,
  });
  return next;
}

export function enterWarmThreadRegion(state) {
  if (!state?.ok || state.format !== FRONTIER_FORMAT) return fail("not-open", "Open the frontier first.");
  const next = clone(state);
  next.mode = "warm-thread";
  return next;
}

export function applyWarmThreadAction(state, nodeId, command) {
  if (!state?.ok || state.format !== FRONTIER_FORMAT || state.mode !== "warm-thread") {
    return fail("wrong-mode", "Enter the Warm Thread region first.");
  }
  const acted = takeGameAction(state.warmThread, nodeId, command);
  if (!acted.ok) return acted;

  const next = clone(state);
  next.warmThread = acted;
  return next;
}

function futureDoorFromWarmThread(state) {
  const event = [...state.warmThread.history]
    .reverse()
    .find(item => item.type === "future-door-dropped");
  if (!event) return null;

  const existing = state.emergentNodes.find(item => item.id === "emergent:warm-thread-future");
  if (existing) return existing;

  return {
    id: "emergent:warm-thread-future",
    kind: "emergent-possibility",
    source: "Full Measure consequence",
    title: "New future door",
    subtitle: "The frontier changed because something happened.",
    x: 47,
    y: 57,
    inspection: {
      warmThreadStatus: state.warmThread.terminal,
      quest: currentQuest(state.warmThread),
      unresolvedRelation: event.unresolvedRelation ?? null,
      authority: "projection-only",
      canonicalTenetGramEmissionOwner: "GHoT",
    },
    commands: ["INSPECT"],
    laws: [
      "CONSEQUENCE -> POSSIBILITY",
      "GAME PROJECTION != CANONICAL TENETGRAM",
      "FRONTIER CHANGE != XP",
    ],
  };
}

export function returnToFrontier(state) {
  if (!state?.ok || state.format !== FRONTIER_FORMAT) return fail("not-open", "Open the frontier first.");
  const next = clone(state);
  next.mode = "frontier";

  const future = futureDoorFromWarmThread(next);
  if (future && !next.emergentNodes.some(item => item.id === future.id)) {
    next.emergentNodes.push(future);
  }

  const index = next.nodes.findIndex(item => item.id === "living-quest:warm-thread");
  if (index >= 0) {
    next.nodes[index].inspection = {
      quest: currentQuest(next.warmThread),
      hud: hudSnapshot(next.warmThread),
    };
    next.nodes[index].subtitle =
      next.warmThread.terminal === "playing"
        ? "Living consequence region"
        : next.warmThread.terminal === "completed"
          ? "Completed locally · consequence remains"
          : "Held in residue · resumable frontier";
  }

  return next;
}
