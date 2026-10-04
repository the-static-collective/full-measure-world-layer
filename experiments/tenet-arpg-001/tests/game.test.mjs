
import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import {
  WORLD_NODES,
  availableCommands,
  createGameState,
  currentQuest,
  hudSnapshot,
  takeGameAction,
  visibleNodes,
} from "../game.mjs";
import { tenetgram, warmThreadProposal } from "../specimen.mjs";

function openLocal() {
  const state = createGameState({
    warmThreadProposal,
    tenetgram,
    fieldId: "neighborhood-a",
  });
  assert.equal(state.ok, true, JSON.stringify(state));
  return state;
}

function at(state, nodeId) {
  const node = WORLD_NODES[nodeId];
  assert.ok(node);
  return {
    ...state,
    player: { x: node.x, y: node.y },
  };
}

function doAt(state, nodeId, command) {
  const next = takeGameAction(at(state, nodeId), nodeId, command);
  assert.equal(next.ok, true, JSON.stringify(next));
  return next;
}

test("orientation begins with one dormant porch and no accepted quest", () => {
  const state = openLocal();
  assert.equal(state.questVisible, false);
  assert.deepEqual(visibleNodes(state).map(node => node.id), ["porch"]);
  assert.equal(currentQuest(state).status, "orientation");
  assert.equal(hudSnapshot(state).xp, null);
  assert.equal(hudSnapshot(state).humanWorth, null);
});

test("inspecting a TenetGram makes a quest visible without accepting anything", () => {
  let state = openLocal();
  state = doAt(state, "porch", "INSPECT");
  assert.equal(state.seedInspected, true);
  assert.equal(state.questVisible, true);
  assert.equal(state.world.phase, "offered");
  assert.equal(state.world.nextStep, "release-tree");
  assert.equal(state.history[0].authority, "attention-only");
  assert.ok(visibleNodes(state).some(node => node.id === "tree"));
});

test("successful run warms one house and mints no XP", () => {
  let state = openLocal();
  state = doAt(state, "porch", "INSPECT");
  state = doAt(state, "tree", "ACT");
  state = doAt(state, "cutter", "ACT");
  state = doAt(state, "truck", "ACT");
  state = doAt(state, "house", "ACT");

  assert.equal(state.terminal, "completed");
  assert.equal(state.world.phase, "completed");
  assert.equal(state.world.need.status, "met-for-this-load");
  assert.equal(state.world.resources.cutter.minutesAvailable, 0);
  assert.equal(state.world.resources.truck.loadsAvailable, 0);
  assert.equal(state.world.resources.firewood.state, "accepted-for-home-heat");
  assert.equal(state.counters.xp, null);
  assert.equal(state.counters.level, null);
  assert.equal(state.counters.humanWorth, null);
  assert.equal(currentQuest(state).status, "completed");
  assert.equal(state.futureDoor.status, "dormant");
  assert.equal(state.futureDoor.admitted, false);
  assert.equal(state.futureDoor.requested, false);
  assert.equal(state.futureDoor.executed, false);
});

test("Cara can refuse and the world resumes from honest residue instead of resetting", () => {
  let state = openLocal();
  state = doAt(state, "porch", "INSPECT");
  state = doAt(state, "tree", "ACT");
  state = doAt(state, "cutter", "ACT");
  state = doAt(state, "truck", "REFUSE");

  assert.equal(state.terminal, "held-residual");
  assert.equal(state.world.phase, "held-residual");
  assert.equal(state.world.resources.firewood.state, "cut-at-source");
  assert.equal(state.world.need.status, "open");
  assert.equal(currentQuest(state).status, "held-residual");
  assert.match(currentQuest(state).text, /haul-firewood/);
  assert.equal(state.futureDoor.sourceResidue.unresolvedRelation, "haul-firewood");
  assert.equal(state.futureDoor.status, "dormant");
  assert.equal(state.futureDoor.note.includes("GHoT owns canonical TenetGram emission"), true);

  const refusal = state.history.find(event => event.type === "step-refused");
  assert.equal(refusal.actor, "cara");
  assert.equal(refusal.humanWorthJudgment, null);
  assert.equal(refusal.score, null);

  assert.ok(visibleNodes(state).some(node => node.id === "futureDoor"));
});

test("completed step ACT cannot be replayed as future authority", () => {
  let state = openLocal();
  state = doAt(state, "porch", "INSPECT");
  state = doAt(state, "tree", "ACT");

  assert.deepEqual(availableCommands(at(state, "tree"), "tree"), ["VIEW"]);
  const replay = takeGameAction(at(state, "tree"), "tree", "ACT");
  assert.equal(replay.ok, false);
  assert.equal(replay.code, "command-unavailable");
});

test("real GHoT Warm Thread and TenetGram producers can open the ARPG world", t => {
  const dir = process.env.GHOT_TENETGRAM_DIR;
  if (!dir) {
    t.skip("Set GHOT_TENETGRAM_DIR to the GHoT tenetgram-040 checkout.");
    return;
  }

  const proposalRun = spawnSync(
    "python3",
    [resolve(dir, "ghot/warm_thread.py"), "proposal"],
    { encoding: "utf8" },
  );
  assert.equal(proposalRun.status, 0, proposalRun.stderr);

  const gramRun = spawnSync(
    "python3",
    [resolve(dir, "ghot/tenetgram.py"), "specimen"],
    { encoding: "utf8" },
  );
  assert.equal(gramRun.status, 0, gramRun.stderr);

  const state = createGameState({
    warmThreadProposal: JSON.parse(proposalRun.stdout),
    tenetgram: JSON.parse(gramRun.stdout),
    fieldId: "neighborhood-a",
  });

  assert.equal(state.ok, true, JSON.stringify(state));
  assert.equal(state.seed.status, "dormant");
  assert.equal(state.world.phase, "offered");
  assert.equal(state.counters.xp, null);
});
