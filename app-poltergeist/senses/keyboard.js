// @ts-check
import { defineSense } from '../../core/index.js';

const MARK = 'data-ghost-crew-focused';

/** Reset focus to the top of the document so Tab starts from the beginning. */
async function startFromTop(page) {
  await page.evaluate(() => {
    /** @type {HTMLElement | null} */ (document.activeElement)?.blur?.();
    window.scrollTo(0, 0);
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    document.body.removeAttribute('tabindex');
  });
}

defineSense('keyboard-reach', {
  describe: 'Presses Tab through the page and reports targets the keyboard never reaches.',
  async run(ctx, options) {
    const targets = [].concat(options.targets ?? []);
    const limit = options.limit ?? 60;
    await startFromTop(ctx.page);
    for (let i = 0; i < limit; i++) {
      await ctx.page.keyboard.press('Tab');
      const done = await ctx.page.evaluate((mark) => {
        const a = document.activeElement;
        if (!a || a === document.body) return true;
        if (a.hasAttribute(mark)) return true; // wrapped around to the start
        a.setAttribute(mark, '');
        return false;
      }, MARK);
      if (done && i > 0) break;
    }
    ctx.tally('tab stops', await ctx.page.locator(`[${MARK}]`).count());
    if (!targets.length) {
      // No targets given: look for things that look clickable but never got focus.
      const lookalikes = await ctx.page.evaluate((mark) => {
        const focusable = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
        return [...document.body.querySelectorAll('*')].filter((e) => {
          const s = getComputedStyle(e);
          if (s.display === 'none' || s.visibility === 'hidden' || e.getBoundingClientRect().width === 0) return false;
          const looksClickable = e.hasAttribute('onclick') || s.cursor === 'pointer';
          if (!looksClickable || e.matches(focusable) || e.closest(focusable) || e.querySelector(focusable) || e.hasAttribute(mark)) return false;
          const parent = e.parentElement;
          return !(parent && getComputedStyle(parent).cursor === 'pointer' && !parent.matches(focusable));
        }).slice(0, 6).map((e, i) => {
          e.setAttribute('data-ghost-crew-lookalike', String(i));
          return { sel: `[data-ghost-crew-lookalike="${i}"]`, name: (/** @type {HTMLElement} */ (e).innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 40) };
        });
      }, MARK);
      for (const l of lookalikes) {
        await ctx.haunt({
          mood: 'wrathful',
          key: `lookalike::${l.name}`,
          title: `"${l.name}" looks clickable but cannot be reached with the keyboard`,
          help: 'Use a real <button> or <a href> so keyboard and switch users can activate it.',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
          selectors: [l.sel],
        });
      }
    }
    for (const target of targets) {
      const el = await ctx.locate(target);
      if (!el) {
        await ctx.haunt({ mood: 'restless', key: `missing::${target}`, title: `Could not find "${target}" on the page` });
        continue;
      }
      const reached = await el.evaluate((e, mark) => e.matches(`[${mark}]`) || !!e.querySelector(`[${mark}]`) || !!e.closest(`[${mark}]`), MARK);
      if (!reached) {
        await ctx.haunt({
          mood: 'wrathful',
          key: target,
          title: `"${target}" cannot be reached with the keyboard`,
          detail: 'Pressing Tab through the whole page never put focus on it, so keyboard and switch users cannot use it.',
          help: 'Use a real <button> or <a href>, or give the element tabindex="0" plus Enter and Space handlers.',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
          locator: el,
        });
      }
    }
    await ctx.page.evaluate((mark) => document.querySelectorAll(`[${mark}]`).forEach((e) => e.removeAttribute(mark)), MARK);
  },
});

/** Stops motion and hides the text caret, so two photographs differ only by the focus style. */
const STILL = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}';

defineSense('focus-visible', {
  describe: 'Tabs through the first focusable elements and reports those whose focus changes nothing on screen.',
  async run(ctx, options) {
    const limit = options.limit ?? 24;
    const page = ctx.page;
    await startFromTop(page);
    const still = await page.addStyleTag({ content: STILL }).catch(() => null);
    /** @type {string[]} */
    const invisible = [];
    /** @type {string[]} */
    const names = [];
    for (let i = 0; i < limit; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const el = /** @type {HTMLElement | null} */ (document.activeElement);
        if (!el || el === document.body) return null;
        const snap = () => {
          const s = getComputedStyle(el);
          const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` : 'none';
          return [outline, s.boxShadow, s.borderColor, s.backgroundColor, s.color, s.textDecorationLine].join('|');
        };
        const focused = snap();
        el.blur();
        const resting = snap();
        el.focus();
        if (el.dataset.ghostCrewSeen) return { again: true };
        el.dataset.ghostCrewSeen = '1';
        const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().slice(0, 40);
        const id = `gc-focus-${Math.random().toString(36).slice(2, 8)}`;
        el.setAttribute('data-ghost-crew-focus', id);
        if (focused !== resting) return { again: false, id, name, clip: null };
        // Its own style did not change. Many sites draw focus on a nearby element instead
        // (an underline, a halo), so measure the area around it for a photograph.
        const small = el.getBoundingClientRect();
        const box = small.width < 4 || small.height < 4 ? (/** @type {HTMLInputElement} */ (el).labels?.[0] ?? el.parentElement ?? el) : el;
        box.scrollIntoView({ block: 'center', inline: 'nearest' });
        const b = box.getBoundingClientRect();
        const x = Math.max(0, b.left - 8), y = Math.max(0, b.top - 8);
        return { again: false, id, name, clip: { x, y, width: Math.min(innerWidth, b.right + 8) - x, height: Math.min(innerHeight, b.bottom + 8) - y } };
      });
      if (!r) continue;
      if (r.again) break;
      if (r.clip && !(await changesOnScreen(page, `[data-ghost-crew-focus="${r.id}"]`, r.clip))) {
        invisible.push(`[data-ghost-crew-focus="${r.id}"]`);
        names.push(r.name);
      }
    }
    if (invisible.length) {
      await ctx.haunt({
        mood: 'restless',
        key: 'focus-invisible',
        title: `Keyboard focus is invisible on ${invisible.length} element${invisible.length === 1 ? '' : 's'}`,
        detail: `Nothing on screen changes when they take focus, on them or around them: ${names.map((n) => `"${n}"`).join(', ')}.`,
        help: 'Never remove the focus outline without adding another visible style for :focus-visible.',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
        selectors: invisible,
      });
    }
    await still?.evaluate((e) => e.remove()).catch(() => {});
    await page.evaluate(() => document.querySelectorAll('[data-ghost-crew-seen],[data-ghost-crew-focus]').forEach((e) => {
      e.removeAttribute('data-ghost-crew-seen');
      e.removeAttribute('data-ghost-crew-focus');
    }));
  },
});

/**
 * Photograph the area around the focused element, blur it, photograph again and give focus back.
 * @param {import('playwright-core').Page} page @param {string} sel
 * @param {{ x: number, y: number, width: number, height: number }} clip
 */
async function changesOnScreen(page, sel, clip) {
  if (clip.width < 1 || clip.height < 1) return false;
  const focused = await page.screenshot({ clip });
  await page.evaluate((s) => /** @type {HTMLElement | null} */ (document.querySelector(s))?.blur(), sel);
  const resting = await page.screenshot({ clip });
  await page.evaluate((s) => /** @type {HTMLElement | null} */ (document.querySelector(s))?.focus(), sel);
  return !focused.equals(resting);
}
