// @ts-check
import fs from 'node:fs';
import { MOODS } from './model.js';
import { REPORT_STRINGS } from './i18n.js';

const I18N_RUNTIME = fs.readFileSync(new URL('../i18n/runtime.browser.js', import.meta.url), 'utf8').replace(/<\/script/gi, '<\\/script');

/** @typedef {import('./model.js').Report} Report */

const esc = (/** @type {unknown} */ s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

export const GHOST_MARK = `<svg class="mark-ghost" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 3C9.9 3 6 7.6 6 13.6V28.5l3.4-2.5 3.3 2.5 3.3-2.5 3.3 2.5 3.3-2.5 3.4 2.5V13.6C26 7.6 22.1 3 16 3z" fill="currentColor"/><ellipse cx="12.4" cy="14.2" rx="1.7" ry="2.3" fill="#D8D9D4"/><ellipse cx="19.6" cy="14.2" rx="1.7" ry="2.3" fill="#D8D9D4"/></svg>`;

export const FONTS = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap';

/** Shared tokens and base styles, also used by the landing page. */
export const BASE_CSS = `
:root{--plate:#D8D9D4;--paper:#EFEFEA;--ink:#24202E;--tarnish:#55515D;--verdigris:#0A5E56;--ectoplasm:#5CE1D0;--wax:#8C1C2C;--amber:#7F470C;--rule:#B9BAB3;
--display:'IM Fell English',Georgia,'Times New Roman',serif;--body:'Atkinson Hyperlegible',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'JetBrains Mono',ui-monospace,Menlo,monospace}
*{box-sizing:border-box}
html{background:var(--plate);color:var(--ink);font:17px/1.6 var(--body);-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;position:relative;overflow-x:hidden}
a{color:var(--verdigris);text-underline-offset:.18em;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:3px;box-shadow:0 0 0 6px rgba(92,225,208,.55)}
h1,h2,h3{font-family:var(--display);font-weight:400;line-height:1.08;margin:0;letter-spacing:-.005em}
code,pre{font-family:var(--mono);font-size:.86em}
.fog{position:fixed;inset:-20vmax;pointer-events:none;z-index:0;opacity:.55;
background:radial-gradient(40vmax 26vmax at 18% 22%,rgba(255,255,255,.7),transparent 70%),radial-gradient(46vmax 30vmax at 82% 70%,rgba(92,225,208,.18),transparent 70%),radial-gradient(38vmax 22vmax at 60% 10%,rgba(255,255,255,.45),transparent 70%);
animation:drift 38s ease-in-out infinite alternate}
@keyframes drift{from{transform:translate3d(-2vmax,0,0)}to{transform:translate3d(3vmax,-2vmax,0)}}
@media (prefers-reduced-motion:reduce){.fog{animation:none}}
.wrap{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:0 28px}
.mark{display:inline-flex;align-items:center;gap:.5rem;color:var(--ink);text-decoration:none;font-family:var(--display);font-size:1.25rem}
.mark-ghost{width:28px;height:28px;color:var(--ink);filter:drop-shadow(0 0 6px rgba(92,225,208,.9))}
.seal{--c:var(--tarnish);display:inline-grid;place-items:center;width:30px;height:30px;flex:none;border-radius:50%;color:#F6F1E7;font:700 14px/1 var(--body);
background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.28),transparent 46%),var(--c);box-shadow:0 1px 3px rgba(0,0,0,.3),inset 0 0 0 2px rgba(255,255,255,.18),inset 0 -3px 6px rgba(0,0,0,.25)}
.wrathful{--c:var(--wax)}.restless{--c:var(--amber)}.mischievous{--c:var(--verdigris)}.faint{--c:var(--tarnish)}
.mood-word{color:var(--c)}
.visually-hidden{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
html[data-lang="zh-CN"]{--display:'IM Fell English','Noto Serif SC','Songti SC',serif;--body:'Atkinson Hyperlegible','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif}
html[data-lang="zh-TW"]{--display:'IM Fell English','Noto Serif TC','Songti TC',serif;--body:'Atkinson Hyperlegible','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif}
html[data-lang="hi"]{--display:'IM Fell English','Noto Serif Devanagari','Kohinoor Devanagari',serif;--body:'Atkinson Hyperlegible','Noto Sans Devanagari','Kohinoor Devanagari',sans-serif}
html[data-lang="ta"]{--display:'IM Fell English','Noto Serif Tamil','Tamil Sangam MN',serif;--body:'Atkinson Hyperlegible','Noto Sans Tamil','Tamil Sangam MN',sans-serif}
html[data-lang="hi"],html[data-lang="ta"]{line-height:1.75}
html[data-lang]:not([data-lang="en"]) .tagline{font-style:normal}
`;

/** @param {Report} r */
export function renderReportHtml(r) {
  const held = new Date(r.startedAt);
  const heldText = held.toUTCString().replace(/ GMT$/, ' UTC');
  const total = r.totals.total;
  const ghostsHaunted = r.crew.filter((g) => g.state !== 'quiet');
  const ghostsQuiet = r.crew.filter((g) => g.state === 'quiet');
  const dicts = reportDictionaries(r.theme);
  /** English now, the reader's language in the browser. `vars` values are already HTML. */
  const T = (/** @type {string} */ tag, /** @type {string} */ key, /** @type {Record<string, string>} */ vars = {}, extra = '') => {
    const v = Object.keys(vars).length ? ` data-i18n-vars="${esc(JSON.stringify(vars))}"` : '';
    return `<${tag}${extra} data-i18n="${key}"${v}>${fill(dicts.en[key], vars)}</${tag}>`;
  };
  const tally = (/** @type {import('../types.js').GhostResult} */ g) => ({ survived: String(g.tally.survived ?? 0), cast: String(g.tally.cast ?? 0) });
  const hasTally = (/** @type {import('../types.js').GhostResult} */ g) => Object.keys(g.tally).length > 0 && Boolean(r.theme.tallyLabel);
  const link = (/** @type {string} */ u) => `<a href="${esc(u)}">${esc(shortPath(u))}</a>`;
  const moodKey = (/** @type {string} */ m) => `mood${m[0].toUpperCase()}${m.slice(1)}`;
  let plate = 0;

  const verdictTitle = total === 0 ? dicts.en.quiet : fill(dicts.en[total === 1 ? 'countOne' : 'countMany'], { n: String(total) });
  const verdict = total === 0 ? T('h2', 'quiet', {}, ' id="verdict-h" class="count"') : T('h2', total === 1 ? 'countOne' : 'countMany', { n: String(total) }, ' id="verdict-h" class="count"');
  const exo = r.exorcism;
  const exoLine = exo
    ? T('p', 'exoLine', { date: esc(new Date(exo.baselineAt).toUTCString().slice(5, 16)), x: String(exo.exorcised.length), fresh: String(exo.fresh), still: String(exo.still) }, ' class="exo"')
    : '';

  const ledger = r.crew.map((g, i) => {
    const n = g.scenes.reduce((a, s) => a + s.hauntings.length, 0);
    const state = g.state === 'lost' ? T('span', 'stateLost', {}, ' class="ledger-state"')
      : n ? T('span', n === 1 ? 'countOne' : 'countMany', { n: String(n) }, ' class="ledger-state"') : T('span', 'stateNothing', {}, ' class="ledger-state"');
    return `<li><a href="#ghost-${i + 1}">${esc(g.ghost)}</a> ${state}</li>`;
  }).join('');

  const articles = ghostsHaunted.map((g) => {
    const i = r.crew.indexOf(g) + 1;
    const tallyLine = hasTally(g) ? T('p', 'appTally', tally(g), ' class="tally"') : '';
    const scenes = g.scenes.filter((s) => s.hauntings.length).map((s) => {
      plate += 1;
      const list = s.hauntings.map((h) => `
        <li class="haunting ${h.mood}">
          <span class="seal ${h.mood}" aria-hidden="true">${h.n}</span>
          <div>
            <p class="h-title">${T('span', 'sealPrefix', { n: String(h.n) }, ' class="visually-hidden"')}${esc(h.title)}</p>
            <p class="h-meta">${T('span', moodKey(h.mood), {}, ` class="mood-word ${h.mood}"`)}${h.status ? ` ${T('span', h.status === 'new' ? 'statusNew' : 'statusStill', {}, ` class="status status-${h.status}"`)}` : ''}</p>
            ${h.detail ? `<p class="h-detail">${esc(h.detail)}</p>` : ''}
            ${h.help ? `<p class="h-help">${esc(h.help)}</p>` : ''}
            ${h.helpUrl ? `<p class="h-link">${T('a', 'howTo', {}, ` href="${esc(h.helpUrl)}" rel="noopener"`)}</p>` : ''}
          </div>
        </li>`).join('');
      const shownSpirit = s.spiritDetail ?? s.spirit;
      const shownLiving = s.livingDetail ?? s.living;
      const photo = s.spirit
        ? `<figure class="plate">
            <div class="print${s.spiritDetail ? ' detail' : ''}" tabindex="0" role="group" aria-label="Spirit photograph, plate ${plate}: ${esc(s.label)}">
              <img class="spirit" src="${esc(shownSpirit)}" alt="${esc(dicts.en.altSpirit)}" data-i18n-attr="alt:altSpirit" loading="lazy">
              ${shownLiving ? `<img class="living" src="${esc(shownLiving)}" alt="${esc(dicts.en.altLiving)}" data-i18n-attr="alt:altLiving" loading="lazy" hidden>` : ''}
            </div>
            <figcaption>${T('span', 'plate', { n: String(plate), label: esc(s.label) })}
              ${shownLiving ? T('button', 'showLiving', {}, ' type="button" class="toggle" aria-pressed="false"') : ''}
              ${T('a', s.spiritDetail ? 'openWhole' : 'openFull', {}, ` href="${esc(s.spirit)}"`)}</figcaption>
          </figure>`
        : '<p class="no-photo">No photograph: the page could not be captured.</p>';
      return `<div class="scene">${photo}<ol class="hauntings" aria-label="Hauntings on plate ${plate}">${list}</ol></div>`;
    }).join('');
    const walked = T('span', g.device === 'mobile' ? 'walkedMobile' : 'walkedDesktop', { link: link(g.url), s: (g.ms / 1000).toFixed(1) });
    return `
    <article class="ghost" id="ghost-${i}" aria-labelledby="ghost-${i}-name">
      <header class="ghost-head">
        <h2 id="ghost-${i}-name">${esc(g.ghost)}</h2>
        ${g.lore ? `<p class="lore">${esc(g.lore)}</p>` : ''}
        <p class="walk">${walked}${g.state === 'lost' ? ` ${T('strong', 'gotLost', { err: esc(g.error ?? '') }, ' class="mood-word restless"')}` : ''}</p>
        ${tallyLine}
      </header>
      ${scenes}
    </article>`;
  }).join('');

  const quiet = ghostsQuiet.length
    ? `<section class="quiet" aria-labelledby="quiet-h">${T('h2', 'quietTitle', {}, ' id="quiet-h"')}<ul>${ghostsQuiet.map((g) => {
      const i = r.crew.indexOf(g) + 1;
      const t = hasTally(g) ? ` ${T('span', 'appTally', tally(g))}` : '';
      return `<li id="ghost-${i}">${T('span', 'quietItem', { ghost: `<strong>${esc(g.ghost)}</strong>`, link: link(g.url) })}${t}</li>`;
    }).join('')}</ul></section>` : '';

  const exorcised = exo && exo.exorcised.length
    ? `<section class="released" aria-labelledby="released-h">${T('h2', 'releasedTitle', {}, ' id="released-h"')}<ul>${exo.exorcised.map((h) => `<li><span class="seal ${h.mood}" aria-hidden="true">✓</span>${T('span', 'releasedItem', { ghost: `<strong>${esc(h.ghost)}</strong>`, title: esc(h.title) })}</li>`).join('')}</ul></section>` : '';

  const registry = Object.entries(dicts).map(([code, d]) => `GhostI18n.register(${JSON.stringify(code)}, ${scriptJson(d)});`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(r.theme.name)}: ${esc(verdictTitle)} | Ghost Crew séance record</title>
<meta name="description" content="${esc(`${r.theme.name} séance record for ${r.baseUrl ?? 'a web app'}: ${verdictTitle}`)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${BASE_CSS}${REPORT_CSS}</style>
</head>
<body>
<div class="fog" aria-hidden="true"></div>
<div class="wrap">
  <header class="masthead">
    <div class="topline">
      <a class="mark" href="https://github.com/alex4524/ghost-crew">${GHOST_MARK}<span>Ghost Crew</span></a>
      <div class="lang" data-lang-switch></div>
    </div>
    <h1>${esc(r.theme.name)}</h1>
    ${T('p', 'appTagline', {}, ' class="tagline"')}
    <dl class="meta">
      <div>${T('dt', 'metaHaunted')}<dd>${esc(r.baseUrl ?? r.crew[0]?.url ?? '')}</dd></div>
      <div>${T('dt', 'metaHeld')}<dd><time datetime="${esc(r.startedAt)}">${esc(heldText)}</time></dd></div>
      <div>${T('dt', 'metaLasted')}${T('dd', 'lastedValue', { s: (r.ms / 1000).toFixed(1) })}</div>
      <div>${T('dt', 'metaCrew')}${T('dd', r.crew.length === 1 ? 'crewOne' : 'crewMany', { n: String(r.crew.length) })}</div>
    </dl>
    ${T('p', 'findingsNote', {}, ' class="findings-note"')}
  </header>

  <section class="verdict" aria-labelledby="verdict-h">
    ${verdict}
    ${total ? `<ul class="moods">${MOODS.map((m) => `<li class="${m}${r.totals[m] ? '' : ' none'}"><span class="seal ${m}" aria-hidden="true">${r.totals[m]}</span><span>${T('span', moodKey(m), {}, ` class="mood-word ${m}"`)}</span><span class="visually-hidden">: ${r.totals[m]}</span></li>`).join('')}</ul>` : T('p', 'nothingToShow', {}, ' class="exo"')}
    ${exoLine}
    <nav class="ledger" aria-label="${esc(dicts.en.ledgerLabel)}" data-i18n-attr="aria-label:ledgerLabel"><ol>${ledger}</ol></nav>
  </section>

  <main>
    ${articles}
    ${exorcised}
    ${quiet}
  </main>

  <footer class="foot">
    ${T('p', 'footer', { link: '<a href="https://github.com/alex4524/ghost-crew">Ghost Crew</a>' })}
  </footer>
</div>
<script>${I18N_RUNTIME}</script>
<script>
${registry}
for (const b of document.querySelectorAll('.toggle')) {
  b.addEventListener('click', () => {
    const fig = b.closest('figure');
    const living = fig.querySelector('.living'), spirit = fig.querySelector('.spirit');
    const showLiving = b.getAttribute('aria-pressed') !== 'true';
    living.hidden = !showLiving; spirit.hidden = showLiving;
    b.setAttribute('aria-pressed', String(showLiving));
    const key = showLiving ? 'showSpirit' : 'showLiving';
    b.setAttribute('data-i18n', key);
    b.setAttribute('data-i18n-en', ${scriptJson({ showSpirit: REPORT_STRINGS.en.showSpirit, showLiving: REPORT_STRINGS.en.showLiving })}[key]);
    b.textContent = GhostI18n.t(key);
  });
}
</script>
</body>
</html>`;
}

/**
 * Interface strings for every language, plus the app's own tagline and tally wording.
 * An app may translate those in `theme.i18n`; otherwise its English is kept.
 * @param {import('../types.js').Theme} theme
 */
export function reportDictionaries(theme) {
  /** @type {Record<string, Record<string, string>>} */
  const out = {};
  for (const [code, d] of Object.entries(REPORT_STRINGS)) {
    const own = theme.i18n?.[code] ?? {};
    out[code] = {
      ...d,
      appTagline: own.tagline ?? theme.tagline,
      appTally: own.tallyLabel ?? theme.tallyLabel ?? '',
    };
  }
  return out;
}

/** @param {string} text @param {Record<string, string>} vars */
function fill(text, vars) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m));
}

/** JSON safe to place inside a <script> element. @param {unknown} v */
function scriptJson(v) {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** @param {string} u */
function shortPath(u) {
  try {
    const x = new URL(u);
    return `${x.host}${x.pathname}${x.hash}`;
  } catch {
    return u;
  }
}

const REPORT_CSS = `
.masthead{padding:56px 0 28px;border-bottom:1px solid var(--rule)}
.topline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.lang-select{font:inherit;font-size:.95rem;color:var(--ink);background:var(--paper);border:1px solid var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer}
.findings-note{margin:18px 0 0;color:var(--tarnish);font-size:.95rem;max-width:72ch}
.findings-note:empty{display:none}
.masthead h1{font-size:clamp(3rem,7vw,5.25rem);margin-top:28px}
.tagline{font-family:var(--display);font-style:italic;font-size:1.4rem;line-height:1.3;color:var(--tarnish);margin:.5rem 0 1.8rem;max-width:44ch}
.meta{display:flex;flex-wrap:wrap;gap:10px 36px;margin:0}
.meta div{min-width:0}
.meta dt{font-size:.8rem;color:var(--tarnish)}
.meta dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.verdict{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,340px);gap:24px 56px;padding:44px 0 40px;border-bottom:1px solid var(--rule);align-items:start}
.count{font-size:clamp(3.4rem,9vw,7rem);line-height:.95;grid-column:1}
.moods{grid-column:1;display:flex;flex-wrap:wrap;gap:14px 28px;list-style:none;padding:0;margin:0}
.moods li{display:flex;align-items:center;gap:10px;font-weight:700}
.moods li.none{opacity:.45}
.exo{grid-column:1;margin:0;max-width:60ch}
.ledger{grid-column:2;grid-row:1 / span 3;background:var(--paper);border-radius:6px;padding:18px 22px;box-shadow:inset 0 0 0 1px var(--rule)}
.ledger ol{margin:0;padding-left:1.2rem}
.ledger li{margin:.2rem 0}
.ledger-state{color:var(--tarnish);font-size:.9rem;margin-left:.3rem}
.ghost{padding:48px 0 16px;border-bottom:1px solid var(--rule)}
.ghost-head{max-width:72ch;margin-bottom:22px}
.ghost-head h2{font-size:clamp(2rem,4vw,2.75rem)}
.lore{font-family:var(--display);font-style:italic;font-size:1.25rem;line-height:1.3;color:var(--tarnish);margin:.4rem 0}
.walk,.tally{margin:.3rem 0;color:var(--ink)}
.tally{font-weight:700}
.scene{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:28px;margin:0 0 36px;align-items:start}
.plate{margin:0;background:var(--paper);padding:14px 14px 10px;border-radius:4px;box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 18px 40px -24px rgba(36,32,46,.55),0 0 0 1px #C9CAC3}
.print{max-height:620px;overflow:auto;border-radius:2px;background:#1d1b22;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
.print img{display:block;width:100%;height:auto}
.print.detail{max-height:none}
.print img[hidden]{display:none}
.plate figcaption{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;padding-top:10px;font-size:.92rem;color:var(--tarnish)}
.plate figcaption span{font-family:var(--display);font-size:1.05rem;color:var(--ink);margin-right:auto}
.toggle{font:inherit;font-weight:700;color:var(--ink);background:transparent;border:1px solid var(--ink);border-radius:999px;padding:4px 14px;cursor:pointer}
.toggle[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.hauntings{list-style:none;margin:0;padding:0}
.haunting{display:flex;gap:14px;padding:14px 0;border-top:1px solid var(--rule)}
.haunting:first-child{border-top:0;padding-top:4px}
.h-title{margin:0;font-weight:700;line-height:1.35}
.h-meta{margin:.15rem 0 0;font-size:.9rem}
.status{margin-left:.5rem;color:var(--tarnish)}
.status-new{color:var(--ink);font-weight:700}
.h-detail,.h-help{margin:.35rem 0 0;font-size:.95rem;color:var(--tarnish);overflow-wrap:anywhere}
.h-link{margin:.35rem 0 0;font-size:.95rem}
.quiet,.released{padding:40px 0;border-bottom:1px solid var(--rule)}
.quiet h2,.released h2{font-size:2rem;margin-bottom:12px}
.quiet ul{margin:0;padding-left:1.2rem;max-width:80ch}
.released ul{list-style:none;padding:0;margin:0;display:grid;gap:10px;max-width:80ch}
.released li{display:flex;gap:12px;align-items:center}
.foot{padding:36px 0 64px;color:var(--tarnish);font-size:.95rem}
@media (max-width:860px){.verdict{grid-template-columns:1fr}.ledger{grid-column:1;grid-row:auto}.scene{grid-template-columns:1fr}.masthead{padding-top:32px}}
`;
