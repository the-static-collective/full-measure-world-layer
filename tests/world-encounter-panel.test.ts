import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { WorldEncounterPanel } from '../src/components/WorldEncounterPanel.js';

test('World Threshold renders the constitutional interaction copy before browser effects run', () => {
  const html = renderToStaticMarkup(React.createElement(WorldEncounterPanel));
  assert.match(html, /World Threshold/);
  assert.match(html, /Prototype · fixture doors/);
  assert.match(html, /Gesture is candidate evidence/);
  assert.match(html, /Cross this door/);
  assert.match(html, /not destination identity/);
});
