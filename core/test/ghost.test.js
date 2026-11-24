import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGhost, GhostError, resolveHaunt, loadGhosts, ghostFileName } from '../index.js';
import { loadApps } from '../src/apps.js';

await loadApps();

test('every shipped demo ghost parses', async () => {
  const ghosts = await loadGhosts(['app-poltergeist/ghosts', 'app-phantom-form/ghosts']);
  assert.equal(ghosts.length, 8);
  for (const g of ghosts) {
    assert.match(g.name, /^The /);
    assert.ok(g.senses.length > 0);
  }
});

test('steps and senses are normalised', () => {
  const g = parseGhost(`
ghost: The Tester
haunts: /x.html
device: mobile
steps:
  - click: Book now
  - fill: { field: Email, with: 7 }
  - press: Tab
  - wait: 100
  - scroll: bottom
senses:
  - console-clean
  - text-visible: Welcome
`, 't.ghost.yaml');
  assert.equal(g.device, 'mobile');
  assert.deepEqual(g.steps.map((s) => s.kind), ['click', 'fill', 'press', 'wait', 'scroll']);
  assert.equal(g.steps[1].value, '7');
  assert.deepEqual(g.senses, [{ name: 'console-clean', options: {} }, { name: 'text-visible', options: 'Welcome' }]);
});

const bad = {
  'missing ghost name': 'haunts: /\nsenses: [console-clean]',
  'missing haunts': 'ghost: The X\nsenses: [console-clean]',
  'no senses': 'ghost: The X\nhaunts: /',
  'unknown sense': 'ghost: The X\nhaunts: /\nsenses: [telepathy]',
  'unknown step': 'ghost: The X\nhaunts: /\nsteps: [{ teleport: home }]\nsenses: [console-clean]',
  'wait out of range': 'ghost: The X\nhaunts: /\nsteps: [{ wait: 99999 }]\nsenses: [console-clean]',
  'unknown top key': 'ghost: The X\nhaunts: /\ncolour: red\nsenses: [console-clean]',
  'not yaml': 'ghost: [unclosed',
};

for (const [name, text] of Object.entries(bad)) {
  test(`rejects: ${name}`, () => {
    assert.throws(() => parseGhost(text, 'bad.ghost.yaml'), (e) => e instanceof GhostError && e.problems.length > 0);
  });
}

test('all problems are reported at once, naming the allowed values', () => {
  try {
    parseGhost('ghost: 3\nsenses: [telepathy]', 'bad.ghost.yaml');
    assert.fail('should throw');
  } catch (e) {
    assert.ok(e instanceof GhostError);
    assert.ok(e.problems.length >= 3);
    assert.match(e.message, /Known senses: .*axe/);
  }
});

test('haunts resolves against the base URL', () => {
  assert.equal(resolveHaunt('/index.html', 'http://127.0.0.1:4173/haunted/'), 'http://127.0.0.1:4173/haunted/index.html');
  assert.equal(resolveHaunt('https://example.com/a', 'http://x/'), 'https://example.com/a');
  assert.throws(() => resolveHaunt('/a'));
});

test('ghost file names are kebab-case', () => {
  assert.equal(ghostFileName('The Lantern Dimmer'), 'lantern-dimmer.ghost.yaml');
});
