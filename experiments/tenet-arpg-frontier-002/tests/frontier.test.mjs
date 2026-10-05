
import test from "node:test";
import assert from "node:assert/strict";

import {
  allFrontierNodes,
  applyWarmThreadAction,
  createFrontierState,
  frontierCommands,
  inspectFrontierNode,
  moveFrontierPlayer,
  nearbyFrontierNode,
  returnToFrontier,
  terrainFromGraphFrontierWitness,
  terrainFromMineralWitness,
  terrainFromPlanZSenses,
  useFrontierCommand,
} from "../frontier.mjs";
import {
  graphFrontierWitness,
  mineralWitness,
  planzSenseRun,
  tenetgram,
  warmThreadProposal,
} from "../specimen.mjs";
import { WORLD_NODES } from "../../tenet-arpg-001/game.mjs";

function openFrontier() {
  const state = createFrontierState({
    warmThreadProposal,
    tenetgram,
    planzSenseRun,
    mineralWitness,
    graphFrontierWitness,
  });
  assert.equal(state.ok, true, JSON.stringify(state));
  return state;
}

function placeFrontierAt(state, node) {
  return {
    ...state,
    player: { x: node.x, y: node.y },
  };
}

function placeWarmAt(state, nodeId) {
  const node = WORLD_NODES[nodeId];
  assert.ok(node);
  return {
    ...state,
    warmThread: {
      ...state.warmThread,
      player: { x: node.x, y: node.y },
    },
  };
}

test("PlanZ mutation candidates become ruins, not quests", () => {
  const terrain = terrainFromPlanZSenses(planzSenseRun);
  assert.equal(terrain.ok, true);
  assert.equal(terrain.ruins.length, 2);
  for (const ruin of terrain.ruins) {
    assert.equal(ruin.kind, "ruin");
    assert.deepEqual(ruin.commands, ["INSPECT"]);
    assert.equal(ruin.inspection.authority, "none");
    assert.equal(ruin.inspection.selection, "NONE");
  }
});

test("verified Mineral remains one item with receiver-local affordance divergence", () => {
  const terrain = terrainFromMineralWitness(mineralWitness);
  assert.equal(terrain.ok, true);
  assert.equal(terrain.nodes.length, 2);
  const source = terrain.nodes[0];
  assert.equal(source.inspection.sameSeedDifferentLocalAffordance, true);
  assert.equal(source.inspection.mathAction, "seek-dynamics");
  assert.equal(source.inspection.terrainAction, "terrain-door");
  assert.deepEqual(source.commands, ["INSPECT"]);
});

test("recombinant terrain preserves both parents and creates no canon", () => {
  const terrain = terrainFromGraphFrontierWitness(graphFrontierWitness);
  assert.equal(terrain.ok, true);
  assert.equal(terrain.nodes.length, 4);
  assert.equal(terrain.edges.length, 3);

  const recombinant = terrain.nodes.find(node => node.kind === "recombinant");
  assert.ok(recombinant);
  assert.equal(recombinant.inspection.inheritedAuthority, false);
  assert.equal(recombinant.inspection.canonicalizesParents, false);
  assert.equal(recombinant.inspection.erasesParents, false);
});

test("frontier is walkable and nearby terrain exposes only its own command class", () => {
  let state = openFrontier();
  const living = allFrontierNodes(state).find(node => node.id === "living-quest:warm-thread");
  assert.ok(living);

  state = placeFrontierAt(state, living);
  assert.equal(nearbyFrontierNode(state).id, living.id);
  assert.deepEqual(frontierCommands(state, living.id), ["ENTER"]);

  const ruin = allFrontierNodes(state).find(node => node.kind === "ruin");
  state = placeFrontierAt(state, ruin);
  assert.deepEqual(frontierCommands(state, ruin.id), ["INSPECT"]);

  const inspected = useFrontierCommand(state, ruin.id, "INSPECT");
  assert.equal(inspected.ok, true);
  assert.equal(inspected.inspections.at(-1).selected, false);
  assert.equal(inspected.inspections.at(-1).executed, false);
  assert.equal(inspected.inspections.at(-1).authority, "attention-only");
});

