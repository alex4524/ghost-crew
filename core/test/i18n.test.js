// Translations: the same keys in every language, one runtime, five READMEs that agree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { REPORT_STRINGS } from '../src/report/i18n.js';
import { renderReportHtml, buildReport } from '../index.js';

const LANGS = ['en', 'zh-CN', 'zh-TW', 'hi', 'ta'];
const read = (p) => fs.readFile(p, 'utf8');

/** Run a dictionary script with a stub GhostI18n and return what it registered. */
async function dictionaries(file) {
  const dicts = {};
  const window = { GhostI18n: { register: (code, d) => { dicts[code] = { ...(dicts[code] ?? {}), ...d }; } } };
  vm.runInNewContext(await read(file), { window });
  return dicts;
}

/** Keys an HTML page asks for, from data-i18n and data-i18n-attr. */
function pageKeys(html) {
  const keys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(';')) keys.add(pair.split(':')[1].trim());
  return keys;
}

test('the browser runtime ships as one file, copied verbatim into the demo', async () => {
  assert.equal(await read('demo/shared/i18n.js'), await read('core/src/i18n/runtime.browser.js'));
});

test('séance record strings exist in all five languages with the same keys', () => {
  assert.deepEqual(Object.keys(REPORT_STRINGS), LANGS);
  const en = Object.keys(REPORT_STRINGS.en).sort();
  for (const l of LANGS) assert.deepEqual(Object.keys(REPORT_STRINGS[l]).sort(), en, l);
  for (const l of LANGS) for (const [k, v] of Object.entries(REPORT_STRINGS[l])) {
    const want = (REPORT_STRINGS.en[k].match(/\{\w+\}/g) ?? []).sort().join();
    assert.equal((v.match(/\{\w+\}/g) ?? []).sort().join(), want, `${l}.${k} placeholders`);
  }
});

for (const [name, html, dict] of [
  ['landing page', 'site/index.html', 'site/i18n-site.js'],
  ['haunted inn', 'demo/haunted/index.html', 'demo/shared/i18n-inn.js'],
  ['exorcised inn', 'demo/exorcised/index.html', 'demo/shared/i18n-inn.js'],
]) {
  test(`${name}: every translatable string has all four translations`, async () => {
    const d = await dictionaries(dict);
    const keys = new Set([...pageKeys(await read(html)), ...Object.keys(d.en ?? {})]);
    for (const l of LANGS.slice(1)) {
      const missing = [...keys].filter((k) => !(k in (d[l] ?? {})));
      assert.deepEqual(missing, [], `${l} is missing: ${missing.join(', ')}`);
    }
  });
}

test('the haunted inn keeps its planted missing lang attribute', async () => {
  assert.match(await read('demo/haunted/index.html'), /<html>\n/);
  assert.match(await read('demo/exorcised/index.html'), /<html lang="en">/);
});

test('a séance record renders English by default and carries all five languages', () => {
  const report = buildReport({
    app: 'phantom-form', theme: { name: 'Phantom Form', tagline: 'T', tallyLabel: 'Survived {survived} of {cast}.', i18n: { 'zh-CN': { tagline: '中' } } },
    startedAt: new Date(), results: [{ ghost: 'The A', file: 'x', url: 'http://127.0.0.1:9/haunted/index.html', device: 'desktop', state: 'quiet', ms: 1, tally: { cast: 3, survived: 3 }, scenes: [] }],
    baseUrl: 'http://127.0.0.1:9/haunted/', publicUrl: { from: 'http://127.0.0.1:9/', to: 'https://example.org/demo/' },
  });
  const html = renderReportHtml(report);
  assert.match(html, /data-lang-switch/);
  assert.match(html, />The house is quiet\.</);
  assert.match(html, /Survived 3 of 3\./);
  for (const l of LANGS) assert.ok(html.includes(`GhostI18n.register(${JSON.stringify(l)}`), l);
  assert.ok(!html.includes('127.0.0.1'), 'local addresses are rewritten to the public copy');
  assert.match(html, /https:\/\/example\.org\/demo\/haunted\//);
});

test('the five READMEs agree: same switcher, code, images, links and numbers', async () => {
  const files = { en: 'README.md', 'zh-CN': 'README.zh-CN.md', 'zh-TW': 'README.zh-TW.md', hi: 'README.hi.md', ta: 'README.ta.md' };
  const facts = async (f) => {
    const text = await read(f);
    const code = [...text.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
    const prose = text.replace(/```[\s\S]*?```/g, '').replace(/\]\([^)]*\)/g, ']').replace(/`[^`]*`/g, '');
    return {
      first: text.split('\n')[0],
      code,
      images: [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]),
      links: [...new Set([...text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]))].sort(),
      numbers: (prose.match(/\d+/g) ?? []).sort(),
    };
  };
  const en = await facts(files.en);
  assert.match(en.first, /^\[English\]\(README\.md\) \| \[简体中文\]\(README\.zh-CN\.md\)/);
  for (const [l, f] of Object.entries(files)) {
    const x = await facts(f);
    assert.equal(x.first, en.first, `${l} switcher`);
    assert.deepEqual(x.code, en.code, `${l} code blocks`);
    assert.deepEqual(x.images, en.images, `${l} images`);
    assert.deepEqual(x.links, en.links, `${l} links`);
    assert.deepEqual(x.numbers, en.numbers, `${l} numbers`);
  }
});
