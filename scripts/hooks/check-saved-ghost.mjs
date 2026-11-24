#!/usr/bin/env node
// Kiro PostFileSave hook: validate the ghost file that was just saved.
// The hook event arrives as JSON on stdin; we look for any *.ghost.yaml path in it.
import fs from 'node:fs/promises';
import { loadApps } from '../../core/src/apps.js';
import { parseGhost, GhostError } from '../../core/src/ghost.js';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const paths = new Set();
const walk = (v) => {
  if (typeof v === 'string' && v.endsWith('.ghost.yaml')) paths.add(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
try { walk(JSON.parse(raw || '{}')); } catch { raw.split(/\s+/).filter((s) => s.endsWith('.ghost.yaml')).forEach((s) => paths.add(s)); }
paths.add(process.argv[2] ?? '');
paths.delete('');

await loadApps();
let bad = 0;
for (const p of paths) {
  const text = await fs.readFile(p, 'utf8').catch(() => null);
  if (text === null) continue;
  try {
    const g = parseGhost(text, p);
    console.log(`ghost ok: ${p} (${g.name}; senses: ${g.senses.map((s) => s.name).join(', ')})`);
  } catch (e) {
    bad += 1;
    console.log(e instanceof GhostError ? `ghost INVALID: ${e.message}` : String(e));
  }
}
process.exitCode = bad ? 1 : 0;
