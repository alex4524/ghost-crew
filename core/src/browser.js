// @ts-check
import { chromium } from 'playwright-core';

export class NoBrowserError extends Error {}

/**
 * Launch the Chrome already on this machine. Order:
 * GHOST_CREW_CHROME (an executable path) → installed Google Chrome → Playwright's own Chromium.
 * @param {{ headless?: boolean }} [opts]
 */
export async function launchChrome({ headless = true } = {}) {
  const args = ['--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'];
  const tries = [];
  if (process.env.GHOST_CREW_CHROME) tries.push({ executablePath: process.env.GHOST_CREW_CHROME });
  tries.push({ channel: 'chrome' }, {});
  /** @type {string[]} */
  const errors = [];
  for (const t of tries) {
    try {
      return await chromium.launch({ headless, args, ...t });
    } catch (e) {
      errors.push(/** @type {Error} */ (e).message.split('\n')[0]);
    }
  }
  throw new NoBrowserError(
    'Ghost Crew could not start Chrome. Fix it one of three ways:\n' +
    '  1. Install Google Chrome (https://www.google.com/chrome/)\n' +
    '  2. Set GHOST_CREW_CHROME=/path/to/chrome\n' +
    '  3. Run: npx playwright install chromium\n' +
    `Details: ${errors.join(' | ')}`,
  );
}
