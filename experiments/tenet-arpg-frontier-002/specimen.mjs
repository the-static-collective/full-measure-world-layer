
import {
  tenetgram,
  warmThreadProposal,
} from "../tenet-arpg-001/specimen.mjs";

export { tenetgram, warmThreadProposal };

export const planzSenseRun = {
  schema: "static-collective/planz-sense-run/v0",
  input: "registry/seed-plan-records.jsonl",
  recordCount: 2,
  frames: [
    {
      schema: "static-collective/planz-sense-frame/v0",
      planId: "PLZ-OLD-ROOM-001",
      signals: {
        gap: { present: true, reasons: ["one unfinished threshold remains"] },
        stranding: { present: true, reasons: ["PARTIAL"] },
        lineage: { present: false, reasons: [] },
        ambiguity: { present: false, reasons: [] },
        recoverability: { present: true, reasons: ["recoveryMode:RECOMPOSE"] },
        compositionPressure: { present: false, reasons: [] },
      },
      basisRefs: ["specimen:old-room"],
      authority: "none",
      selection: "NONE",
    },
    {
      schema: "static-collective/planz-sense-frame/v0",
      planId: "PLZ-OLD-BRIDGE-001",
      signals: {
        gap: { present: true, reasons: ["bridge was designed but never crossed"] },
        stranding: { present: false, reasons: [] },
        lineage: { present: true, reasons: ["descendant:bridge-child"] },
        ambiguity: { present: false, reasons: [] },
        recoverability: { present: true, reasons: ["recoveryMode:HOLD"] },
        compositionPressure: { present: false, reasons: [] },
      },
      basisRefs: ["specimen:old-bridge"],
      authority: "none",
      selection: "NONE",
    },
  ],
  unaryCandidates: [
    {
      schema: "static-collective/planz-mutation-candidate/v0",
      candidateId: "mut-old-room",
      chamber: "GRAFT",
      sourcePlanIds: ["PLZ-OLD-ROOM-001"],
      hinge: null,
      proposal: "Extract the surviving organ; do not resurrect obsolete ancestry wholesale.",
      residuals: ["candidate-not-selected", "present authority must be re-checked before consequence"],
      authority: "none",
      selection: "NONE",
    },
    {
      schema: "static-collective/planz-mutation-candidate/v0",
      candidateId: "mut-old-bridge",
      chamber: "HOLD",
      sourcePlanIds: ["PLZ-OLD-BRIDGE-001"],
      hinge: null,
      proposal: "Preserve the bridge without execution until its hold condition changes.",
      residuals: ["candidate-not-selected", "present authority must be re-checked before consequence"],
      authority: "none",
      selection: "NONE",
    },
  ],
  authority: "none",
  selection: "NONE",
};

export const mineralWitness = {
  schema: "gro.mineral-world-seed-001-witness.v0",
  source: {
    mineral_id: "math.topology.mapping-torus/v0",
    capability: "ghot.ice-cube/v0",
    seed_address: "sha256:" + "1".repeat(64),
    artifact_address: "sha256:" + "2".repeat(64),
    dogram_status: "OK",
    replaceable_roads: 2,
    original_roads_alive_at_end: 0,
  },
  locality_divergence: {
    math_trace_id: "trace:math",
    terrain_trace_id: "trace:terrain",
    same_seed: true,
    math_action: "seek-dynamics",
    terrain_action: "terrain-door",
  },
  action_to_work: {
    occurrence_receipt: "receipt:action",
    want_id: "gro-mineral-want-v0:specimen",
    want_authority: null,
    want_executable: false,
    requested_capability: "mineral.parameter-sweep/v0",
  },
  descendant: {
    mineral_id: "math.dynamics.parameter-sweep/v0",
    capability: "mineral.parameter-sweep/v0",
    seed_address: "sha256:" + "3".repeat(64),
    artifact_address: "sha256:" + "4".repeat(64),
    verification_status: "OK",
    parent_crossing_id: "crossing:mineral-parent",
    lineage_verified: true,
    ancestor_roads_required: false,
    playable_in_new_locality: true,
  },
};

export const graphFrontierWitness = {
  schema: "gro.tenet-012-witness.v0",
  graph_frontier: {
    checkpoint_id: "checkpoint:w",
    graph_root: "gro-graph-root-v0:specimen",
    parent_frontier_root: "gro-frontier-root-v0:specimen",
    parent_count: 2,
    parent_checkpoint_ids: ["checkpoint:a", "checkpoint:b"],
    parent_lineage_roots: ["lineage:a", "lineage:b"],
    contains_parent_checkpoint_bodies: false,
    authority: null,
    semantic_effect: "none",
  },
  descendant_v: {
    seed_address: "sha256:" + "5".repeat(64),
    crossing_id: "crossing:v",
    lineage_mode: "graph-frontier-resumable",
    frontier_parent_count: 2,
    old_branch_checkpoint_stores_alive: false,
    graph_frontier_bodies_carried: 1,
    lineage_checkpoint_bodies_carried: 0,
    fresh_room_i_admit: "R3_ADMIT",
    playable_in_room_i: true,
  },
  recombinant: {
    seed_address: "sha256:" + "6".repeat(64),
    crossing_id: "crossing:w",
    parent_crossing_ids: ["crossing:a", "crossing:b"],
    parent_checkpoint_ids: ["checkpoint:a", "checkpoint:b"],
    action_receipt_id: "receipt:w",
    inherited_authority: false,
    canonicalizes_parents: false,
    erases_parents: false,
    fresh_room_h_admit: "R3_ADMIT",
    playable_in_room_h: true,
  },
  fork: {
    fork_id: "fork:y",
    conflict_before_local_rule: false,
    canonical_branch: null,
    branch_roots: ["lineage:a", "lineage:b"],
  },
};
