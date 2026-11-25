// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadApps, requireApp, PACKAGE_ROOT } from './apps.js';
import { loadGhosts, findGhostFiles, parseGhost, GhostError, ghostTemplate, ghostFileName } from './ghost.js';
import { allSenses } from './registry.js';
import { summon } from './runner.js';
import { buildReport, writeReport, readReport, summarize, MOODS } from './report/model.js';
import { renderReportHtml } from './report/html.js';
import { NoBrowserError } from './browser.js';
import { serveStatic } from './serve.js';
import { t, moodColor, err, pad } from './term.js';

/** @typedef {import('./types.js').Ghost} Ghost */

const VERSION = JSON.parse(await fs.readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')).version;

/**
 * Minimal flag parser: --key value, --flag, positionals.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const flags = {};
  /** @type {string[]} */
  const rest = [];
  const booleans = new Set(['json', 'headed', 'help', 'quiet', 'version']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, inline] = a.slice(2).split('=', 2);
      if (inline !== undefined) flags[k] = inline;
      else if (booleans.has(k)) flags[k] = true;
      else flags[k] = argv[++i] ?? '';
    } else if (a === '-h') flags.help = true;
    else rest.push(a);
  }
  return { flags, rest };
}

/**
 * Summon ghosts, write the séance record, print a summary.
 * @param {{ ghosts: Ghost[], appName: string, baseUrl?: string, out: string, baseline?: string,
 *   crewSize?: number, failOn?: string, json?: boolean, headed?: boolean, quiet?: boolean, wallWaitMs?: number,
 *   publicUrl?: { from: string, to: string } }} o
 */
export async function haunt(o) {
  const app = requireApp(o.appName);
  const quiet = o.quiet || o.json;
  const log = quiet ? () => {} : err;
  const baseline = o.baseline ? await readReport(o.baseline).catch((e) => { log(t.dim(`  (baseline ignored: ${e.message})`)); return null; }) : null;
  await fs.rm(path.join(o.out, 'photos'), { recursive: true, force: true });

  const target = o.baseUrl ?? o.ghosts[0]?.haunts ?? '';
  if (target && !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(target)) {
    log(t.dim(`  Only haunt sites you own or have permission to test: ${target}`));
  }
  log('');
  log(`  ${t.teal('✦')} ${t.bold('Ghost Crew')} ${t.dim('/')} ${t.bold(app.theme.name)}`);
  log(`  Summoning ${o.ghosts.length} ghost${o.ghosts.length === 1 ? '' : 's'}${target ? ` against ${t.italic(target)}` : ''}`);
  log('');

  const startedAt = new Date();
  const results = await summon(o.ghosts, {
    baseUrl: o.baseUrl,
    crewSize: o.crewSize ?? 4,
    outDir: o.out,
    headless: !o.headed,
    wallWaitMs: o.wallWaitMs,
    onEvent: (e) => {
      if (e.type !== 'done' || !e.result) return;
      const r = e.result;
      const n = r.scenes.reduce((a, s) => a + s.hauntings.length, 0);
      const counts = MOODS.map((m) => {
        const c = r.scenes.reduce((a, s) => a + s.hauntings.filter((h) => h.mood === m).length, 0);
        return c ? moodColor[m](`${c} ${m}`) : '';
      }).filter(Boolean).join('  ');
      const mark = r.state === 'lost' ? t.amber('✕') : n ? t.teal('✦') : t.dim('·');
      const what = r.state === 'lost' ? t.amber(`lost: ${r.error}`) : n ? `${t.bold(`${n} haunting${n === 1 ? '' : 's'}`)}  ${counts}` : t.dim('found nothing');
      log(`  ${mark} ${pad(r.ghost, 30)} ${what}  ${t.dim(`${(r.ms / 1000).toFixed(1)}s`)}`);
    },
  });

  const report = buildReport({ app: app.name, theme: app.theme, baseUrl: o.baseUrl, startedAt, results, baseline, publicUrl: o.publicUrl });
  const files = await writeReport(report, o.out, renderReportHtml);
  const failRank = o.failOn === 'none' ? -1 : MOODS.indexOf(/** @type {any} */ (o.failOn ?? 'restless'));
  const failing = failRank < 0 ? 0 : results.flatMap((r) => r.scenes.flatMap((s) => s.hauntings)).filter((h) => MOODS.indexOf(h.mood) <= failRank).length;

  if (o.json) {
    process.stdout.write(`${JSON.stringify({ report: files.json, html: files.html, totals: report.totals, exorcism: report.exorcism && { ...report.exorcism, exorcised: report.exorcism.exorcised.length } })}\n`);
  } else if (!quiet) {
    log('');
    const total = report.totals.total;
    const lost = results.filter((r) => r.state === 'lost').length;
    const empty = lost ? t.amber(`Nothing haunted, but ${lost} of ${results.length} ghosts got lost`) : t.teal('The house is quiet');
    log(`  ${total ? t.bold(`${total} haunting${total === 1 ? '' : 's'}`) : empty} ${t.dim(`(${(report.ms / 1000).toFixed(1)}s)`)}`);
    if (report.exorcism) log(`  ${t.teal(`${report.exorcism.exorcised.length} exorcised`)}, ${report.exorcism.fresh} new, ${report.exorcism.still} still haunting since the last séance.`);
    log(`  Séance record: ${t.teal(path.relative(process.cwd(), files.html) || files.html)}`);
    log('');
  }
  return { report, files, exitCode: failing ? 1 : 0 };
}

