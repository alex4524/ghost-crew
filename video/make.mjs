#!/usr/bin/env node
// Builds the demo video from real browser footage of the site and reports.
// Needs macOS `say` for narration, ffmpeg/ffprobe, Google Chrome, and a built _site/
// (npm run midnight && node scripts/build-site.mjs). Output: video/build/ghost-crew-demo.mp4
// No music: the background bed is a generated drone, so there is nothing copyrighted.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { serveStatic, PACKAGE_ROOT } from '../core/index.js';

const here = path.join(PACKAGE_ROOT, 'video');
const build = path.join(here, 'build');
const script = JSON.parse(await fs.readFile(path.join(here, 'script.json'), 'utf8'));
const only = process.env.ONLY?.split(',');
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const duration = (f) => Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());
await fs.mkdir(path.join(build, 'raw'), { recursive: true });

// 1. Narration
for (const s of script.scenes) {
  const aiff = path.join(build, `${s.id}.aiff`);
  sh('say', ['-v', script.voice, '-r', String(script.rate), '-o', aiff, s.say]);
  sh('ffmpeg', ['-y', '-v', 'error', '-i', aiff, '-ar', '48000', '-ac', '2', path.join(build, `${s.id}.wav`)]);
  s.audio = duration(path.join(build, `${s.id}.wav`));
  s.dur = Math.round((s.audio + (s.kind === 'card' && s.id === '11-end' ? 2.2 : 0.9)) * 100) / 100;
}
const total = script.scenes.reduce((a, s) => a + s.dur, 0);
console.log(`Narration: ${total.toFixed(1)} s across ${script.scenes.length} scenes`);
if (total > 178) throw new Error('Video would be 3 minutes or longer; shorten script.json');

// 2. Footage
const site = await serveStatic(path.join(PACKAGE_ROOT, '_site'));
const cards = await serveStatic(path.join(here, 'cards'));
const browser = await chromium.launch({ channel: 'chrome', args: ['--hide-scrollbars'] });

const glide = (page, y, ms) => page.evaluate(([to, span]) => new Promise((done) => {
  const from = scrollY; const t0 = performance.now();
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const step = (now) => { const p = Math.min(1, (now - t0) / span); scrollTo(0, from + (to - from) * ease(p)); if (p < 1) requestAnimationFrame(step); else done(); };
  requestAnimationFrame(step);
}), [y, ms]);
const yOf = (page, sel, offset = 60) => page.evaluate(([s, o]) => {
  const e = document.querySelector(s);
  return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - o) : 0;
}, [sel, offset]);

async function captions(page, text, seconds) {
  const parts = text.replace(/n p x/g, 'npx').split(/(?<=[.!?])\s+/);
  const chars = parts.reduce((a, p) => a + p.length, 0);
  let t = 0;
  const cues = parts.map((p) => { const c = { at: t, text: p }; t += (p.length / chars) * seconds * 1000; return c; });
  await page.evaluate((list) => {
    const box = document.createElement('div');
    box.id = '__captions';
    Object.assign(box.style, {
      position: 'fixed', left: '50%', bottom: '44px', transform: 'translateX(-50%)', zIndex: 2147483647, maxWidth: '1500px',
      padding: '14px 28px', borderRadius: '14px', background: 'rgba(36,32,46,.88)', color: '#F4F2EC',
      font: '600 32px/1.35 "Atkinson Hyperlegible", system-ui, sans-serif', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.25)',
    });
    document.documentElement.appendChild(box);
    for (const c of list) setTimeout(() => { box.textContent = c.text; }, c.at);
  }, cues);
}

