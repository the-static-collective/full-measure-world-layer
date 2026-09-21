import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {GracePlaySurface} from "../src/components/GracePlaySurface.tsx";
import {GraceCampaignPanel} from "../src/components/GraceCampaignPanel.tsx";
import {emptySession} from "../specimens/grace-001/session.ts";

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
