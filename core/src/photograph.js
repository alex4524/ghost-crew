// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';

/** @typedef {import('./types.js').Scene} Scene */

const MAX_HEIGHT = 4200;

/**
 * Take the two pictures of a scene: the living page, then the spirit photograph
 * (desaturated page, glowing halos and numbered seals on every haunting).
 * @param {import('playwright-core').Page} page
 * @param {Scene} scene
 * @param {string} outDir
 * @param {string} id
 */
export async function photograph(page, scene, outDir, id) {
  await fs.mkdir(path.join(outDir, 'photos'), { recursive: true });
  const living = `photos/${id}-living.png`;
  const spirit = `photos/${id}-spirit.png`;
  const livingDetail = `photos/${id}-living-detail.png`;
  const spiritDetail = `photos/${id}-spirit-detail.png`;
  const clip = await page.evaluate((max) => {
    const h = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const w = Math.max(document.documentElement.clientWidth, window.innerWidth);
    return h > max ? { x: 0, y: 0, width: w, height: max } : null;
  }, MAX_HEIGHT).catch(() => null);
  const shot = { fullPage: true, animations: /** @type {'disabled'} */ ('disabled'), timeout: 20000, ...(clip ? { clip } : {}) };
  const detail = await detailClip(page, scene);

  await page.screenshot({ ...shot, path: path.join(outDir, living) });
  if (detail) await page.screenshot({ ...shot, clip: detail, path: path.join(outDir, livingDetail) });
  await page.evaluate(drawSpirits, scene.hauntings.map((h) => ({ n: h.n, mood: h.mood, boxes: h.boxes.slice(0, 16), title: h.title })));
  await page.screenshot({ ...shot, path: path.join(outDir, spirit) });
  if (detail) await page.screenshot({ ...shot, clip: detail, path: path.join(outDir, spiritDetail) });
  await page.evaluate(() => {
    document.getElementById('__ghost_crew')?.remove();
    document.getElementById('__ghost_crew_style')?.remove();
  }).catch(() => {});
  scene.living = living;
  scene.spirit = spirit;
  if (detail) {
    scene.livingDetail = livingDetail;
    scene.spiritDetail = spiritDetail;
  }
}

/**
 * The part of the page around a scene's hauntings, so the print opens on the evidence.
 * @param {import('playwright-core').Page} page @param {Scene} scene
 */
async function detailClip(page, scene) {
  const doc = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: document.documentElement.clientWidth }));
  const boxes = scene.hauntings.flatMap((h) => h.boxes).filter((b) => !(b.w >= doc.w * 0.95 && b.h >= doc.h * 0.85));
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  const width = doc.w <= 1600 ? doc.w : Math.min(doc.w, Math.max(1100, maxX - minX + 240));
  const height = Math.min(doc.h, 900, Math.max(560, maxY - minY + 220));
  const cx = (minX + maxX) / 2;
  const x = doc.w <= 1600 ? 0 : Math.max(0, Math.min(doc.w - width, cx - width / 2));
  const y = Math.max(0, Math.min(doc.h - height, minY - 140));
  if (width >= doc.w * 0.98 && height >= doc.h * 0.98) return null;
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

/**
 * Runs inside the page. Kept free of closures so Playwright can serialise it.
 * @param {{ n: number, mood: string, boxes: {x:number,y:number,w:number,h:number}[], title: string }[]} items
 */
function drawSpirits(items) {
  const seal = { wrathful: '#8C1C2C', restless: '#7F470C', mischievous: '#0A5E56', faint: '#5B5763' };
  const style = document.createElement('style');
  style.id = '__ghost_crew_style';
  style.textContent = `
    body { filter: grayscale(1) contrast(1.06) brightness(.98) sepia(.07) !important; }
    #__ghost_crew { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none; }
    #__ghost_crew .halo { position: absolute; border-radius: 10px;
      background: radial-gradient(ellipse at center, rgba(92,225,208,.16), rgba(92,225,208,.05) 70%);
      box-shadow: 0 0 0 2px rgba(92,225,208,.95), 0 0 16px 4px rgba(92,225,208,.6), 0 0 54px 18px rgba(92,225,208,.28); }
    #__ghost_crew .seal { position: absolute; width: 28px; height: 28px; border-radius: 50%;
      display: grid; place-items: center; color: #F6F1E7; font: 700 15px/1 Georgia, 'Times New Roman', serif;
      box-shadow: 0 2px 5px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.22), inset 0 -3px 6px rgba(0,0,0,.25); }
    #__ghost_crew .banner { position: absolute; left: 16px; display: flex; gap: 10px; align-items: center;
      width: max-content; max-width: 640px; padding: 8px 14px 8px 8px; border-radius: 999px; background: rgba(239,239,234,.94);
      box-shadow: 0 0 0 2px rgba(92,225,208,.9), 0 0 30px 8px rgba(92,225,208,.35);
      color: #24202E; font: 15px/1.3 Georgia, 'Times New Roman', serif; }
    #__ghost_crew .banner .seal { position: static; flex: none; }
  `;
  document.documentElement.appendChild(style);
  // The canvas colour comes from <html>, which the body filter cannot reach: move it
  // onto the body and give <html> its grey equivalent, so the whole print is silver.
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const transparent = (c) => c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);
  const canvas = transparent(bodyBg) ? (transparent(htmlBg) ? 'rgb(255, 255, 255)' : htmlBg) : bodyBg;
  const [r, g, b] = (canvas.match(/\d+(\.\d+)?/g) ?? ['255', '255', '255']).map(Number);
  const grey = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  style.textContent += `html { background: rgb(${grey + 2}, ${grey + 2}, ${grey - 2}) !important; }
    body { background-color: ${canvas} !important; }`;
  const docW = document.documentElement.scrollWidth;
  const docH = document.documentElement.scrollHeight;
  const root = document.createElement('div');
  root.id = '__ghost_crew';
  document.documentElement.appendChild(root);
  let bannerTop = 16;
  const makeSeal = (n, mood) => {
    const s = document.createElement('div');
    s.className = 'seal';
    s.textContent = String(n);
    s.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,.25), transparent 45%), ${seal[mood] ?? seal.faint}`;
    return s;
  };
  for (const item of items) {
    // A box that is the whole page (e.g. a missing lang on <html>) reads better as a banner.
    const boxes = item.boxes.filter((bx) => !(bx.w >= docW * 0.95 && bx.h >= docH * 0.85));
    if (!boxes.length) {
      const b = document.createElement('div');
      b.className = 'banner';
      b.style.top = `${bannerTop}px`;
      bannerTop += 52;
      b.appendChild(makeSeal(item.n, item.mood));
      const t = document.createElement('span');
      t.textContent = item.title;
      b.appendChild(t);
      root.appendChild(b);
      continue;
    }
    boxes.forEach((box, i) => {
      const pad = 5;
      const h = document.createElement('div');
      h.className = 'halo';
      Object.assign(h.style, {
        left: `${box.x - pad}px`, top: `${box.y - pad}px`,
        width: `${Math.max(box.w, 6) + pad * 2}px`, height: `${Math.max(box.h, 6) + pad * 2}px`,
      });
      root.appendChild(h);
      if (i < 6) {
        const s = makeSeal(item.n, item.mood);
        Object.assign(s.style, { left: `${Math.max(box.x - 18, 2)}px`, top: `${Math.max(box.y - 18, 2)}px` });
        root.appendChild(s);
      }
    });
  }
}
