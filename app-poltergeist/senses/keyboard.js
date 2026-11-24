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

defineSense('focus-visible', {
  describe: 'Tabs through the first focusable elements and reports those whose focus is invisible.',
  async run(ctx, options) {
    const limit = options.limit ?? 24;
    await startFromTop(ctx.page);
    /** @type {string[]} */
    const invisible = [];
    /** @type {string[]} */
    const names = [];
    for (let i = 0; i < limit; i++) {
      await ctx.page.keyboard.press('Tab');
      const r = await ctx.page.evaluate(() => {
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
        if (focused === resting) el.setAttribute('data-ghost-crew-invisible', id);
        return { again: false, invisible: focused === resting, id, name };
      });
      if (!r) continue;
      if (r.again) break;
      if (r.invisible) { invisible.push(`[data-ghost-crew-invisible="${r.id}"]`); names.push(r.name); }
    }
    if (invisible.length) {
      await ctx.haunt({
        mood: 'restless',
        key: 'focus-invisible',
        title: `Keyboard focus is invisible on ${invisible.length} element${invisible.length === 1 ? '' : 's'}`,
        detail: `No outline, shadow, border or colour change when focused: ${names.map((n) => `"${n}"`).join(', ')}.`,
        help: 'Never remove the focus outline without adding another visible style for :focus-visible.',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
        selectors: invisible,
      });
    }
    await ctx.page.evaluate(() => document.querySelectorAll('[data-ghost-crew-seen],[data-ghost-crew-invisible]').forEach((e) => {
      e.removeAttribute('data-ghost-crew-seen');
      e.removeAttribute('data-ghost-crew-invisible');
    }));
  },
});
