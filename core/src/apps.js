// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineApp, getApp } from './registry.js';
import './senses/core.js';

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

defineApp({
  name: 'ghost-crew',
  theme: {
    name: 'Ghost Crew',
    tagline: 'A skeleton crew of ghosts walked these pages in a real browser and photographed what they found.',
  },
});

let loaded = false;

/**
 * Apps are found by convention, never imported by name: every `app-<name>/app.js`
 * under the package root, plus any module passed with --plugin.
 * @param {string[]} [plugins]
 */
export async function loadApps(plugins = []) {
  if (!loaded) {
    loaded = true;
    const entries = await fs.readdir(PACKAGE_ROOT, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory() || !e.name.startsWith('app-')) continue;
      const file = path.join(PACKAGE_ROOT, e.name, 'app.js');
      if (await fs.stat(file).catch(() => null)) await import(pathToFileURL(file).href);
    }
  }
  for (const p of plugins) await import(pathToFileURL(path.resolve(p)).href);
}

/** @param {string} name */
export function requireApp(name) {
  const app = getApp(name);
  if (!app) throw new Error(`Unknown app "${name}"`);
  return app;
}
