import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveEncounterOffer,
  derivePlayActions,
  derivePlayScene,
  previewPlayAction,
  resolvePlayAction,
} from "../specimens/grace-001/playExperience.ts";
import {
  appendEvent,
  emptySession,
  replaySession,
} from "../specimens/grace-001/session.ts";

test("scene-first play exposes at most four meaningful actions", () => {
  const session = emptySession();
  const scene = derivePlayScene(session);
  const actions = derivePlayActions(session);

  assert.equal(scene.title, "Morning squeeze");
  assert.ok(scene.body.includes("Heaven"));
  assert.ok(actions.length >= 3 && actions.length <= 4);
  assert.deepEqual(
    actions.map((action) => action.id),
    ["return-client-call", "grocery-run", "pray", "rest"],
  );
});

test("action preview shows concrete cost and foreclosed alternatives before commit", () => {
  const session = emptySession();
  const preview = previewPlayAction(session, "grocery-run");

  assert.deepEqual(preview.cost, {
    time: 2,
    cash: 18,
    transport: 1,
    attention: 1,
  });
  assert.ok(preview.foreclosed.includes("check-vehicle"));
  assert.equal(preview.authority, "none");
  assert.ok(preview.nonClaims.includes("foreclosed action != morally worse or better action"));
});

test("committing the client call produces a compact consequence beat and real replay state", () => {
  const session = emptySession();
  const resolved = resolvePlayAction(session, "return-client-call");
  const replay = replaySession(resolved.session);

  assert.equal(replay.story.external.clientHousing, "attempted");
  assert.equal(replay.culture.demands.find((d) => d.id === "client-callback")?.met, 1);
  assert.equal(resolved.beat.title, "Call attempted");
  assert.ok(resolved.beat.lines.some((line) => line.includes("housing")));
  assert.ok(resolved.beat.lines.some((line) => line.includes("still open")));
});

test("rest can surface the Red Door as an encounter instead of a permanent menu item", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "rest").session;

  const offer = deriveEncounterOffer(session);
  assert.equal(offer?.id, "red-door-after-rest");
  assert.equal(offer?.kind, "maddjack");
  assert.deepEqual(offer?.events, [{type: "dream_red_door"}]);
  assert.ok(offer?.nonClaims.includes("encounter offer != prophecy"));
});

test("once the Red Door is witnessed the same encounter is not offered again", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "rest").session;
  session = appendEvent(session, {type: "dream_red_door"});

  assert.equal(deriveEncounterOffer(session), null);
});

test("a few ordinary turns can surface a bounded MADDcl0wn rupture", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "return-client-call").session;
  session = resolvePlayAction(session, "pray").session;
  session = resolvePlayAction(session, "grocery-run").session;

  const offer = deriveEncounterOffer(session);
  assert.equal(offer?.id, "no-optimize-rupture");
  assert.equal(offer?.kind, "maddclown");
  assert.deepEqual(offer?.events, [{type: "story_card", cardId: "wild.no-optimize"}]);
});

test("an unaffordable action disappears from the focused action deck rather than inviting a dead click", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "grocery-run").session;

  const ids = derivePlayActions(session).map((action) => action.id);
  assert.ok(!ids.includes("grocery-run"));
  assert.ok(ids.length <= 4);
});
