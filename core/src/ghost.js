// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { senseNames, getSense } from './registry.js';

/** @typedef {import('./types.js').Ghost} Ghost */
/** @typedef {import('./types.js').Step} Step */

const STEP_KINDS = ['click', 'fill', 'press', 'wait', 'scroll'];
const DEVICES = ['desktop', 'mobile'];
const TOP_KEYS = ['ghost', 'lore', 'haunts', 'device', 'steps', 'senses'];

export class GhostError extends Error {
  /** @param {string} file @param {string[]} problems */
  constructor(file, problems) {
    super(`${file}\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.file = file;
    this.problems = problems;
  }
}

/**
 * Parse and validate one ghost. Collects every problem before throwing,
 * so one run of `ghost-crew check` shows the whole list.
 * @param {string} text
 * @param {string} file
 * @returns {Ghost}
 */
export function parseGhost(text, file = '<inline>') {
  /** @type {string[]} */
  const problems = [];
  let doc;
  try {
    doc = YAML.parse(text);
  } catch (e) {
    throw new GhostError(file, [`YAML does not parse: ${/** @type {Error} */ (e).message.split('\n')[0]}`]);
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new GhostError(file, ['A ghost file must be a YAML map with keys: ghost, haunts, senses']);
  }

  for (const key of Object.keys(doc)) {
    if (!TOP_KEYS.includes(key)) problems.push(`Unknown key "${key}". Allowed: ${TOP_KEYS.join(', ')}`);
  }
  if (typeof doc.ghost !== 'string' || !doc.ghost.trim()) problems.push('"ghost" is required: the ghost\'s name, e.g. "The Lantern Dimmer"');
  if (doc.lore !== undefined && typeof doc.lore !== 'string') problems.push('"lore" must be one sentence of text');
  if (typeof doc.haunts !== 'string' || !doc.haunts.trim()) problems.push('"haunts" is required: a path like /index.html or a full URL');
  const device = doc.device ?? 'desktop';
  if (!DEVICES.includes(device)) problems.push(`"device" must be one of: ${DEVICES.join(', ')}`);

  /** @type {Step[]} */
  const steps = [];
  if (doc.steps !== undefined) {
    if (!Array.isArray(doc.steps)) problems.push('"steps" must be a list');
    else doc.steps.forEach((raw, i) => {
      const step = parseStep(raw, i, problems);
      if (step) steps.push(step);
    });
  }

  /** @type {{ name: string, options: any }[]} */
  const senses = [];
  if (!Array.isArray(doc.senses) || doc.senses.length === 0) {
    problems.push('"senses" needs at least one sense, e.g. "- axe" or "- text-visible: Welcome"');
  } else {
    doc.senses.forEach((raw, i) => {
      let name, options;
      if (typeof raw === 'string') { name = raw; options = {}; }
      else if (raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length === 1) {
        name = Object.keys(raw)[0];
        options = raw[name] ?? {};
      } else {
        problems.push(`senses[${i}] must be a sense name or a one-key map like "- axe: { impact: [critical] }"`);
        return;
      }
      if (!getSense(name)) {
        problems.push(`senses[${i}]: unknown sense "${name}". Known senses: ${senseNames().join(', ')}`);
        return;
      }
      senses.push({ name, options });
    });
  }

  if (problems.length) throw new GhostError(file, problems);
  return {
    name: doc.ghost.trim(),
    file,
    lore: doc.lore?.trim(),
    haunts: doc.haunts.trim(),
    device,
    steps,
    senses,
  };
}

/**
 * @param {any} raw @param {number} i @param {string[]} problems
 * @returns {Step | null}
 */
function parseStep(raw, i, problems) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).length !== 1) {
    problems.push(`steps[${i}] must be a one-key map, e.g. "- click: Book a room"`);
    return null;
  }
  const kind = Object.keys(raw)[0];
  const v = raw[kind];
  if (!STEP_KINDS.includes(kind)) {
    problems.push(`steps[${i}]: unknown step "${kind}". Allowed: ${STEP_KINDS.join(', ')}`);
    return null;
  }
  switch (kind) {
    case 'click':
    case 'press':
      if (typeof v !== 'string' || !v) { problems.push(`steps[${i}].${kind} needs text`); return null; }
      return { kind, target: v };
    case 'fill':
      if (!v || typeof v.field !== 'string' || v.with === undefined) {
        problems.push(`steps[${i}].fill needs { field: <label>, with: <value> }`);
        return null;
      }
      return { kind, target: v.field, value: String(v.with) };
    case 'wait':
      if (typeof v !== 'number' || v < 0 || v > 10000) { problems.push(`steps[${i}].wait must be 0-10000 milliseconds`); return null; }
      return { kind, ms: v };
    case 'scroll':
      if (typeof v !== 'string' || !v) { problems.push(`steps[${i}].scroll must be top, bottom or a target`); return null; }
      return { kind, target: v };
  }
  return null;
}

/**
 * Expand files and folders into a sorted list of *.ghost.yaml paths.
 * @param {string[]} inputs
 */
export async function findGhostFiles(inputs) {
  /** @type {string[]} */
  const out = [];
  for (const input of inputs) {
    const stat = await fs.stat(input).catch(() => null);
    if (!stat) throw new Error(`No such file or folder: ${input}`);
    if (stat.isFile()) { out.push(input); continue; }
    const entries = await fs.readdir(input, { recursive: true, withFileTypes: true });
    for (const e of entries) {
      const dir = /** @type {any} */ (e).parentPath ?? /** @type {any} */ (e).path;
      if (e.isFile() && e.name.endsWith('.ghost.yaml') && !dir.includes('node_modules')) out.push(path.join(dir, e.name));
    }
  }
  return [...new Set(out)].sort();
}

/**
 * Load every ghost under the inputs. Throws one combined error listing all bad files.
 * @param {string[]} inputs
 * @returns {Promise<Ghost[]>}
 */
export async function loadGhosts(inputs) {
  const files = await findGhostFiles(inputs);
  /** @type {Ghost[]} */
  const ghosts = [];
  /** @type {GhostError[]} */
  const errors = [];
  for (const file of files) {
    try {
      ghosts.push(parseGhost(await fs.readFile(file, 'utf8'), path.relative(process.cwd(), file) || file));
    } catch (e) {
      if (e instanceof GhostError) errors.push(e); else throw e;
    }
  }
  if (errors.length) {
    const err = new Error(`${errors.length} ghost file(s) did not validate:\n${errors.map((e) => e.message).join('\n')}`);
    /** @type {any} */ (err).ghostErrors = errors;
    throw err;
  }
  return ghosts;
}

/**
 * Resolve a ghost's `haunts` against the base URL.
 * @param {string} haunts @param {string} [baseUrl]
 */
export function resolveHaunt(haunts, baseUrl) {
  if (/^https?:\/\//i.test(haunts)) return haunts;
  if (!baseUrl) throw new Error(`"haunts: ${haunts}" is a path, so --base-url is required`);
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(haunts.replace(/^\//, ''), base).toString();
}

/**
 * A new ghost file from a name, used by `ghost-crew new` and the MCP server.
 * @param {string} name
 */
export function ghostTemplate(name) {
  const title = name.startsWith('The ') ? name : `The ${name}`;
  return `ghost: ${title}
lore: Describe in one sentence what this ghost looks for.
haunts: /index.html
steps:
  - wait: 200
senses:
  - console-clean
  - no-overflow
`;
}

/** @param {string} name */
export function ghostFileName(name) {
  return `${name.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ghost.yaml`;
}
