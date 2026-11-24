// @ts-check
import { defineSense, findOverflow, findBrokenCharacters, findText } from '../../core/index.js';
import { CURSES, AUTO } from '../curses.js';

const DEFAULT_FORBID = ['NaN', '\\bundefined\\b', '\\[object Object\\]', 'Infinity'];
const SAMPLE = { text: 'Ada Lovelace', email: 'ada@example.com', number: '2', tel: '+1 555 0100', search: 'lanterns', textarea: 'A quiet room, please.' };
const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Zero-config: the first form's fields, curses picked by input type.
 * @param {import('playwright-core').Page} page
 */
async function autoPlan(page) {
  const fields = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return [];
    return [...form.querySelectorAll('input, textarea')].filter((e) => {
      const el = /** @type {HTMLInputElement} */ (e);
      const t = el.tagName === 'TEXTAREA' ? 'textarea' : (el.type || 'text');
      return ['text', 'email', 'number', 'search', 'tel', 'textarea'].includes(t) && el.getBoundingClientRect().width > 0;
    }).map((e) => {
      const el = /** @type {HTMLInputElement} */ (e);
      const label = el.labels?.[0]?.innerText.trim() || el.getAttribute('aria-label') || el.placeholder;
      const hints = `${el.name} ${el.autocomplete} ${label}`.toLowerCase();
      let type = el.tagName === 'TEXTAREA' ? 'textarea' : (el.type || 'text');
      if (type === 'text' && /mail/.test(hints)) type = 'email';
      if (type === 'text' && /\b(phone|tel)\b/.test(hints)) type = 'tel';
      return { type, target: label || (el.name ? `css:[name="${el.name}"]` : `css:#${el.id}`) };
    });
  });
  return fields;
}

