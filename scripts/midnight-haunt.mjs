#!/usr/bin/env node
// The midnight patrol: both apps haunt the haunted inn, then the exorcised inn with the
// haunted report as baseline. Writes four séance records and latest.json into site/reports/.
// CI runs this every night; locally: npm run midnight
//
// The crew walks a copy of demo/ served on 127.0.0.1 from this very commit, so the records
// always match the code beside them. Links in the records point to the published copy of the
// same pages (GitHub Pages serves demo/ next to the reports), never to the local server.
import fs from 'node:fs/promises';
import path from 'node:path';
import { serveStatic, loadApps, loadGhosts, haunt, getApp, PACKAGE_ROOT } from '../core/index.js';

const out = path.resolve(process.env.GHOST_CREW_OUT ?? path.join(PACKAGE_ROOT, 'site', 'reports'));
const remote = process.env.GHOST_CREW_TARGET; // haunt a deployed copy instead, e.g. https://alex4524.github.io/ghost-crew/demo/
const only = process.env.GHOST_CREW_ONLY?.split(',');
const pkg = JSON.parse(await fs.readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
const publicDemo = process.env.GHOST_CREW_PUBLIC_DEMO ?? new URL('demo/', pkg.homepage.endsWith('/') ? pkg.homepage : `${pkg.homepage}/`).toString();

await loadApps();
const server = remote ? null : await serveStatic(path.join(PACKAGE_ROOT, 'demo'));
const base = remote ?? /** @type {{url: string}} */ (server).url;
const publicUrl = remote ? undefined : { from: base, to: publicDemo };

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
      publicUrl,
    });
    summary.push({
      id: r.id, app: r.app, appName: app.theme.name, house: r.house, href: `reports/${r.id}/`,
      totals: report.totals, ghosts: report.crew.length, ms: report.ms,
      exorcised: report.exorcism?.exorcised.length ?? null,
      cover: report.cover ? `reports/${r.id}/cover.png` : null,
      target: report.baseUrl,
    });
  }
} finally {
  await server?.close();
}
await fs.writeFile(path.join(out, 'latest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), target: remote ?? publicDemo, runs: summary }, null, 2));
console.log(`Midnight patrol finished: ${summary.map((s) => `${s.id} ${s.totals.total}`).join(', ')}`);
