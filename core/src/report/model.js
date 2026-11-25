// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @typedef {import('../types.js').GhostResult} GhostResult
 * @typedef {import('../types.js').Mood} Mood
 * @typedef {import('../types.js').Theme} Theme
 */

export const MOODS = /** @type {const} */ (['wrathful', 'restless', 'mischievous', 'faint']);
export const SCHEMA = 'ghost-crew/report@1';

/**
 * @typedef {Object} Report
 * @property {string} schema
 * @property {string} app
 * @property {Theme} theme
 * @property {string} [baseUrl]
 * @property {string} startedAt
 * @property {number} ms
 * @property {GhostResult[]} crew
 * @property {Record<Mood, number> & { total: number }} totals
 * @property {{ baselineAt: string, fresh: number, still: number,
 *   exorcised: { key: string, ghost: string, title: string, mood: Mood }[] } | null} exorcism
 * @property {string | null} cover
 */

/**
 * `publicUrl` rewrites addresses that start with `from` to start with `to`, so a crew run
 * against a local copy of a site can publish links to the public copy instead.
 * @param {{ app: string, theme: Theme, baseUrl?: string, startedAt: Date, results: GhostResult[], baseline?: Report | null,
 *   publicUrl?: { from: string, to: string } }} input
 * @returns {Report}
 */
export function buildReport({ app, theme, baseUrl, startedAt, results: walked, baseline = null, publicUrl }) {
  const swap = (/** @type {string | undefined} */ u) => (publicUrl && typeof u === 'string' && u.startsWith(publicUrl.from) ? publicUrl.to + u.slice(publicUrl.from.length) : u);
  const results = publicUrl
    ? walked.map((g) => ({ ...g, url: /** @type {string} */ (swap(g.url)), scenes: g.scenes.map((s) => ({ ...s, url: /** @type {string} */ (swap(s.url)) })) }))
    : walked;
  baseUrl = swap(baseUrl);
  const all = results.flatMap((r) => r.scenes.flatMap((s) => s.hauntings.map((h) => ({ ...h, ghost: r.ghost }))));
  const totals = /** @type {Report['totals']} */ ({ wrathful: 0, restless: 0, mischievous: 0, faint: 0, total: all.length });
  for (const h of all) totals[h.mood] += 1;

  let exorcism = null;
  if (baseline) {
    const before = new Map();
    for (const r of baseline.crew) for (const s of r.scenes) for (const h of s.hauntings) before.set(h.key, { key: h.key, ghost: r.ghost, title: h.title, mood: h.mood });
    const now = new Set(all.map((h) => h.key));
    let fresh = 0;
    let still = 0;
    for (const r of results) for (const s of r.scenes) for (const h of s.hauntings) {
      h.status = before.has(h.key) ? 'still' : 'new';
      if (h.status === 'new') fresh += 1; else still += 1;
    }
    const exorcised = [...before.values()].filter((h) => !now.has(h.key));
    exorcism = { baselineAt: baseline.startedAt, fresh, still, exorcised };
  }

  const coverScene = results.flatMap((r) => r.scenes).filter((s) => s.spirit).sort((a, b) => b.hauntings.length - a.hauntings.length)[0];
  return {
    schema: SCHEMA,
    app,
    theme,
    baseUrl,
    startedAt: startedAt.toISOString(),
    ms: Date.now() - startedAt.getTime(),
    crew: results,
    totals,
    exorcism,
    cover: coverScene?.spiritDetail ?? coverScene?.spirit ?? null,
  };
}

/** @param {string} file @returns {Promise<Report>} */
export async function readReport(file) {
  const r = JSON.parse(await fs.readFile(file, 'utf8'));
  if (r.schema !== SCHEMA) throw new Error(`${file} is not a Ghost Crew report (schema ${r.schema})`);
  return r;
}

/**
 * Write report.json, index.html and cover.png into outDir.
 * @param {Report} report @param {string} outDir
 * @param {(r: Report) => string} renderHtml
 */
export async function writeReport(report, outDir, renderHtml) {
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(outDir, 'index.html'), renderHtml(report));
  if (report.cover) await fs.copyFile(path.join(outDir, report.cover), path.join(outDir, 'cover.png'));
  return { json: path.join(outDir, 'report.json'), html: path.join(outDir, 'index.html') };
}

/**
 * Short plain-text summary, used by the CLI and the MCP server.
 * @param {Report} r @param {string} [htmlPath]
 */
export function summarize(r, htmlPath) {
  const lines = [];
  const haunted = r.crew.filter((g) => g.state === 'haunted').length;
  const lost = r.crew.filter((g) => g.state === 'lost').length;
  lines.push(`${r.theme.name}: ${r.totals.total} haunting(s) from ${r.crew.length} ghost(s) in ${(r.ms / 1000).toFixed(1)}s` +
    ` (${haunted} haunted, ${r.crew.length - haunted - lost} quiet, ${lost} lost).`);
  lines.push(`By mood: ${MOODS.map((m) => `${r.totals[m]} ${m}`).join(', ')}.`);
  if (r.exorcism) lines.push(`Since ${r.exorcism.baselineAt}: ${r.exorcism.fresh} new, ${r.exorcism.still} still haunting, ${r.exorcism.exorcised.length} exorcised.`);
  for (const g of r.crew) {
    for (const s of g.scenes) for (const h of s.hauntings) {
      lines.push(`  [${h.mood}] ${g.ghost} — ${h.title}${h.status ? ` (${h.status})` : ''}`);
    }
    if (g.error) lines.push(`  [lost] ${g.ghost} — ${g.error}`);
  }
  if (htmlPath) lines.push(`Séance record: ${htmlPath}`);
  return lines.join('\n');
}
