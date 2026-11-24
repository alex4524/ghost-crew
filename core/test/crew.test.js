// End to end: both apps against both demo houses in a real Chrome.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { serveStatic, loadApps, loadGhosts, haunt, getApp } from '../index.js';

let server;
let out;
before(async () => {
  await loadApps();
  server = await serveStatic('demo');
  out = await fs.mkdtemp(path.join(process.env.KIROCREW_SCRATCH ?? os.tmpdir(), 'ghost-crew-test-'));
});
after(async () => {
  await server?.close();
  await fs.rm(out, { recursive: true, force: true });
});

const keys = (report) => report.crew.flatMap((g) => g.scenes.flatMap((s) => s.hauntings.map((h) => h.key.split('::').slice(1, 3).join('::'))));

test('Poltergeist finds every planted accessibility bug, and none in the exorcised house', async () => {
  const ghosts = await loadGhosts([getApp('poltergeist').ghostsDir]);
  const haunted = await haunt({ ghosts, appName: 'poltergeist', baseUrl: `${server.url}haunted/`, out: path.join(out, 'p'), quiet: true });
  const found = keys(haunted.report);
  for (const k of ['axe::image-alt', 'axe::button-name', 'axe::html-has-lang', 'axe::color-contrast', 'keyboard-reach::Book now', 'focus-visible::focus-invisible', 'no-overflow::page-scrolls-sideways', 'no-broken-images::attic.png']) {
    assert.ok(found.includes(k), `expected ${k} in ${found.join(', ')}`);
  }
  assert.equal(haunted.exitCode, 1);
  const spirit = haunted.report.crew.flatMap((g) => g.scenes).find((s) => s.spirit);
  assert.ok(spirit && (await fs.stat(path.join(out, 'p', spirit.spirit))).size > 10_000, 'spirit photograph written');

  const clean = await haunt({ ghosts, appName: 'poltergeist', baseUrl: `${server.url}exorcised/`, out: path.join(out, 'p2'), baseline: path.join(out, 'p', 'report.json'), quiet: true });
  assert.equal(clean.report.totals.total, 0, keys(clean.report).join(', '));
  assert.equal(clean.report.exorcism.exorcised.length, haunted.report.totals.total);
  assert.equal(clean.exitCode, 0);
});

test('Phantom Form finds the planted form bugs, and none in the exorcised house', async () => {
  const ghosts = await loadGhosts([getApp('phantom-form').ghostsDir]);
  const haunted = await haunt({ ghosts, appName: 'phantom-form', baseUrl: `${server.url}haunted/`, out: path.join(out, 'f'), quiet: true });
  const found = haunted.report.crew.flatMap((g) => g.scenes.flatMap((s) => s.hauntings.map((h) => h.key)));
  for (const k of ['Guest name::emoji::broken', 'Guest name::markup::script', 'Guest name::long::crash', 'Guest name::blank::blank', 'Email::weird-valid-email::rejected']) {
    assert.ok(found.some((f) => f.endsWith(k)), `expected ${k}`);
  }
  const counter = haunted.report.crew.find((g) => g.ghost === 'The Night Counter');
  assert.ok(counter.tally.cast === 3 && counter.tally.survived === 1, JSON.stringify(counter.tally));

  const clean = await haunt({ ghosts, appName: 'phantom-form', baseUrl: `${server.url}exorcised/`, out: path.join(out, 'f2'), quiet: true });
  assert.equal(clean.report.totals.total, 0, keys(clean.report).join(', '));
});

test('zero-config crews run against a bare URL', async () => {
  const poltergeist = getApp('poltergeist');
  const r = await haunt({ ghosts: poltergeist.defaultCrew(`${server.url}haunted/`), appName: 'poltergeist', out: path.join(out, 'z'), quiet: true });
  assert.ok(r.report.totals.total >= 5);
  assert.ok(keys(r.report).some((k) => k.startsWith('keyboard-reach::lookalike')), 'finds the fake Book now button without being told');
  const phantom = getApp('phantom-form');
  const f = await haunt({ ghosts: phantom.defaultCrew(`${server.url}haunted/`), appName: 'phantom-form', out: path.join(out, 'z2'), quiet: true });
  assert.ok(f.report.totals.wrathful >= 1, 'auto mode still catches the script injection');
});
