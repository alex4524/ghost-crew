// @ts-check
// Tiny ANSI helpers. Progress goes to stderr so stdout stays clean for --json.

const color = process.stderr.isTTY && !process.env.NO_COLOR;
const wrap = (/** @type {string} */ open, /** @type {string} */ close) => (/** @type {string} */ s) => (color ? `\u001b[${open}m${s}\u001b[${close}m` : s);

export const t = {
  bold: wrap('1', '22'),
  dim: wrap('2', '22'),
  italic: wrap('3', '23'),
  teal: wrap('38;5;80', '39'),
  wax: wrap('38;5;131', '39'),
  amber: wrap('38;5;172', '39'),
  sage: wrap('38;5;72', '39'),
  grey: wrap('38;5;245', '39'),
};

export const moodColor = {
  wrathful: t.wax,
  restless: t.amber,
  mischievous: t.sage,
  faint: t.grey,
};

/** @param {string} s */
export function err(s = '') {
  process.stderr.write(`${s}\n`);
}

/** @param {string} s @param {number} n */
export function pad(s, n) {
  const len = [...s].length;
  return len >= n ? s : s + ' ' + t.dim('.'.repeat(Math.max(n - len - 1, 1)));
}
