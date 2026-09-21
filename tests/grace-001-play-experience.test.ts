import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveDayAttendance,
  deriveDayPhase,
  deriveEncounterOffer,
  derivePlayActions,
  derivePlayScene,
  deriveWorldResponseOffer,
  previewPlayAction,
  resolvePlayAction,
  resolveWorldResponse,
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


test("day phase derives from existing finite time rather than a second clock resource", () => {
  let session = emptySession();
  assert.equal(deriveDayPhase(session), "morning");

  session = resolvePlayAction(session, "return-client-call").session;
  assert.equal(deriveDayPhase(session), "midday");

  session = resolvePlayAction(session, "pray").session;
  assert.equal(deriveDayPhase(session), "midday");

  session = resolvePlayAction(session, "pray").session;
  assert.equal(deriveDayPhase(session), "evening");
});

test("housing coordinator callback returns deterministically after two later ordinary turns", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "return-client-call").session;
  assert.equal(deriveWorldResponseOffer(session), null);

  session = resolvePlayAction(session, "pray").session;
  assert.equal(deriveWorldResponseOffer(session), null);

  session = resolvePlayAction(session, "pray").session;
  const offer = deriveWorldResponseOffer(session);
  assert.equal(offer?.id, "housing-coordinator-callback");
  assert.match(offer?.title ?? "", /phone/i);
  assert.deepEqual(
    offer?.options.map((option) => option.id),
    ["answer", "let-ring", "hold-tomorrow"],
  );
});

test("answering delayed housing callback records appointment offer without claiming housing secured", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "return-client-call").session;
  session = resolvePlayAction(session, "pray").session;
  session = resolvePlayAction(session, "pray").session;

  const resolved = resolveWorldResponse(
    session,
    "housing-coordinator-callback",
    "answer",
  );
  const replay = replaySession(resolved);

  assert.equal(replay.story.external.clientHousing, "appointment_offered");
  assert.ok(
    replay.story.receipts.at(-1)?.nonClaims.includes(
      "appointment offered != housing secured",
    ),
  );
  assert.equal(deriveWorldResponseOffer(resolved), null);
});

test("letting the delayed call ring preserves that it happened without inventing fulfillment", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "return-client-call").session;
  session = resolvePlayAction(session, "pray").session;
  session = resolvePlayAction(session, "pray").session;

  const resolved = resolveWorldResponse(
    session,
    "housing-coordinator-callback",
    "let-ring",
  );
  const replay = replaySession(resolved);

  assert.equal(replay.story.external.clientHousing, "attempted");
  assert.ok(
    replay.story.receipts.at(-1)?.claims.includes(
      "housing coordinator callback arrived",
    ),
  );
  assert.ok(
    replay.story.receipts.at(-1)?.nonClaims.includes(
      "unanswered callback != refused help",
    ),
  );
});

test("groceries change the later scene without pretending other needs disappeared", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "grocery-run").session;
  session = resolvePlayAction(session, "pray").session;

  const scene = derivePlayScene(session);
  assert.equal(deriveDayPhase(session), "evening");
  assert.match(scene.title, /Groceries made it home/);
  assert.match(scene.body, /vehicle/i);
});

test("House Takes Attendance appears when time is exhausted and preserves open needs", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "grocery-run").session;
  session = resolvePlayAction(session, "rest").session;

  const attendance = deriveDayAttendance(session);
  assert.equal(attendance?.title, "THE HOUSE TAKES ATTENDANCE");
  assert.ok(attendance?.open.includes("Housing-resource callback"));
  assert.ok(attendance?.open.includes("Vehicle noise investigation"));
  assert.ok(attendance?.practiced.includes("rest"));
  assert.ok(
    attendance?.nonClaims.includes(
      "end of day != resolution of every open need",
    ),
  );
});
