// The crew must not raise false alarms: a bot check is not the site, focus drawn by a
// nearby element is still visible, and logo text is exempt from the contrast rule.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { serveStatic, loadApps, haunt } from '../index.js';

let server;
let blocked;
let out;
before(async () => {
  await loadApps();
  server = await serveStatic('core/test/fixtures');
  // A page that only says "bot check" in its response header, the way Cloudflare marks one.
  blocked = http.createServer((req, res) => {
    res.writeHead(403, { 'content-type': 'text/html', 'cf-mitigated': 'challenge' });
    res.end('<!doctype html><html lang="en"><title>One moment</title><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></html>');
  });
  await new Promise((r) => blocked.listen(0, '127.0.0.1', r));
  out = await fs.mkdtemp(path.join(process.env.KIROCREW_SCRATCH ?? os.tmpdir(), 'ghost-crew-alarms-'));
});
after(async () => {
  await server?.close();
  await new Promise((r) => blocked?.close(r));
  await fs.rm(out, { recursive: true, force: true });
});

/** @param {string} haunts @param {string} sense */
const ghost = (haunts, sense) => ({ name: `The ${sense} test`, file: '(test)', lore: '', haunts, device: 'desktop', steps: [], senses: [{ name: sense, options: {} }] });

/** @param {any} r */
const hauntings = (r) => r.crew.flatMap((g) => g.scenes.flatMap((s) => s.hauntings));

test('a ghost stopped by a bot check gets lost instead of haunting the bot check', async () => {
  const { report, files } = await haunt({
    ghosts: [ghost('wall.html', 'axe'), ghost(`http://127.0.0.1:${blocked.address().port}/`, 'axe')],
    appName: 'poltergeist', baseUrl: server.url, out: path.join(out, 'wall'), quiet: true, wallWaitMs: 1000,
  });
  assert.deepEqual(hauntings(report), []);
  for (const g of report.crew) {
    assert.equal(g.state, 'lost');
    assert.match(g.error, /Cloudflare bot check .*nothing was haunted/);
  }
  assert.match(report.crew[0].error, /challenge script/);
  assert.match(report.crew[1].error, /cf-mitigated/);
  const html = await fs.readFile(files.html, 'utf8');
  assert.match(html, /Nothing haunted, but 2 of 2 ghosts got lost\./, 'the record must not read as an all clear');
  assert.match(html, /<h2 id="verdict-h" class="count" data-i18n="lostVerdict"/);
});

test('a ghost waits for a bot check that lets it through, then haunts the real page', async () => {
  const { report } = await haunt({ ghosts: [ghost('wall-clears.html', 'axe')], appName: 'poltergeist', baseUrl: server.url, out: path.join(out, 'clears'), quiet: true });
  const [g] = report.crew;
  assert.equal(g.state, 'haunted', g.error);
  assert.ok(hauntings(report).some((h) => h.key.endsWith('::axe::image-alt')));
});

test('focus drawn by a nearby element counts as visible; focus that changes nothing does not', async () => {
  const { report } = await haunt({ ghosts: [ghost('focus-nearby.html', 'focus-visible')], appName: 'poltergeist', baseUrl: server.url, out: path.join(out, 'focus'), quiet: true });
  const found = hauntings(report);
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.equal(found[0].title, 'Keyboard focus is invisible on 1 element');
  assert.match(found[0].detail, /"Send"/);
  assert.equal(found[0].boxes.length, 1);
});

test('logo text is exempt from the contrast rule; other faint text is not', async () => {
  const { report } = await haunt({ ghosts: [ghost('logo.html', 'axe')], appName: 'poltergeist', baseUrl: server.url, out: path.join(out, 'logo'), quiet: true });
  const contrast = hauntings(report).find((h) => h.key.endsWith('::axe::color-contrast'));
  assert.ok(contrast, 'the faint paragraph is still haunted');
  assert.match(contrast.detail, /^1 element affected/);
});
