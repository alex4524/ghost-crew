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
      return res.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help, description: v.description, helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({ target: n.target.filter((x) => typeof x === 'string').join(' '), summary: n.failureSummary ?? '' })),
      }));
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
