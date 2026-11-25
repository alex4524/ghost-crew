// @ts-check
// Poltergeist: accessibility hauntings, built on the Ghost Crew skeleton.
// Everything app-specific lives in this folder: senses, theme, built-in crew, example ghosts.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineApp } from '../core/index.js';
import './senses/axe.js';
import './senses/keyboard.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineApp({
  name: 'poltergeist',
  ghostsDir: path.join(here, 'ghosts'),
  theme: {
    name: 'Poltergeist',
    tagline: 'Finds the parts of a page that some people cannot see, reach or read.',
    tallyLabel: '',
    i18n: {
      'zh-CN': { tagline: '找出页面上有人看不见、够不着或读不懂的地方。' },
      'zh-TW': { tagline: '找出頁面上有人看不見、碰不到或讀不懂的地方。' },
      hi: { tagline: 'पेज के वे हिस्से खोजता है जिन्हें कुछ लोग देख, छू या पढ़ नहीं पाते।' },
      ta: { tagline: 'சிலரால் பார்க்க, அடைய அல்லது படிக்க முடியாத பக்கப் பகுதிகளைக் கண்டறிகிறது.' },
    },
  },
  /** Zero-config crew for a bare URL. */
  defaultCrew: (url) => [
    {
      name: 'The Lantern Dimmer', file: '(built-in)', lore: 'Snuffs out anything a screen reader or a tired eye cannot read.',
      haunts: url, device: 'desktop', steps: [], senses: [{ name: 'axe', options: {} }, { name: 'no-broken-images', options: {} }],
    },
    {
      name: 'The Locked Door', file: '(built-in)', lore: 'Walks the page with only a keyboard, as many people must.',
      haunts: url, device: 'desktop', steps: [], senses: [{ name: 'focus-visible', options: {} }, { name: 'keyboard-reach', options: {} }],
    },
    {
      name: 'The Narrow Hall', file: '(built-in)', lore: 'Visits on a phone and squeezes through every gap.',
      haunts: url, device: 'mobile', steps: [], senses: [{ name: 'axe', options: { impact: ['critical', 'serious'] } }, { name: 'no-overflow', options: {} }],
    },
  ],
});
