#!/usr/bin/env node
// Kiro SessionStart hook: print the newest séance record as a short briefing.
import fs from 'node:fs/promises';
import path from 'node:path';

const roots = ['ghost-reports', 'site/reports'];
let newest = null;
for (const root of roots) {
  for (const d of await fs.readdir(root).catch(() => [])) {
    const f = path.join(root, d, 'report.json');
    const s = await fs.stat(f).catch(() => null);
    if (s && (!newest || s.mtimeMs > newest.t)) newest = { f, t: s.mtimeMs };
  }
}
if (!newest) {
  console.log('Ghost Crew: no séance records yet. Run `npm run midnight` to haunt the demo inn.');
} else {
  const r = JSON.parse(await fs.readFile(newest.f, 'utf8'));
  const worst = r.crew.flatMap((g) => g.scenes.flatMap((s) => s.hauntings.map((h) => ({ ...h, ghost: g.ghost }))))
    .sort((a, b) => ['wrathful', 'restless', 'mischievous', 'faint'].indexOf(a.mood) - ['wrathful', 'restless', 'mischievous', 'faint'].indexOf(b.mood))
    .slice(0, 3);
  console.log(`Ghost Crew briefing from ${newest.f} (${r.startedAt}): ${r.theme.name} found ${r.totals.total} haunting(s).`);
  for (const h of worst) console.log(`- [${h.mood}] ${h.ghost}: ${h.title}`);
}
