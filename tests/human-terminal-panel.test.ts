import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { HumanTerminalPanel } from '../src/components/HumanTerminalPanel.js';

test('Human Terminal renders bounded basic-human commands before browser effects run', () => {
  const html = renderToStaticMarkup(React.createElement(HumanTerminalPanel));

  assert.match(html, /Human Terminal/);
  assert.match(html, /Where am I\?/);
  assert.match(html, /What doors are nearby\?/);
  assert.match(html, /What can I safely do\?/);
  assert.match(html, /What happened last time\?/);
  assert.match(html, /What needs me\?/);
  assert.match(html, /Suggestion is not authority/);
  assert.match(html, /basic human/i);
});