const actions = {
  async card(page, s) { await page.goto(`${cards.url}${s.card}`); },
  async inn(page) { await page.goto(`${site.url}demo/haunted/`); },
  async spirit(page) { await page.goto(`${site.url}reports/poltergeist/`); },
  async phantom(page) { await page.goto(`${site.url}reports/phantom-form/`); },
  async exorcism(page) { await page.goto(`${site.url}reports/phantom-form-exorcised/`); },
  async section(page, s) { await page.goto(`${site.url}`); await page.evaluate((y) => scrollTo(0, y), await yOf(page, `#${s.hash}`, 120)); },
};
const play = {
  async card(page, s) { await page.waitForTimeout(s.dur * 1000); },
  async inn(page, s) {
    const ms = s.dur * 1000;
    await page.waitForTimeout(ms * 0.12);
    await glide(page, await yOf(page, '#rooms', 40), ms * 0.18);
    await page.waitForTimeout(ms * 0.12);
    await glide(page, await yOf(page, '#book', 40), ms * 0.16);
    await page.locator('input[name=guest]').pressSequentially('👻 Casper', { delay: 110 });
    await page.locator('input[name=email]').fill('casper@hollow-pines.example');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Reserve' }).click();
    await page.waitForTimeout(ms * 0.2);
  },
  async spirit(page, s) {
    const ms = s.dur * 1000;
    const id = await page.evaluate(() => [...document.querySelectorAll('article.ghost')].find((a) => a.querySelector('h2')?.textContent === 'The Lantern Dimmer')?.id);
    await page.waitForTimeout(ms * 0.1);
    await glide(page, await yOf(page, `#${id} .scene`, 30), ms * 0.14);
    await page.waitForTimeout(ms * 0.5);
    await page.locator(`#${id} .toggle`).first().click();
    await page.waitForTimeout(ms * 0.14);
    await page.locator(`#${id} .toggle`).first().click();
    await page.waitForTimeout(ms * 0.1);
  },
  async phantom(page, s) {
    const ms = s.dur * 1000;
    const id = await page.evaluate(() => [...document.querySelectorAll('article.ghost')].find((a) => a.querySelector('h2')?.textContent === 'The Name Eater')?.id);
    const scenes = await page.evaluate((g) => [...document.querySelectorAll(`#${g} .scene`)].slice(0, 4).map((e) => e.getBoundingClientRect().top + scrollY - 30), id);
    await page.waitForTimeout(ms * 0.06);
    const legs = [0, 0, 2, 3].map((i) => scenes[i] ?? scenes.at(-1));
    for (const [i, y] of legs.entries()) {
      await glide(page, y, i === 0 ? ms * 0.12 : ms * 0.1);
      await page.waitForTimeout(ms * 0.13);
    }
  },
  async exorcism(page, s) {
    const ms = s.dur * 1000;
    await page.waitForTimeout(ms * 0.35);
    await glide(page, await yOf(page, '.released', 40), ms * 0.25);
    await page.waitForTimeout(ms * 0.3);
  },
  async section(page, s) {
    const ms = s.dur * 1000;
    await page.waitForTimeout(ms * 0.3);
    await glide(page, await yOf(page, s.scrollTo, 140), ms * 0.4);
    await page.waitForTimeout(ms * 0.25);
  },
};

try {
  for (const s of script.scenes) {
    if (only && !only.includes(s.id)) continue;
    const dir = path.join(build, 'raw', s.id);
    await fs.rm(dir, { recursive: true, force: true });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, recordVideo: { dir, size: { width: 1920, height: 1080 } } });
    const page = await ctx.newPage();
    const t0 = Date.now();
    await actions[s.kind](page, s);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    s.trim = (Date.now() - t0) / 1000;
    await captions(page, s.say, s.audio);
    await play[s.kind](page, s);
    const spent = (Date.now() - t0) / 1000 - s.trim;
    if (spent < s.dur) await page.waitForTimeout((s.dur - spent) * 1000 + 200);
    await ctx.close();
    s.raw = await page.video().path();
    console.log(`  recorded ${s.id} (${s.dur.toFixed(1)} s)`);
  }
} finally {
  await browser.close();
  await site.close();
  await cards.close();
}

// 3. Encode each scene with its narration, then join.
const list = [];
for (const s of script.scenes) {
  const out = path.join(build, `${s.id}.mp4`);
  if (s.raw) {
    sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(s.trim), '-i', s.raw, '-i', path.join(build, `${s.id}.wav`), '-t', String(s.dur),
      '-vf', `fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(s.dur - 0.3).toFixed(2)}:d=0.3`,
      '-af', `apad,afade=t=out:st=${(s.dur - 0.25).toFixed(2)}:d=0.25`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
      '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', out]);
  }
  list.push(`file '${out}'`);
}
await fs.writeFile(path.join(build, 'list.txt'), list.join('\n'));
const narrated = path.join(build, 'narrated.mp4');
sh('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(build, 'list.txt'), '-c', 'copy', narrated]);
const len = duration(narrated);

// 4. A quiet generated drone under the voice.
const bed = path.join(build, 'bed.wav');
sh('ffmpeg', ['-y', '-v', 'error',
  '-f', 'lavfi', '-i', `sine=frequency=55:duration=${len}`, '-f', 'lavfi', '-i', `sine=frequency=82.41:duration=${len}`,
  '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.6:duration=${len}`,
  '-filter_complex', `[0:a]volume=0.35[a];[1:a]volume=0.22,tremolo=f=0.15:d=0.5[b];[2:a]lowpass=f=300,volume=0.25[c];[a][b][c]amix=inputs=3:normalize=0,lowpass=f=600,afade=t=in:d=2,afade=t=out:st=${(len - 3).toFixed(2)}:d=3[m]`,
  '-map', '[m]', '-ar', '48000', '-ac', '2', bed]);
const final = path.join(build, 'ghost-crew-demo.mp4');
sh('ffmpeg', ['-y', '-v', 'error', '-i', narrated, '-i', bed, '-filter_complex', '[1:a]volume=0.09[b];[0:a][b]amix=inputs=2:duration=first:normalize=0[out]',
  '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final]);
console.log(`Wrote ${path.relative(process.cwd(), final)}: ${duration(final).toFixed(1)} s`);
