// @ts-check
import { launchChrome } from './browser.js';
import { locate } from './locate.js';
import { resolveHaunt } from './ghost.js';
import { getSense } from './registry.js';
import { photograph } from './photograph.js';

/**
 * @typedef {import('./types.js').Ghost} Ghost
 * @typedef {import('./types.js').GhostResult} GhostResult
 * @typedef {import('./types.js').Scene} Scene
 * @typedef {import('./types.js').HauntInput} HauntInput
 * @typedef {import('./types.js').SenseContext} SenseContext
 * @typedef {import('playwright-core').Page} Page
 * @typedef {import('playwright-core').Locator} Locator
 * @typedef {{ consoleErrors: string[], pageErrors: string[], failedRequests: string[] }} Events
 * @typedef {{ page: Page, events: Events, scene: Scene, id: string }} SceneRun
 * @typedef {{ ghost: Ghost, result: GhostResult, context: import('playwright-core').BrowserContext, outDir: string, id0: string, sceneCount: number }} GhostRun
 */

const DEVICES = {
  desktop: { viewport: { width: 1280, height: 800 } },
  mobile: {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
};

const KEY_NAMES = /^(Tab|Enter|Escape|Space|Backspace|Delete|Home|End|PageUp|PageDown|Arrow(Up|Down|Left|Right)|Shift\+Tab|F\d{1,2})$/;

/**
 * Summon a crew: one Chrome, one isolated context per ghost, `crewSize` at a time.
 * @param {Ghost[]} ghosts
 * @param {{ baseUrl?: string, crewSize?: number, outDir: string, headless?: boolean,
 *   onEvent?: (e: { type: 'start' | 'done', index: number, ghost: Ghost, result?: GhostResult }) => void }} opts
 * @returns {Promise<GhostResult[]>}
 */
export async function summon(ghosts, opts) {
  const { baseUrl, crewSize = 4, outDir, headless = true, onEvent = () => {} } = opts;
  const browser = await launchChrome({ headless });
  /** @type {GhostResult[]} */
  const results = new Array(ghosts.length);
  let next = 0;
  const worker = async () => {
    while (next < ghosts.length) {
      const index = next++;
      const ghost = ghosts[index];
      onEvent({ type: 'start', index, ghost });
      const result = await walkGhost(browser, ghost, index, { baseUrl, outDir });
      results[index] = result;
      onEvent({ type: 'done', index, ghost, result });
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.max(1, Math.min(crewSize, ghosts.length)) }, worker));
  } finally {
    await browser.close().catch(() => {});
  }
  return results;
}

/**
 * @param {import('playwright-core').Browser} browser
 * @param {Ghost} ghost
 * @param {number} index
 * @param {{ baseUrl?: string, outDir: string }} opts
 * @returns {Promise<GhostResult>}
 */