test("moving through frontier does not implicitly inspect or enter anything", () => {
  let state = openFrontier();
  const before = state.inspections.length;
  state = moveFrontierPlayer(state, "up", 6);
  assert.equal(state.ok, true);
  assert.equal(state.inspections.length, before);
  assert.equal(state.mode, "frontier");
});

test("Warm Thread consequence returns as a new frontier door after refusal", () => {
  let state = openFrontier();

  const living = allFrontierNodes(state).find(node => node.id === "living-quest:warm-thread");
  state = placeFrontierAt(state, living);
  state = useFrontierCommand(state, living.id, "ENTER");
  assert.equal(state.mode, "warm-thread");

  state = placeWarmAt(state, "porch");
  state = applyWarmThreadAction(state, "porch", "INSPECT");
  assert.equal(state.ok, true);

  state = placeWarmAt(state, "tree");
  state = applyWarmThreadAction(state, "tree", "ACT");
  state = placeWarmAt(state, "cutter");
  state = applyWarmThreadAction(state, "cutter", "ACT");
  state = placeWarmAt(state, "truck");
  state = applyWarmThreadAction(state, "truck", "REFUSE");

  assert.equal(state.warmThread.terminal, "held-residual");

  state = returnToFrontier(state);
  assert.equal(state.mode, "frontier");

  const future = allFrontierNodes(state).find(node => node.id === "emergent:warm-thread-future");
  assert.ok(future);
  assert.equal(future.kind, "emergent-possibility");
  assert.equal(future.inspection.unresolvedRelation, "haul-firewood");
  assert.equal(future.inspection.authority, "projection-only");
  assert.equal(future.inspection.canonicalTenetGramEmissionOwner, "GHoT");
  assert.deepEqual(future.commands, ["INSPECT"]);

  const livingAfter = allFrontierNodes(state).find(node => node.id === "living-quest:warm-thread");
  assert.match(livingAfter.subtitle, /Held in residue/);
});

test("successful Warm Thread also changes frontier without minting XP", () => {
  let state = openFrontier();
  const living = allFrontierNodes(state).find(node => node.id === "living-quest:warm-thread");
  state = placeFrontierAt(state, living);
  state = useFrontierCommand(state, living.id, "ENTER");

  state = placeWarmAt(state, "porch");
  state = applyWarmThreadAction(state, "porch", "INSPECT");
  for (const nodeId of ["tree", "cutter", "truck", "house"]) {
    state = placeWarmAt(state, nodeId);
    state = applyWarmThreadAction(state, nodeId, "ACT");
    assert.equal(state.ok, true, JSON.stringify(state));
  }

  assert.equal(state.warmThread.terminal, "completed");
  assert.equal(state.warmThread.counters.xp, null);
  assert.equal(state.warmThread.counters.level, null);

  state = returnToFrontier(state);
  const future = allFrontierNodes(state).find(node => node.id === "emergent:warm-thread-future");
  assert.ok(future);
  assert.equal(future.inspection.warmThreadStatus, "completed");

  const livingAfter = allFrontierNodes(state).find(node => node.id === "living-quest:warm-thread");
  assert.match(livingAfter.subtitle, /Completed locally/);
});

test("authority inflation in imported terrain is refused", () => {
  const badPlanZ = structuredClone(planzSenseRun);
  badPlanZ.unaryCandidates[0].selection = "SELECTED";
  assert.equal(terrainFromPlanZSenses(badPlanZ).ok, false);

  const badMineral = structuredClone(mineralWitness);
  badMineral.action_to_work.want_executable = true;
  assert.equal(terrainFromMineralWitness(badMineral).ok, false);

  const badFrontier = structuredClone(graphFrontierWitness);
  badFrontier.recombinant.canonicalizes_parents = true;
  assert.equal(terrainFromGraphFrontierWitness(badFrontier).ok, false);
});
