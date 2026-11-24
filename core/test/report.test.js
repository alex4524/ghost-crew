import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, renderReportHtml, summarize } from '../index.js';

const theme = { name: 'Test App', tagline: 'For tests.' };
const haunting = (key, mood = 'restless') => ({ n: 1, key, sense: 's', mood, title: `t ${key}`, boxes: [], scene: 'The walk' });
const ghost = (name, hauntings) => ({
  ghost: name, file: 'x', url: 'http://127.0.0.1/', device: 'desktop', state: hauntings.length ? 'haunted' : 'quiet',
  ms: 10, tally: {}, scenes: [{ label: 'The walk', url: 'http://127.0.0.1/', hauntings }],
});

test('totals count every mood', () => {
  const r = buildReport({ app: 'a', theme, startedAt: new Date(), results: [ghost('The A', [haunting('1', 'wrathful'), haunting('2')])] });
  assert.equal(r.totals.total, 2);
  assert.equal(r.totals.wrathful, 1);
  assert.equal(r.totals.restless, 1);
  assert.equal(r.exorcism, null);
});

test('exorcism diff: new, still and exorcised', () => {
  const before = buildReport({ app: 'a', theme, startedAt: new Date('2026-11-20'), results: [ghost('The A', [haunting('old'), haunting('kept')])] });
  const after = buildReport({ app: 'a', theme, startedAt: new Date(), results: [ghost('The A', [haunting('kept'), haunting('fresh')])], baseline: before });
  assert.equal(after.exorcism.fresh, 1);
  assert.equal(after.exorcism.still, 1);
  assert.deepEqual(after.exorcism.exorcised.map((h) => h.key), ['old']);
  const statuses = after.crew[0].scenes[0].hauntings.map((h) => h.status);
  assert.deepEqual(statuses, ['still', 'new']);
});

test('the séance record escapes page text and says when the house is quiet', () => {
  const loud = buildReport({ app: 'a', theme, startedAt: new Date(), results: [ghost('The <script>', [haunting('<img onerror=1>')])] });
  const html = renderReportHtml(loud);
  assert.ok(!html.includes('<img onerror=1>'));
  assert.ok(html.includes('&lt;img onerror=1&gt;'));
  assert.match(html, /<html lang="en">/);
  const quiet = renderReportHtml(buildReport({ app: 'a', theme, startedAt: new Date(), results: [ghost('The B', [])] }));
  assert.match(quiet, /The house is quiet\./);
  assert.match(summarize(loud), /1 haunting\(s\) from 1 ghost/);
});