/**
 * The entry point for an app's own binary (poltergeist, phantom-form).
 * @param {string} appName @param {string[]} argv
 */
export async function runAppCli(appName, argv) {
  return guard(async () => {
    await loadApps();
    const app = requireApp(appName);
    const { flags, rest } = parseArgs(argv);
    if (flags.version) { console.log(VERSION); return 0; }
    if (flags.help || !rest[0]) {
      console.log(`${app.theme.name}: ${app.theme.tagline}

Usage
  ${appName} <url> [options]

Options
  --ghosts <dir>      summon these ghost files instead of the built-in crew
  --out <dir>         where to write the séance record (default ghost-reports/${appName})
  --baseline <file>   an earlier report.json, to see what was exorcised
  --crew-size <n>     ghosts walking at once (default 4)
  --fail-on <mood>    exit 1 at or above this mood: ${MOODS.join(', ')}, none (default restless)
  --json              print a JSON summary on stdout
  --headed            show the browser while the ghosts walk`);
      return flags.help ? 0 : 2;
    }
    const url = rest[0];
    const ghosts = flags.ghosts
      ? await loadGhosts([String(flags.ghosts)])
      : /** @type {NonNullable<typeof app.defaultCrew>} */ (app.defaultCrew)(url);
    const { exitCode } = await haunt({
      ghosts, appName, baseUrl: flags.ghosts ? url : undefined,
      out: String(flags.out || `ghost-reports/${appName}`),
      baseline: flags.baseline ? String(flags.baseline) : undefined,
      crewSize: flags['crew-size'] ? Number(flags['crew-size']) : undefined,
      failOn: flags['fail-on'] ? String(flags['fail-on']) : undefined,
      json: Boolean(flags.json), headed: Boolean(flags.headed),
    });
    return exitCode;
  });
}

