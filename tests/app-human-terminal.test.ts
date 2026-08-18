import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    length: 0,
    clear() {},
    getItem() { return null; },
    key() { return null; },
    removeItem() {},
    setItem() {},
  },
});

test('campfire mounts Human Terminal before the inhabited World Threshold', async () => {
  const { default: App } = await import('../src/App.js');
  const html = renderToStaticMarkup(React.createElement(App));
  const terminal = html.indexOf('Human Terminal');
  const threshold = html.indexOf('World Threshold');

  assert.notEqual(terminal, -1);
  assert.notEqual(threshold, -1);
  assert.ok(terminal < threshold);
  assert.match(html, /id="world-threshold"/);
});
