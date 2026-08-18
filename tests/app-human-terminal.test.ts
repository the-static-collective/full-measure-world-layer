import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import App from '../src/App.js';

test('campfire mounts Human Terminal before the inhabited World Threshold', () => {
  const html = renderToStaticMarkup(React.createElement(App));
  const terminal = html.indexOf('Human Terminal');
  const threshold = html.indexOf('World Threshold');

  assert.notEqual(terminal, -1);
  assert.notEqual(threshold, -1);
  assert.ok(terminal < threshold);
  assert.match(html, /id="world-threshold"/);
});
