// @ts-check
import { defineSense } from '../registry.js';
import { findOverflow, findBrokenCharacters, findText } from './page-probes.js';

defineSense('text-visible', {
  describe: 'Expects some text to be visible on the page.',
  async run(ctx, options) {
    const text = typeof options === 'string' ? options : options.text;
    const visible = await ctx.page.getByText(text).first().isVisible().catch(() => false);
    if (!visible) {
      await ctx.haunt({ mood: 'restless', key: text, title: `Expected text never appeared: "${text}"` });
    }
  },
});

defineSense('text-absent', {
  describe: 'Reports text matching a pattern, such as NaN or undefined.',
  async run(ctx, options) {
    const patterns = [].concat(typeof options === 'string' ? options : options.patterns ?? options.pattern ?? []);
    for (const p of patterns) {
      const hit = await findText(ctx.page, p);
      if (hit) {
        await ctx.haunt({ mood: 'restless', key: p, title: `Page shows text it should never show: "${hit.match}"`, boxes: [hit.box] });
      }
    }
  },
});

defineSense('console-clean', {
  describe: 'Reports uncaught errors and console errors seen during the walk.',
  async run(ctx) {
    for (const e of new Set(ctx.events.pageErrors)) {
      await ctx.haunt({ mood: 'wrathful', key: `pageerror::${e}`, title: `Uncaught error: ${e}`, help: 'An uncaught error usually means a button or feature silently stopped working.' });
    }
    for (const e of new Set(ctx.events.consoleErrors)) {
      await ctx.haunt({ mood: 'mischievous', key: `console::${e}`, title: `Console error: ${e}` });
    }
  },
});

defineSense('requests-ok', {
  describe: 'Reports requests that failed or returned 4xx/5xx.',
  async run(ctx) {
    for (const r of new Set(ctx.events.failedRequests)) {
      await ctx.haunt({ mood: 'restless', key: r, title: `Request failed: ${r}` });
    }
  },
});

defineSense('no-broken-images', {
  describe: 'Reports images that did not load.',
  async run(ctx) {
    const broken = await ctx.page.evaluate(() => [...document.images]
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => {
        const r = i.getBoundingClientRect();
        return { src: i.getAttribute('src') ?? '', box: { x: r.left + scrollX, y: r.top + scrollY, w: Math.max(r.width, 24), h: Math.max(r.height, 24) } };
      }));
    for (const b of broken) {
      await ctx.haunt({ mood: 'restless', key: b.src, title: `Image failed to load: ${b.src}`, boxes: [b.box] });
    }
  },
});

defineSense('no-overflow', {
  describe: 'Reports a page that scrolls sideways and text that spills out of its box.',
  async run(ctx) {
    const o = await findOverflow(ctx.page);
    if (o.pageWidth > o.viewport + 1) {
      await ctx.haunt({
        mood: 'restless',
        key: 'page-scrolls-sideways',
        title: `Page scrolls sideways on a ${o.viewport}px wide screen (content is ${o.pageWidth}px)`,
        boxes: o.wide.map((w) => w.box),
        help: 'Let wide content wrap or scroll inside its own container.',
      });
    }
    if (o.spills.length) {
      await ctx.haunt({
        mood: 'mischievous',
        key: 'text-spills',
        title: `Text spills out of its box${o.spills.length > 1 ? ` in ${o.spills.length} places` : ''}`,
        detail: o.spills.map((s) => `"${s.text}" (${s.path})`).join(', '),
        boxes: o.spills.map((s) => s.box),
      });
    }
  },
});

defineSense('broken-characters', {
  describe: 'Reports replacement characters and split emoji in visible text.',
  async run(ctx) {
    const hits = await findBrokenCharacters(ctx.page);
    if (hits.length) {
      await ctx.haunt({ mood: 'restless', key: 'broken-characters', title: `Page shows broken characters in ${hits.length} place(s)`, boxes: hits.map((h) => h.box) });
    }
  },
});
