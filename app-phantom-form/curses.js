// @ts-check
// The curse library: input real people type, and input that breaks careless code.

/**
 * @typedef {Object} Curse
 * @property {string} label    how the report names it
 * @property {string} value
 * @property {boolean} [valid] real-world input the form must accept
 * @property {boolean} [blank] the form must refuse it
 * @property {boolean} [markup] executes script if the page renders it as HTML
 */

/** @type {Record<string, Curse>} */
export const CURSES = {
  emoji: { label: 'an emoji name', value: '👻 Casper' },
  zalgo: { label: 'zalgo text', value: 'Z̷̛̖a̸̜͝l̵̰̈g̶̣̓ő̵̟' },
  rtl: { label: 'a right-to-left override', value: '\u202Eetihw yrraM\u202C' },
  long: { label: 'a very long name', value: 'Maximiliana Wolfeschlegelsteinhausen-Bergerdorff' },
  wide: { label: 'one long word', value: 'Wolfeschlegelsteinhausen' },
  markup: { label: 'HTML markup', value: '<img src=x onerror="window.__phantomFired=1">', markup: true },
  sqlish: { label: 'a quote and semicolon', value: "Robert'); DROP TABLE guests;--" },
  blank: { label: 'only spaces', value: '   ', blank: true },
  apostrophe: { label: 'an apostrophe name', value: "Siobhán O'Brien", valid: true },
  'unicode-name': { label: 'accented letters', value: 'Zoë Ñúñez-Łukasiewicz', valid: true },
  'weird-valid-email': { label: 'a valid email with + and \'', value: "o'brien+inn@hollow-pines.example", valid: true },
  negative: { label: 'a negative number', value: '-3' },
  zero: { label: 'zero', value: '0' },
  huge: { label: 'a huge number', value: '99999999999999999999' },
};

/** Curses tried in zero-config mode, by input type. */
export const AUTO = {
  text: ['emoji', 'long', 'markup', 'blank', 'apostrophe'],
  email: ['weird-valid-email', 'markup', 'blank'],
  number: ['negative', 'huge'],
  textarea: ['zalgo', 'markup', 'long'],
};
