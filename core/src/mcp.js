// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadApps, requireApp } from './apps.js';
import { appNames, allSenses } from './registry.js';
import { findGhostFiles, parseGhost, loadGhosts, GhostError } from './ghost.js';
import { haunt } from './cli.js';
import { readReport, summarize } from './report/model.js';

/** @param {string} text */
const reply = (text) => ({ content: [{ type: /** @type {const} */ ('text'), text }] });

/** Resolve a path and refuse anything outside the working directory. @param {string} p */
function inside(p) {
  const abs = path.resolve(process.cwd(), p);
  if (abs !== process.cwd() && !abs.startsWith(process.cwd() + path.sep)) throw new Error(`${p} is outside the project folder`);
  return abs;
}

/** Build the server. Exported for tests. */
export async function createMcpServer() {
  await loadApps();
  const server = new McpServer({ name: 'ghost-crew', version: '1.0.0' });

  server.registerTool('list_ghosts', {
    title: 'List ghosts',
    description: 'List the *.ghost.yaml files under a folder of this project, with the page each one haunts and the senses it uses.',
    inputSchema: { dir: z.string().optional().describe('Folder to search, relative to the project. Default: the whole project.') },
  }, async ({ dir }) => {
    const files = await findGhostFiles([inside(dir ?? '.')]);
    if (!files.length) return reply('No ghost files found. Create one with write_ghost.');
    const lines = [];
    for (const f of files) {
      try {
        const g = parseGhost(await fs.readFile(f, 'utf8'), path.relative(process.cwd(), f));
        lines.push(`${g.file}: ${g.name} haunts ${g.haunts} (${g.device}) with ${g.senses.map((s) => s.name).join(', ')}`);
      } catch (e) {
        lines.push(`${path.relative(process.cwd(), f)}: INVALID ${e instanceof GhostError ? e.problems.join('; ') : String(e)}`);
      }
    }
    return reply(lines.join('\n'));
  });

  server.registerTool('check_ghost', {
    title: 'Check a ghost',
    description: 'Validate ghost YAML without opening a browser. Pass either a file path or the YAML text.',
    inputSchema: { path: z.string().optional(), yaml: z.string().optional() },
  }, async (args) => {
    const text = args.yaml ?? (args.path ? await fs.readFile(inside(args.path), 'utf8') : '');
    if (!text) return reply('Pass path or yaml.');
    try {
      const g = parseGhost(text, args.path ?? '<yaml>');
      return reply(`Valid. ${g.name} haunts ${g.haunts} on ${g.device} with senses: ${g.senses.map((s) => s.name).join(', ')}.`);
    } catch (e) {
      return reply(e instanceof GhostError ? `Invalid ghost:\n- ${e.problems.join('\n- ')}` : String(e));
    }
  });

  server.registerTool('write_ghost', {
    title: 'Write a ghost',
    description: `Validate a ghost and write it to a *.ghost.yaml file inside this project. Refuses invalid YAML and returns the problems. Known senses: ${allSenses().map((s) => s.name).join(', ')}.`,
    inputSchema: { path: z.string().describe('Relative path ending in .ghost.yaml'), yaml: z.string() },
  }, async (args) => {
    if (!args.path.endsWith('.ghost.yaml')) return reply('The path must end in .ghost.yaml');
    try {
      parseGhost(args.yaml, args.path);
    } catch (e) {
      return reply(e instanceof GhostError ? `Not written. Fix these first:\n- ${e.problems.join('\n- ')}` : String(e));
    }
    const abs = inside(args.path);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, args.yaml.endsWith('\n') ? args.yaml : `${args.yaml}\n`);
    return reply(`Wrote ${args.path}.`);
  });

  server.registerTool('summon', {
    title: 'Summon the crew',
    description: 'Run ghosts in a real Chrome against a site and write a séance record. Only haunt sites the user owns or may test. ' +
      'Without ghost files, the app runs its built-in crew against the target URL.',
    inputSchema: {
      target: z.string().describe('Base URL of the site, e.g. http://127.0.0.1:5173/'),
      app: z.enum(/** @type {[string, ...string[]]} */ (appNames())).optional().describe('poltergeist (accessibility), phantom-form (forms) or ghost-crew (plain)'),
      ghosts: z.array(z.string()).optional().describe('Ghost files or folders, relative to the project'),
      baseline: z.string().optional().describe('An earlier report.json to compare with'),
      out: z.string().optional().describe('Output folder, default ghost-reports/<app>'),
    },
  }, async (args) => {
    const appName = args.app ?? (args.ghosts?.length ? 'ghost-crew' : 'poltergeist');
    const app = requireApp(appName);
    const ghosts = args.ghosts?.length
      ? await loadGhosts(args.ghosts.map(inside))
      : app.defaultCrew ? app.defaultCrew(args.target) : null;
    if (!ghosts) return reply(`${appName} has no built-in crew. Pass ghosts.`);
    const out = inside(args.out ?? `ghost-reports/${appName}`);
    const { report, files } = await haunt({
      ghosts, appName, baseUrl: args.ghosts?.length ? args.target : undefined, out,
      baseline: args.baseline ? inside(args.baseline) : undefined, quiet: true,
    });
    return reply(summarize(report, path.relative(process.cwd(), files.html)));
  });

  server.registerTool('read_report', {
    title: 'Read a séance record',
    description: 'Summarise a report.json as plain text. Default: the newest report under ghost-reports/.',
    inputSchema: { path: z.string().optional() },
  }, async (args) => {
    let file = args.path ? inside(args.path) : null;
    if (!file) {
      const dirs = await fs.readdir(inside('ghost-reports')).catch(() => []);
      let newest = 0;
      for (const d of dirs) {
        const f = path.join(inside('ghost-reports'), d, 'report.json');
        const s = await fs.stat(f).catch(() => null);
        if (s && s.mtimeMs > newest) { newest = s.mtimeMs; file = f; }
      }
    }
    if (!file) return reply('No reports yet. Run summon first.');
    return reply(summarize(await readReport(file), path.relative(process.cwd(), path.join(path.dirname(file), 'index.html'))));
  });

  return server;
}

export async function startMcpServer() {
  const server = await createMcpServer();
  await server.connect(new StdioServerTransport());
}