async function walkGhost(browser, ghost, index, { baseUrl, outDir }) {
  const t0 = Date.now();
  /** @type {GhostResult} */
  const result = {
    ghost: ghost.name, file: ghost.file, lore: ghost.lore, url: '', device: ghost.device,
    state: 'quiet', ms: 0, scenes: [], tally: {},
  };
  /** @type {import('playwright-core').BrowserContext | undefined} */
  let context;
  try {
    result.url = resolveHaunt(ghost.haunts, baseUrl);
    context = await browser.newContext({ ...DEVICES[ghost.device], deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
    /** @type {GhostRun} */
    const run = { ghost, result, context, outDir, id0: `${String(index + 1).padStart(2, '0')}-${slug(ghost.name)}`, sceneCount: 0 };
    const main = await openScene(run, 'The walk');
    let walked = true;
    try {
      await walkSteps(main.page, ghost.steps);
    } catch (e) {
      walked = false;
      result.state = 'lost';
      result.error = `Lost during the walk: ${message(e)}`;
      await addHaunting(run, main, { mood: 'restless', title: `The walk could not finish: ${message(e)}`, key: 'lost' }, 'walk');
    }
    if (walked) {
      for (const use of ghost.senses) {
        const def = getSense(use.name);
        if (!def) continue;
        try {
          await def.run(makeCtx(run, main, use.name), use.options ?? {});
        } catch (e) {
          await addHaunting(run, main, { mood: 'faint', title: `Sense "${use.name}" could not finish`, detail: message(e), key: 'sense-error' }, use.name);
        }
      }
    }
    await finishScene(run, main);
  } catch (e) {
    result.state = 'lost';
    result.error = message(e);
  } finally {
    await context?.close().catch(() => {});
  }
  const haunted = result.scenes.filter((s) => s.hauntings.length);
  result.scenes = haunted.length ? haunted : result.scenes.slice(0, 1);
  if (result.state !== 'lost') result.state = haunted.length ? 'haunted' : 'quiet';
  result.ms = Date.now() - t0;
  return result;
}

/**
 * @param {GhostRun} run @param {string} label
 * @returns {Promise<SceneRun>}
 */
async function openScene(run, label) {
  const page = await run.context.newPage();
  /** @type {Events} */
  const events = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on('console', (m) => { if (m.type() === 'error') events.consoleErrors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => events.pageErrors.push(String(e?.message ?? e).slice(0, 300)));
  page.on('requestfailed', (r) => events.failedRequests.push(`${r.method()} ${shortUrl(r.url())} (${r.failure()?.errorText ?? 'failed'})`));
  page.on('response', (r) => { if (r.status() >= 400) events.failedRequests.push(`${r.request().method()} ${shortUrl(r.url())} (${r.status()})`); });
  /** @type {Scene} */
  const scene = { label, url: run.result.url, hauntings: [] };
  run.result.scenes.push(scene);
  const id = `${run.id0}-${++run.sceneCount}`;
  await page.goto(run.result.url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
  return { page, events, scene, id };
}

/** @param {GhostRun} run @param {SceneRun} sc */
async function finishScene(run, sc) {
  try {
    if (sc.scene.hauntings.length) await photograph(sc.page, sc.scene, run.outDir, sc.id);
  } catch (e) {
    sc.scene.hauntings.forEach((h) => { h.detail = [h.detail, `(photograph failed: ${message(e)})`].filter(Boolean).join(' '); });
  } finally {
    await sc.page.close().catch(() => {});
  }
}

/**
 * @param {Page} page
 * @param {import('./types.js').Step[]} steps
 */
export async function walkSteps(page, steps) {
  for (const s of steps) {
    switch (s.kind) {
      case 'click': {
        const l = await locate(page, /** @type {string} */ (s.target));
        if (!l) throw new Error(`could not find "${s.target}" to click`);
        await l.click({ timeout: 5000 });
        break;
      }
      case 'fill': {
        const l = await locate(page, /** @type {string} */ (s.target));
        if (!l) throw new Error(`could not find the field "${s.target}"`);
        await l.fill(/** @type {string} */ (s.value), { timeout: 5000 });
        break;
      }
      case 'press': {
        const t = /** @type {string} */ (s.target);
        if (KEY_NAMES.test(t)) await page.keyboard.press(t);
        else await page.keyboard.type(t);
        break;
      }
      case 'wait':
        await page.waitForTimeout(/** @type {number} */ (s.ms));
        break;
      case 'scroll': {
        const t = /** @type {string} */ (s.target);
        if (t === 'top' || t === 'bottom') {
          await page.evaluate((where) => window.scrollTo(0, where === 'top' ? 0 : document.documentElement.scrollHeight), t);
        } else {
          const l = await locate(page, t);
          if (!l) throw new Error(`could not find "${t}" to scroll to`);
          await l.scrollIntoViewIfNeeded({ timeout: 5000 });
        }
        break;
      }
    }
    await page.waitForTimeout(60);
  }
}

/**
 * @param {GhostRun} run @param {SceneRun} sc @param {string} senseName
 * @returns {SenseContext}
 */
function makeCtx(run, sc, senseName) {
  return {
    page: sc.page,
    ghost: run.ghost,
    url: run.result.url,
    events: sc.events,
    locate: (t) => locate(sc.page, t),
    haunt: (h) => addHaunting(run, sc, h, senseName),
    scene: async (label, fn) => {
      const sub = await openScene(run, label);
      try {
        await walkSteps(sub.page, run.ghost.steps);
        await fn(makeCtx(run, sub, senseName));
      } catch (e) {
        await addHaunting(run, sub, { mood: 'faint', title: `Scene "${label}" could not finish`, detail: message(e), key: `scene-error::${label}` }, senseName);
      } finally {
        await finishScene(run, sub);
      }
    },
    tally: (name, n = 1) => { run.result.tally[name] = (run.result.tally[name] ?? 0) + n; },
  };
}

/**
 * Record a haunting and measure its boxes right away, before the page moves on.
 * @param {GhostRun} run @param {SceneRun} sc @param {HauntInput} h @param {string} senseName
 */
async function addHaunting(run, sc, h, senseName) {
  /** @type {import('./types.js').Box[]} */
  let boxes = h.boxes ?? [];
  try {
    if (!boxes.length && h.locator) boxes = await measure(h.locator);
    if (!boxes.length && h.target) {
      const l = await locate(sc.page, h.target);
      if (l) boxes = await measure(l);
    }
    if (!boxes.length && h.selectors?.length) {
      boxes = await sc.page.evaluate((sels) => sels
        .flatMap((s) => { try { return [...document.querySelectorAll(s)]; } catch { return []; } })
        .slice(0, 16)
        .map((e) => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })
        .filter((b) => b.w > 0 && b.h > 0), h.selectors);
    }
  } catch { /* evidence is best effort; the haunting still counts */ }
  const key = `${run.ghost.name}::${senseName}::${h.key ?? h.title}`;
  if (sc.scene.hauntings.some((x) => x.key === key)) return;
  sc.scene.hauntings.push({
    n: sc.scene.hauntings.length + 1,
    key,
    sense: senseName,
    mood: h.mood,
    title: h.title,
    ...(h.detail ? { detail: h.detail } : {}),
    ...(h.help ? { help: h.help } : {}),
    ...(h.helpUrl ? { helpUrl: h.helpUrl } : {}),
    boxes: boxes.map((b) => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) })),
    scene: sc.scene.label,
  });
}

/** @param {Locator} l */
async function measure(l) {
  const b = await l.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  }, null, { timeout: 2000 });
  return b.w > 0 && b.h > 0 ? [b] : [];
}

/** @param {unknown} e */
export function message(e) {
  return String(/** @type {any} */ (e)?.message ?? e).split('\n')[0].replace(/\u001b\[[0-9;]*m/g, '').slice(0, 240);
}

/** @param {string} s */
export function slug(s) {
  return s.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'ghost';
}

/** @param {string} u */
function shortUrl(u) {
  try {
    const x = new URL(u);
    return `${x.pathname}${x.search}`.slice(0, 120);
  } catch {
    return u.slice(0, 120);
  }
}
