import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseFocus,
  drawQuestProposal,
  holdFocus,
  initialState,
  playCard
} from "../specimens/grace-001/kernel.ts";

test("prayer recharges posture without changing external facts", () => {
  const start = initialState();
  const externalBefore = structuredClone(start.external);
  const next = playCard(start, "practice.pray");
  assert.equal(next.meters.attention, 6);
  assert.equal(next.meters.resilience, 6);
  assert.deepEqual(next.external, externalBefore);
  assert.ok(next.receipts.at(-1)?.nonClaims.includes("prayer did not change external facts"));
});

test("OTAAT interruption preserves a return address and residual", () => {
  const start = initialState();
  const next = chooseFocus(start, "client-housing");
  const morning = next.threads.find((t) => t.id === "morning");
  assert.equal(morning?.state, "suspended");
  assert.equal(morning?.returnAddress, "resume:morning");
  assert.equal(morning?.residual, "school pickup later today");
  assert.equal(next.foregroundThreadId, "client-housing");
});

test("holding is not completing", () => {
  const start = initialState();
  const next = holdFocus(start, "Heaven needs attention");
  const morning = next.threads.find((t) => t.id === "morning");
  assert.equal(morning?.state, "suspended");
  assert.notEqual(morning?.state, "closed");
  assert.ok(next.receipts.at(-1)?.nonClaims.includes("suspended does not mean complete"));
});

test("make-call records attempt, not fulfillment", () => {
  let state = chooseFocus(initialState(), "client-housing");
  state = playCard(state, "relation.make-call");
  assert.equal(state.external.clientHousing, "attempted");
  const r = state.receipts.at(-1);
  assert.ok(r?.nonClaims.includes("attempt is not appointment"));
  assert.ok(r?.nonClaims.includes("appointment is not housing secured"));
});

test("MADDcl0wn wildcard changes declared presentation, not external occurrence", () => {
  const start = initialState();
  const externalBefore = structuredClone(start.external);
  const next = playCard(start, "wild.no-optimize");
  assert.equal(next.projectionsHiddenTurns, 3);
  assert.deepEqual(next.external, externalBefore);
  assert.ok(next.receipts.at(-1)?.nonClaims.includes("wildcard does not establish a new external fact"));
});

test("DM d20 draw is proposal only", () => {
  const start = initialState();
  const proposal = drawQuestProposal(start, 42);
  assert.equal(proposal.kind, "proposal");
  assert.ok(proposal.roll >= 1 && proposal.roll <= 20);
  assert.ok(proposal.nonClaims.some((x) => x.includes("has not occurred")));
  assert.equal(start.receipts.length, 0);
});

test("same coarse endpoint can preserve different path history", () => {
  let a = chooseFocus(initialState(), "client-housing");
  a = playCard(a, "practice.pray");
  a = playCard(a, "relation.make-call");

  let b = chooseFocus(initialState(), "client-housing");
  b = playCard(b, "relation.make-call");
  b = playCard(b, "practice.pray");

  assert.deepEqual(a.meters, b.meters);
  assert.deepEqual(a.external, b.external);
  const aCards = a.receipts.filter((r) => r.cardId).map((r) => r.cardId);
  const bCards = b.receipts.filter((r) => r.cardId).map((r) => r.cardId);
  assert.notDeepEqual(aCards, bCards);
});
