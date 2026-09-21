import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {GraceRoomStage} from '../src/components/GraceRoomStage.tsx';
import {GracePlaySurface} from '../src/components/GracePlaySurface.tsx';
import {deriveDayPhase, derivePlayActions, derivePlayScene} from '../specimens/grace-001/playExperience.ts';
import {emptySession} from '../specimens/grace-001/session.ts';

function renderStage(actions = derivePlayActions(emptySession()), hidden = false, phase = deriveDayPhase(emptySession())) {
  const session = emptySession();
  return renderToStaticMarkup(React.createElement(GraceRoomStage, {
    scene: derivePlayScene(session), phase, actions, selectedActionId: null,
    onSelectAction: () => {}, projectionsHidden: hidden,
  }));
}

test('the playable room presents four currently available choices as objects, not new mechanics', () => {
  const html = renderStage();
  assert.match(html, /Grace&#x27;s Tuesday room/);
  assert.match(html, /the house keeps living/);
  for (const object of ['telephone', 'grocery bag', 'quiet corner', 'resting chair']) {
    assert.match(html, new RegExp(`Preview [^"<>]+ at the ${object}`));
  }
  assert.equal((html.match(/class="grace-room-stage__hotspot /g) || []).length, 4);
  assert.match(html, /aria-label="Current supply"/);
  assert.match(html, /Morning squeeze/);
});

test('unavailable actions become non-interactive props, without a counterfeit click affordance', () => {
  const html = renderStage([]);
  assert.doesNotMatch(html, /<button/);
  assert.match(html, /grace-room-stage__object--phone/);
  assert.match(html, /grace-room-stage__object--chair/);
});

test('the MADDcl0wn covers hide numeric supply without changing campaign state', () => {
  const html = renderStage(derivePlayActions(emptySession()), true);
  assert.match(html, /numeric projections are covered/);
  assert.doesNotMatch(html, /aria-label="Current supply"/);
  assert.doesNotMatch(html, /grace-room-stage__supply"/);
});

test('phase changes atmosphere but does not change button authority', () => {
  const morning = renderStage();
  const evening = renderStage(derivePlayActions(emptySession()), false, 'evening');
  assert.match(morning, /grace-room-stage--morning/);
  assert.match(evening, /grace-room-stage--evening/);
  assert.equal((morning.match(/<button/g) || []).length, (evening.match(/<button/g) || []).length);
});

test('Grace focused play embeds the room while preserving a separate Do it confirmation', () => {
  const html = renderToStaticMarkup(React.createElement(GracePlaySurface, {
    session: emptySession(), commit: () => {},
  }));
  assert.match(html, /Grace&#x27;s Tuesday room/);
  assert.match(html, /What do you put in your hand/);
  assert.doesNotMatch(html, /World apertures · party/);
  // Selecting a prop is only a preview. Execution remains the existing second click.
  const source = renderStage();
  assert.doesNotMatch(source, /Do it/);
});
