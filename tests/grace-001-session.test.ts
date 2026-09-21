import test from "node:test";
import assert from "node:assert/strict";
import {
  appendEvent,
  decodeSession,
  emptySession,
  encodeSession,
  replaySession,
} from "../specimens/grace-001/session.ts";

test("append-only session replay is deterministic", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "focus", threadId: "client-housing"});
  session = appendEvent(session, {type: "story_card", cardId: "practice.pray"});
  session = appendEvent(session, {type: "economy_action", actionId: "prayer-block"});
  session = appendEvent(session, {type: "economy_action", actionId: "client-call"});

  const first = replaySession(session);
  const second = replaySession(decodeSession(encodeSession(session)));

  assert.deepEqual(second, first);
  assert.equal(first.story.foregroundThreadId, "client-housing");
  assert.equal(first.culture.stocks.time, 2);
  assert.equal(first.culture.stocks.attention, 3);
});

test("invalid replay cannot borrow unavailable supply", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "economy_action", actionId: "share-meal"});
  session = appendEvent(session, {type: "economy_action", actionId: "feed-home"});
  assert.throws(() => replaySession(session), /Cannot afford/);
});

test("dream to Upper Room to remembered word preserves meaning boundaries", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "dream_red_door"});
  session = appendEvent(session, {type: "upper_room_return", dreamId: "dream.red-door.001"});
  session = appendEvent(session, {type: "remembered_word", returnId: "upper-room.return.001"});

  const replay = replaySession(session);
  assert.equal(replay.meaning.dreams[0].interpretation, "unresolved");
  assert.equal(replay.meaning.returns[0].scriptureAnchor, "Psalm 46:10");
  assert.equal(replay.meaning.cards[0].generation, 1);
  assert.ok(replay.meaning.returns[0].nonClaims.includes("the return does not prove an interpretation of the dream"));
});

test("DM proposal survives replay as proposal, not occurrence", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "dm_roll", seed: 42});
  const replay = replaySession(session);
  assert.equal(replay.lastProposal?.kind, "proposal");
  assert.ok(replay.lastProposal?.nonClaims.some((claim) => claim.includes("has not occurred")));
});