defineSense('cursed-inputs', {
  describe: 'Types cursed input into form fields one at a time and photographs what breaks.',
  async run(ctx, options) {
    const forbid = options.forbid ?? DEFAULT_FORBID;
    const success = options.success;
    const submit = options.submit ?? 'css:form [type=submit], form button:not([type=button])';
    /** @type {Record<string, string>} */
    let valid = options.valid ?? {};
    /** @type {{ field: string, curse: string }[]} */
    let plan;
    if (options.fields) {
      plan = Object.entries(options.fields).flatMap(([field, curses]) => [].concat(curses).map((curse) => ({ field, curse })));
    } else {
      const fields = await autoPlan(ctx.page);
      if (!fields.length) {
        await ctx.haunt({ mood: 'faint', key: 'no-form', title: 'No form with text, email or number fields was found on this page' });
        return;
      }
      valid = Object.fromEntries(fields.map((f) => [f.target, SAMPLE[/** @type {keyof SAMPLE} */ (f.type)] ?? 'Ada']));
      plan = fields.flatMap((f) => (AUTO[/** @type {keyof AUTO} */ (f.type)] ?? AUTO.text).map((curse) => ({ field: f.target, curse })));
    }
    for (const step of plan) {
      if (!CURSES[step.curse]) throw new Error(`Unknown curse "${step.curse}". Known curses: ${Object.keys(CURSES).join(', ')}`);
    }

    for (const { field, curse: name } of plan) {
      const curse = CURSES[name];
      const fieldName = field.startsWith('css:') ? 'this field' : `"${field}"`;
      await ctx.scene(`${field.replace(/^css:/, '')} ← ${curse.label}`, async (s) => {
        const errorsBefore = s.events.pageErrors.length;
        for (const [f, v] of Object.entries(valid)) {
          if (f === field) continue;
          const l = await s.locate(f);
          if (l) await l.fill(String(v), { timeout: 3000 });
        }
        const input = await s.locate(field);
        if (!input) throw new Error(`could not find the field ${fieldName}`);
        await input.fill(curse.value, { timeout: 3000 });
        const button = await s.locate(submit);
        if (button) await button.click({ timeout: 3000 });
        else await input.press('Enter');
        await s.page.waitForTimeout(400);

        let found = 0;
        /** @param {import('../../core/src/types.js').HauntInput} h */
        const haunt = async (h) => { found += 1; await s.haunt(h); };
        const key = (/** @type {string} */ what) => `${field}::${name}::${what}`;

        for (const e of new Set(s.events.pageErrors.slice(errorsBefore))) {
          await haunt({
            mood: 'wrathful', key: key('crash'), target: field,
            title: `Typing ${curse.label} into ${fieldName} crashes the page`,
            detail: `Uncaught error: ${e}. The code after this point never ran, so part of the page is now broken.`,
            help: 'Guard the code that formats this value, and show a validation message instead of throwing.',
          });
        }
        if (curse.markup) {
          const fired = await s.page.evaluate(() => /** @type {any} */ (window).__phantomFired === 1);
          if (fired) {
            const box = await s.page.evaluate(() => {
              const img = document.querySelector('img[src="x"]');
              const e = img?.closest('p, div, section, li, span') ?? img;
              if (!e) return null;
              const r = e.getBoundingClientRect();
              return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
            });
            await haunt({
              mood: 'wrathful', key: key('script'), ...(box ? { boxes: [box] } : { target: field }),
              title: `${cap(fieldName)} runs HTML as code (script injection)`,
              detail: 'The page inserted the value with innerHTML, so the image\'s onerror script ran. Anyone who controls this value can run script in a visitor\'s browser.',
              help: 'Insert visitor text with textContent, or escape it before building HTML.',
              helpUrl: 'https://owasp.org/www-community/attacks/xss/',
            });
          }
        }
        const o = await findOverflow(s.page);
        if (o.pageWidth > o.viewport + 1) {
          await haunt({ mood: 'restless', key: key('sideways'), title: `${cap(curse.label)} in ${fieldName} makes the page scroll sideways`, boxes: o.wide.map((w) => w.box) });
        }
        if (o.spills.length) {
          await haunt({
            mood: 'mischievous', key: key('spill'), boxes: o.spills.map((sp) => sp.box),
            title: `${cap(curse.label)} in ${fieldName} spills out of its box${o.spills.length > 1 ? ` in ${o.spills.length} places` : ''}`,
            detail: `Overflowing text: ${o.spills.map((sp) => `"${sp.text}"`).join(', ')}`,
            help: 'Let long words wrap with overflow-wrap: anywhere, or give the box room to grow.',
          });
        }
        const broken = await findBrokenCharacters(s.page);
        if (broken.length) {
          await haunt({
            mood: 'restless', key: key('broken'), boxes: broken.map((b) => b.box),
            title: `${cap(curse.label)} in ${fieldName} shows up as broken characters`,
            detail: 'Code cut the text between the two halves of a character, usually with value[0] or substring().',
            help: 'Use Array.from(value)[0] or Intl.Segmenter to take the first character.',
          });
        }
        if (success) {
          const ok = await s.page.getByText(success).first().isVisible().catch(() => false);
          if (curse.blank && ok) {
            await haunt({ mood: 'restless', key: key('blank'), target: success, title: `The form accepts ${fieldName} made of only spaces`, help: 'Trim the value before checking that it is required.' });
          }
          if (curse.valid && !ok) {
            await haunt({
              mood: 'restless', key: key('rejected'), target: field,
              title: `The form rejects a real ${field.replace(/^css:/, '').toLowerCase()}: ${curse.value}`,
              detail: 'This is valid input from a real person, and the form refused it.',
              help: 'Loosen the validation pattern; for email, let the browser\'s type="email" check do the work.',
            });
          }
        }
        for (const p of forbid) {
          const hit = await findText(s.page, p);
          if (hit) await haunt({ mood: 'restless', key: key(`forbid::${p}`), boxes: [hit.box], title: `After ${curse.label} in ${fieldName}, the page shows "${hit.match}"` });
        }
        s.tally('cast');
        if (!found) s.tally('survived');
      });
    }
  },
});
