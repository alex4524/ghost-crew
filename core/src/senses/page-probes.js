// @ts-check
// Page probes shared by core senses and apps. Each one runs a single evaluate().

/**
 * @param {import('playwright-core').Page} page
 * @returns {Promise<{ viewport: number, pageWidth: number,
 *   wide: { box: import('../types.js').Box }[],
 *   spills: { path: string, text: string, box: import('../types.js').Box }[] }>}
 */
export function findOverflow(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const pageWidth = document.documentElement.scrollWidth;
    const box = (/** @type {Element} */ e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    };
    const pathOf = (/** @type {Element} */ e) => {
      const parts = [];
      let n = /** @type {Element | null} */ (e);
      while (n && n !== document.body && parts.length < 4) {
        let p = n.tagName.toLowerCase();
        if (n.id) { parts.unshift(`${p}#${n.id}`); break; }
        const cls = [...n.classList].slice(0, 2).join('.');
        if (cls) p += `.${cls}`;
        parts.unshift(p);
        n = n.parentElement;
      }
      return parts.join(' > ');
    };
    const all = [...document.body.querySelectorAll('*')].filter((e) => {
      const s = getComputedStyle(e);
      return s.display !== 'none' && s.visibility !== 'hidden' && !e.closest('#__ghost_crew');
    });
    const wide = [];
    if (pageWidth > vw + 1) {
      for (const e of all) {
        const r = e.getBoundingClientRect();
        if (r.right > vw + 1 && r.width > 0) {
          const parent = e.parentElement;
          if (parent && parent.getBoundingClientRect().right > vw + 1 && parent !== document.body) continue;
          wide.push({ box: box(e) });
          if (wide.length >= 6) break;
        }
      }
    }
    const spills = [];
    for (const e of all) {
      const s = getComputedStyle(e);
      if (s.overflowX !== 'visible' || s.display === 'inline') continue;
      const hasText = [...e.childNodes].some((c) => c.nodeType === 3 && (c.textContent ?? '').trim());
      if (!hasText) continue;
      if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0) {
        const r = e.getBoundingClientRect();
        spills.push({
          path: pathOf(e),
          text: (e.textContent ?? '').trim().slice(0, 40),
          box: { x: r.left + scrollX, y: r.top + scrollY, w: Math.max(r.width, e.scrollWidth), h: r.height },
        });
        if (spills.length >= 6) break;
      }
    }
    return { viewport: vw, pageWidth, wide, spills };
  });
}

/**
 * Replacement characters (U+FFFD) and lone surrogates: what a page shows when it
 * cuts an emoji in half with str[0] or substring().
 * @param {import('playwright-core').Page} page
 */
export function findBrokenCharacters(page) {
  return page.evaluate(() => {
    const bad = /\uFFFD|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const el = n.parentElement;
      if (!el || el.closest('#__ghost_crew') || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
      if (bad.test(n.textContent ?? '')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) out.push({ box: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } });
      }
      if (out.length >= 8) break;
    }
    return out;
  });
}

/**
 * The smallest visible element whose text matches a pattern.
 * @param {import('playwright-core').Page} page
 * @param {string} pattern regular expression source
 */
export function findText(page, pattern) {
  return page.evaluate((src) => {
    const re = new RegExp(src);
    const m = document.body.innerText.match(re);
    if (!m) return null;
    let best = /** @type {Element | null} */ (null);
    for (const e of document.body.querySelectorAll('*')) {
      if (e.closest('#__ghost_crew')) continue;
      const t = /** @type {HTMLElement} */ (e).innerText;
      if (t && re.test(t) && e.getBoundingClientRect().width > 0) best = e;
    }
    const r = (best ?? document.body).getBoundingClientRect();
    return { match: m[0], box: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } };
  }, pattern);
}
