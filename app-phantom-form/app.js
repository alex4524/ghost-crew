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
  },
  defaultCrew: (url) => [
    {
      name: 'The Form Eater', file: '(built-in)', lore: 'Feeds the first form on the page every curse it knows.',
      haunts: url, device: 'desktop', steps: [], senses: [{ name: 'cursed-inputs', options: {} }],
    },
  ],
});
