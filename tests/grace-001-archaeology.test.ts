import test from "node:test";
import assert from "node:assert/strict";

import {
  archaeologyScenes,
  visitArchaeologyScene,
  initialArchaeologyState,
} from "../specimens/grace-001/archaeology.ts";
import {
  appendEvent,
  emptySession,
  replaySession,
} from "../specimens/grace-001/session.ts";
import {
  createDayReceipt,
  verifyDayReceipt,
} from "../specimens/grace-001/dayReceipt.ts";

test("Bandcamp archaeology catalog keeps source-derived scenes non-canonical by default", () => {
  assert.deepEqual(
    archaeologyScenes.map((scene) => [scene.id, scene.sourceTitle, scene.canonical]),
    [
      ["porch-lemon-seeds", "Forty-Two Lemon Seeds", false],
      ["portable-witness-road", "Static Knows the Road", false],
      ["door-learns-morning", "The Door Learns the Morning", false],
    ],
  );
});

test("archaeology visit records source provenance, selected choice, and candidate relations only", () => {
  const state = visitArchaeologyScene(
    initialArchaeologyState(),
    {
      sceneId: "porch-lemon-seeds",
      choiceId: "plant-the-scraps",
      party: ["grace", "heaven"],
    },
  );

  const witness = state.visits[0];
  assert.equal(witness.sourceTitle, "Forty-Two Lemon Seeds");
  assert.equal(witness.choiceId, "plant-the-scraps");
  assert.ok(witness.candidateRelations.includes("scrap -> seed"));
  assert.ok(witness.nonClaims.includes("source lyric is not automatically campaign history"));
  assert.ok(witness.nonClaims.includes("candidate relation is not admitted world fact"));
});

test("party composition changes archaeology prompts without changing scene facts", () => {
  const graceOnly = visitArchaeologyScene(
    initialArchaeologyState(),
    {
      sceneId: "portable-witness-road",
      choiceId: "carry-the-witness",
      party: ["grace"],
    },
  );
  const withPaula = visitArchaeologyScene(
    initialArchaeologyState(),
    {
      sceneId: "portable-witness-road",
      choiceId: "carry-the-witness",
      party: ["grace", "paula"],
    },
  );

  assert.notDeepEqual(graceOnly.visits[0].partyPrompts, withPaula.visits[0].partyPrompts);
  assert.deepEqual(graceOnly.visits[0].sourceFacts, withPaula.visits[0].sourceFacts);
});

test("session replay requires an immediately preceding storyship-block for an archaeology visit", () => {
  let free = emptySession();
  free = appendEvent(free, {
    type: "archaeology_visit",
    sceneId: "door-learns-morning",
    choiceId: "sit-before-moving",
  });
  assert.throws(() => replaySession(free), /storyship-block/);

  let paid = emptySession();
  paid = appendEvent(paid, {type: "economy_action", actionId: "storyship-block"});
  paid = appendEvent(paid, {
    type: "archaeology_visit",
    sceneId: "door-learns-morning",
    choiceId: "sit-before-moving",
  });
  const replay = replaySession(paid);
  assert.equal(replay.archaeology.visits.length, 1);
  assert.equal(replay.culture.stocks.time, 3);
  assert.equal(replay.culture.stocks.attention, 2);
});

test("Day Receipt replay checksum binds archaeology witnesses", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "economy_action", actionId: "storyship-block"});
  session = appendEvent(session, {
    type: "archaeology_visit",
    sceneId: "porch-lemon-seeds",
    choiceId: "leave-a-seat-open",
  });

  const receipt = createDayReceipt(session);
  assert.equal(verifyDayReceipt(receipt).ok, true);
  assert.equal(receipt.summary.archaeologyVisits, 1);

  receipt.session.events[1] = {
    id: receipt.session.events[1].id,
    type: "archaeology_visit",
    sceneId: "porch-lemon-seeds",
    choiceId: "plant-the-scraps",
  };
  assert.equal(verifyDayReceipt(receipt).ok, false);
});
