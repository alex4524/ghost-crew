#!/usr/bin/env node
// The midnight patrol: both apps haunt the haunted inn, then the exorcised inn with the
// haunted report as baseline. Writes four séance records and latest.json into site/reports/.
// CI runs this every night; locally: npm run midnight
import fs from 'node:fs/promises';
import path from 'node:path';
import { serveStatic, loadApps, loadGhosts, haunt, getApp, PACKAGE_ROOT } from '../core/index.js';

const out = path.resolve(process.env.GHOST_CREW_OUT ?? path.join(PACKAGE_ROOT, 'site', 'reports'));
const remote = process.env.GHOST_CREW_TARGET; // e.g. https://alex4524.github.io/ghost-crew/demo/
const only = process.env.GHOST_CREW_ONLY?.split(',');

await loadApps();
const server = remote ? null : await serveStatic(path.join(PACKAGE_ROOT, 'demo'));
const base = remote ?? /** @type {{url: string}} */ (server).url;

const runs = [
  { id: 'poltergeist', app: 'poltergeist', house: 'haunted' },
  { id: 'phantom-form', app: 'phantom-form', house: 'haunted' },
  { id: 'poltergeist-exorcised', app: 'poltergeist', house: 'exorcised', baseline: 'poltergeist' },
  { id: 'phantom-form-exorcised', app: 'phantom-form', house: 'exorcised', baseline: 'phantom-form' },
].filter((r) => !only || only.includes(r.id));

const summary = [];
try {
  for (const r of runs) {
    const app = getApp(r.app);
    if (!app?.ghostsDir) throw new Error(`App ${r.app} has no ghosts folder`);
    const ghosts = await loadGhosts([app.ghostsDir]);
    const { report } = await haunt({
      ghosts,
      appName: r.app,
      baseUrl: new URL(`${r.house}/`, base).toString(),
      out: path.join(out, r.id),
      baseline: r.baseline ? path.join(out, r.baseline, 'report.json') : undefined,
      failOn: 'none',
    });
    summary.push({
      id: r.id, app: r.app, appName: app.theme.name, house: r.house, href: `reports/${r.id}/`,
      totals: report.totals, ghosts: report.crew.length, ms: report.ms,
      exorcised: report.exorcism?.exorcised.length ?? null,
      cover: report.cover ? `reports/${r.id}/cover.png` : null,
    });
  }
} finally {
  await server?.close();
}
await fs.writeFile(path.join(out, 'latest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), target: remote ?? 'demo served from this repository', runs: summary }, null, 2));
console.log(`Midnight patrol finished: ${summary.map((s) => `${s.id} ${s.totals.total}`).join(', ')}`);
