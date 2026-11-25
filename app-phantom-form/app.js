// @ts-check
// Phantom Form: types cursed input into forms, built on the Ghost Crew skeleton.
// Everything app-specific lives in this folder: the curse library, one sense, theme, crew.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineApp } from '../core/index.js';
import './senses/cursed-inputs.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineApp({
  name: 'phantom-form',
  ghostsDir: path.join(here, 'ghosts'),
  theme: {
    name: 'Phantom Form',
    tagline: 'Types what real people type into your forms, one cursed value at a time.',
    tallyLabel: 'The form survived {survived} of {cast} curses.',
    i18n: {
      'zh-CN': { tagline: '把真人会输入的内容填进你的表单，一次一个被诅咒的值。', tallyLabel: '表单扛住了 {cast} 个诅咒中的 {survived} 个。' },
      'zh-TW': { tagline: '把真人會輸入的內容填進你的表單，一次一個被詛咒的值。', tallyLabel: '表單扛住了 {cast} 個詛咒中的 {survived} 個。' },
      hi: { tagline: 'असली लोग जो टाइप करते हैं, वही आपके फ़ॉर्म में डालता है, एक बार में एक शापित मान।', tallyLabel: 'फ़ॉर्म {cast} में से {survived} शाप झेल पाया।' },
      ta: { tagline: 'உண்மையான மக்கள் தட்டச்சு செய்வதை உங்கள் படிவங்களில் இடுகிறது, ஒரு நேரத்தில் ஒரு சபிக்கப்பட்ட மதிப்பு.', tallyLabel: 'படிவம் {cast} சாபங்களில் {survived} சாபங்களைத் தாங்கியது.' },
    },
  },
  defaultCrew: (url) => [
    {
      name: 'The Form Eater', file: '(built-in)', lore: 'Feeds the first form on the page every curse it knows.',
      haunts: url, device: 'desktop', steps: [], senses: [{ name: 'cursed-inputs', options: {} }],
    },
  ],
});