/** @param {string[]} argv */
export async function runCli(argv) {
  return guard(async () => {
    const { flags, rest } = parseArgs(argv);
    const [cmd, ...args] = rest;
    await loadApps(flags.plugin ? String(flags.plugin).split(',') : []);
    if (flags.version) { console.log(VERSION); return 0; }
    switch (cmd) {
      case 'haunt': {
        if (!args.length) { err('Usage: ghost-crew haunt <ghost files or folders> --base-url <url> [--app <name>]'); return 2; }
        const ghosts = await loadGhosts(args);
        const appName = String(flags.app || 'ghost-crew');
        const { exitCode } = await haunt({
          ghosts, appName, baseUrl: flags['base-url'] ? String(flags['base-url']) : undefined,
          out: String(flags.out || `ghost-reports/${appName}`),
          baseline: flags.baseline ? String(flags.baseline) : undefined,
          crewSize: flags['crew-size'] ? Number(flags['crew-size']) : undefined,
          failOn: flags['fail-on'] ? String(flags['fail-on']) : undefined,
          json: Boolean(flags.json), headed: Boolean(flags.headed),
        });
        return exitCode;
      }
      case 'check': {
        const files = await findGhostFiles(args.length ? args : ['.']);
        let bad = 0;
        for (const f of files) {
          try {
            const g = parseGhost(await fs.readFile(f, 'utf8'), f);
            err(`  ${t.teal('✓')} ${f}  ${t.dim(`${g.name}: ${g.senses.map((s) => s.name).join(', ')}`)}`);
          } catch (e) {
            bad += 1;
            err(`  ${t.wax('✕')} ${e instanceof GhostError ? e.message : String(e)}`);
          }
        }
        err(`\n  ${files.length - bad} of ${files.length} ghost file(s) are valid.`);
        return bad ? 2 : 0;
      }
      case 'new': {
        const name = args.join(' ').trim();
        if (!name) { err('Usage: ghost-crew new "The Lantern Dimmer" [--dir ghosts]'); return 2; }
        const dir = String(flags.dir || 'ghosts');
        await fs.mkdir(dir, { recursive: true });
        const file = path.join(dir, ghostFileName(name));
        if (await fs.stat(file).catch(() => null)) { err(`${file} already exists`); return 2; }
        await fs.writeFile(file, ghostTemplate(name));
        err(`  ${t.teal('✦')} Wrote ${file}. Edit "haunts" and "senses", then run: ghost-crew check ${file}`);
        return 0;
      }
      case 'senses': {
        for (const s of allSenses()) console.log(`${s.name.padEnd(18)} ${s.describe ?? ''}`);
        return 0;
      }
      case 'serve': {
        const dir = args[0] || '.';
        const s = await serveStatic(dir, Number(flags.port ?? 4173));
        err(`  Serving ${dir} at ${s.url} (Ctrl+C to stop)`);
        await new Promise(() => {});
        return 0;
      }
      case 'mcp': {
        const { startMcpServer } = await import('./mcp.js');
        await startMcpServer();
        return /** @type {number} */ (await new Promise(() => {}));
      }
      case 'summary': {
        const r = await readReport(args[0] || 'ghost-reports/ghost-crew/report.json');
        console.log(summarize(r));
        return 0;
      }
      default:
        console.log(`Ghost Crew ${VERSION}: a skeleton crew of ghosts for browser QA.

Commands
  ghost-crew haunt <ghosts...> --base-url <url> [--app <name>] [--out <dir>] [--baseline <report.json>]
  ghost-crew check [ghosts...]        validate ghost files without a browser
  ghost-crew new "<Ghost Name>"       write a starter ghost file
  ghost-crew senses                   list every sense the installed apps provide
  ghost-crew summary <report.json>    print a report as plain text
  ghost-crew serve <dir> [--port n]   serve a folder on 127.0.0.1
  ghost-crew mcp                      run the MCP server for Kiro

Apps built on the skeleton
  poltergeist <url>                   accessibility hauntings
  phantom-form <url>                  cursed inputs for forms`);
        return cmd ? 2 : 0;
    }
  });
}

/** @param {() => Promise<number>} fn */
async function guard(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NoBrowserError) { err(e.message); return 3; }
    err(`\n  ${t.wax('✕')} ${/** @type {Error} */ (e).message}`);
    return 2;
  }
}
