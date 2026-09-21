import test from "node:test";
import assert from "node:assert/strict";
import {
  createDayReceipt,
  decodeDayReceipt,
  encodeDayReceipt,
  verifyDayReceipt,
} from "../specimens/grace-001/dayReceipt.ts";
import {appendEvent, emptySession} from "../specimens/grace-001/session.ts";

test("Day Receipt round-trips through replay verification", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "economy_action", actionId: "client-call"});
  session = appendEvent(session, {type: "dream_red_door"});
  session = appendEvent(session, {
    type: "upper_room_return",
    dreamId: "dream.red-door.001",
    anchorId: "ask-wisdom",
  });

  const receipt = createDayReceipt(session);
  const decoded = decodeDayReceipt(encodeDayReceipt(receipt));

  assert.equal(verifyDayReceipt(decoded).ok, true);
  assert.equal(decoded.summary.events, 3);
  assert.equal(decoded.summary.upperRoomReturns, 1);
  assert.equal(decoded.session.events[2].type, "upper_room_return");
});

test("Day Receipt rejects replay-changing tampering", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "economy_action", actionId: "client-call"});
  const receipt = createDayReceipt(session);

  receipt.session.events[0] = {
    id: receipt.session.events[0].id,
    type: "economy_action",
    actionId: "grocery-run",
  };

  assert.equal(verifyDayReceipt(receipt).ok, false);
  assert.throws(() => decodeDayReceipt(JSON.stringify(receipt)), /checksum mismatch/);
});

test("Day Receipt checksum is explicitly not an authority signature", () => {
  const receipt = createDayReceipt(emptySession());
  assert.ok(receipt.replayChecksum.startsWith("fnv1a32:"));
  assert.ok(receipt.nonClaims.includes("the checksum is a corruption/replay witness, not a cryptographic signature"));
});
