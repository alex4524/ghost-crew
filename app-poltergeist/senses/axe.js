// @ts-check
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { defineSense } from '../../core/index.js';

const require = createRequire(import.meta.url);
let axeSource = '';

const MOOD = { critical: 'wrathful', serious: 'restless', moderate: 'mischievous', minor: 'faint' };
const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

defineSense('axe', {
  describe: 'Runs axe-core in the page; one haunting per broken WCAG rule, a box on every failing element.',
  async run(ctx, options) {
    axeSource ||= await fs.readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
    const impacts = options.impact ?? ['critical', 'serious', 'moderate', 'minor'];
    const tags = options.tags ?? DEFAULT_TAGS;
    await ctx.page.evaluate(axeSource);
    const violations = await ctx.page.evaluate(async (runOnly) => {
      // @ts-ignore axe is now a global in the page
      const res = await window.axe.run(document, { runOnly: { type: 'tag', values: runOnly }, resultTypes: ['violations'] });
      // WCAG 1.4.3 exempts text that is part of a logo, such as a product name beside its logo image.
      const LOGO_WORD = /^(.*[-_])?(logo|logotype|wordmark)([-_].*)?$/i;
      const LOGO_TEXT = /logo|wordmark/i;
      /** @param {Element} e */
      const named = (e) => (e.id + ' ' + (e.getAttribute('class') ?? '')).split(/\s+/).some((w) => LOGO_WORD.test(w))
        || ['alt', 'aria-label', 'title', 'src'].some((a) => LOGO_TEXT.test(e.getAttribute(a) ?? ''));
      /** @param {string} sel */
      const isLogo = (sel) => {
        /** @type {Element | null} */
        let e = null;
        try { e = sel ? document.querySelector(sel) : null; } catch { return false; }
        for (let i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) {
          if ((/** @type {HTMLElement} */ (e).innerText ?? '').trim().length > 40) return false;
          if (named(e) || [...e.querySelectorAll('img,svg,[role="img"]')].some(named)) return true;
        }
        return false;
      };
      return res.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help, description: v.description, helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({ target: n.target.filter((x) => typeof x === 'string').join(' '), summary: n.failureSummary ?? '' }))
          .filter((n) => v.id !== 'color-contrast' || !isLogo(n.target)),
      })).filter((v) => v.nodes.length);
    }, tags);
    for (const v of violations) {
      if (!impacts.includes(v.impact)) continue;
      const first = v.nodes[0]?.summary.split('\n').slice(1).join(' ').trim();
      await ctx.haunt({
        mood: /** @type {any} */ (MOOD[/** @type {keyof MOOD} */ (v.impact)] ?? 'faint'),
        key: v.id,
        title: v.help,
        detail: `${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'} affected. ${first ?? ''}`.trim(),
        help: v.description,
        helpUrl: v.helpUrl,
        selectors: v.nodes.map((n) => n.target).filter(Boolean),
      });
    }
  },
});
