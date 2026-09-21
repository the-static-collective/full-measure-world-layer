import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseParty,
  initialApertureState,
  partyPrompts,
  possibleWorldTensions,
  recordFlashbackReflection,
  returnFromPossibleWorld,
  togglePossibleWorldPrinciple,
} from "../specimens/grace-001/apertures.ts";
import {
  appendEvent,
  emptySession,
  replaySession,
} from "../specimens/grace-001/session.ts";
import {
  createDayReceipt,
  verifyDayReceipt,
} from "../specimens/grace-001/dayReceipt.ts";

test("party selection always retains Grace and treats companions as lenses rather than buffs", () => {
  let state = initialApertureState();
  state = chooseParty(state, ["paula"]);
  assert.deepEqual(state.party, ["grace", "paula"]);
  assert.ok(partyPrompts(state.party).some((prompt) => prompt.includes("community")));
});

test("flashback reflection preserves source event and records only present interpretation", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "economy_action", actionId: "client-call"});
  const sourceBefore = structuredClone(session.events[0]);
  session = appendEvent(session, {
    type: "flashback_reflection",
    sourceEventId: sourceBefore.id,
    presentReflection: "I notice now that returning the call also cost attention I needed elsewhere.",
  });

  const replay = replaySession(session);
  assert.deepEqual(session.events[0], sourceBefore);
  assert.equal(replay.apertures.flashbacks.length, 1);
  assert.ok(replay.apertures.flashbacks[0].nonClaims.includes("the source event was not edited"));
});

test("flashback cannot point to a nonexistent historical event", () => {
  let session = emptySession();
  session = appendEvent(session, {
    type: "flashback_reflection",
    sourceEventId: "grace-event-9999",
    presentReflection: "invented past",
  });
  assert.throws(() => replaySession(session), /Unknown flashback source event/);
});

test("possible world can hold abundance principles while keeping hard tensions visible", () => {
  let state = initialApertureState();
  state = togglePossibleWorldPrinciple(state, "food-without-proof");
  state = togglePossibleWorldPrinciple(state, "community-kitchen");
  state = togglePossibleWorldPrinciple(state, "garden-everywhere");
  state = returnFromPossibleWorld(state);

  const witness = state.possibleWorldReturns[0];
  assert.equal(witness.worldId, "possible-world.grace-house");
  assert.ok(witness.tensions.some((item) => item.includes("none abolish supply constraints")));
  assert.ok(witness.nonClaims.includes("utopian desirability is not treated as feasibility proof"));
});

test("Day Receipt checksum binds party, flashback and possible-world replay state", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "choose_party", members: ["grace", "heaven", "paula"]});
  session = appendEvent(session, {type: "economy_action", actionId: "client-call"});
  session = appendEvent(session, {
    type: "flashback_reflection",
    sourceEventId: "grace-event-0002",
    presentReflection: "I can see the opportunity cost more clearly now.",
  });
  session = appendEvent(session, {type: "possible_world_toggle", principleId: "food-without-proof"});
  session = appendEvent(session, {type: "possible_world_return"});

  const receipt = createDayReceipt(session);
  assert.equal(verifyDayReceipt(receipt).ok, true);
  assert.deepEqual(receipt.summary.party, ["grace", "heaven", "paula"]);
  assert.equal(receipt.summary.flashbacks, 1);
  assert.equal(receipt.summary.possibleWorldReturns, 1);

  receipt.session.events[0] = {
    id: "grace-event-0001",
    type: "choose_party",
    members: ["grace"],
  };
  assert.equal(verifyDayReceipt(receipt).ok, false);
});

test("possible-world tension calculation does not pretend a fantasy abolishes inputs", () => {
  const tensions = possibleWorldTensions([
    "food-without-proof",
    "heaven-art-room",
    "porch-around-house",
    "community-kitchen",
    "garden-everywhere",
  ]);
  assert.ok(tensions.length >= 5);
  assert.ok(tensions.some((item) => item.includes("supply constraints")));
});
