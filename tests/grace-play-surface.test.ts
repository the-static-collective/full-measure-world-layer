import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {GracePlaySurface} from "../src/components/GracePlaySurface.tsx";
import {GraceCampaignPanel} from "../src/components/GraceCampaignPanel.tsx";
import {appendEvent, emptySession} from "../specimens/grace-001/session.ts";
import {resolvePlayAction} from "../specimens/grace-001/playExperience.ts";

test("focused play surface renders the scene and a small hand of choices", () => {
  const html = renderToStaticMarkup(
    React.createElement(GracePlaySurface, {
      session: emptySession(),
      commit: () => {},
    }),
  );

  assert.match(html, /Morning squeeze/);
  assert.match(html, /Return the housing call/);
  assert.match(html, /Use the trip for groceries/);
  assert.match(html, /Take a prayer block/);
  assert.match(html, /Take a real rest block/);
  assert.doesNotMatch(html, /Storyship archaeology/);
});

test("campaign panel defaults to focused play while keeping deep inspection behind a control", () => {
  const html = renderToStaticMarkup(React.createElement(GraceCampaignPanel));

  assert.match(html, /Morning squeeze/);
  assert.match(html, /Inspect world/);
  assert.doesNotMatch(html, />Supply</);
  assert.doesNotMatch(html, /World apertures · party/);
});


test("delayed world response interrupts the normal hand with concrete dispositions", () => {
  let session = emptySession();
  session = resolvePlayAction(session, "return-client-call").session;
  session = resolvePlayAction(session, "pray").session;
  session = resolvePlayAction(session, "pray").session;

  const html = renderToStaticMarkup(
    React.createElement(GracePlaySurface, {
      session,
      commit: () => {},
    }),
  );

  assert.match(html, /The phone rings back/);
  assert.match(html, />Answer</);
  assert.match(html, /Let it ring/);
  assert.match(html, /Hold it for tomorrow/);
  assert.doesNotMatch(html, /What do you put in your hand/);
});

test("zero-time Tuesday renders House Takes Attendance instead of a dead action deck", () => {
  let session = emptySession();
  session = appendEvent(session, {type: "economy_action", actionId: "grocery-run"});
  session = appendEvent(session, {type: "economy_action", actionId: "feed-home"});
  session = appendEvent(session, {type: "economy_action", actionId: "prayer-block"});

  const html = renderToStaticMarkup(
    React.createElement(GracePlaySurface, {
      session,
      commit: () => {},
    }),
  );

  assert.match(html, /THE HOUSE TAKES ATTENDANCE/);
  assert.match(html, /Dinner at home tonight/);
  assert.match(html, /Housing-resource callback/);
  assert.match(html, /Vehicle noise investigation/);
  assert.doesNotMatch(html, /What do you put in your hand/);
});
