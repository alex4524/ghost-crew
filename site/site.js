// Fills the "Last night" ledger and the cover caption from the nightly run's latest.json,
// in whichever language the reader picked (see i18n-site.js).
const I = window.GhostI18n;
const t = (key, vars) => (I ? I.t(key, vars) : key);
const MOODS = ['wrathful', 'restless', 'mischievous', 'faint'];
const LOCALES = { en: 'en-GB', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', hi: 'hi-IN', ta: 'ta-IN' };
const count = (n, one, many) => t(n === 1 ? one : many, { n });
const mood = (m) => t(`mood${m[0].toUpperCase()}${m.slice(1)}`);
let latest = null;

function render() {
  if (!latest) {
    document.getElementById('cover-caption').textContent = t('coverCaptionStatic');
    document.getElementById('night-meta').innerHTML = t('nightMetaStatic');
    return;
  }
  const lang = I ? I.lang : 'en';
  const ledger = document.getElementById('ledger');
  ledger.replaceChildren(...latest.runs.map((run) => {
    const li = document.createElement('li');
    const who = Object.assign(document.createElement('span'), { className: 'who', textContent: run.appName });
    const where = Object.assign(document.createElement('span'), { className: 'where', textContent: t(run.house === 'haunted' ? 'whereHaunted' : 'whereExorcised') });
    const n = Object.assign(document.createElement('span'), { className: 'n' });
    if (run.totals.total) {
      n.textContent = count(run.totals.total, 'countOne', 'countMany');
      const moods = MOODS.filter((m) => run.totals[m]).map((m) => `${run.totals[m]} ${mood(m)}`).join(', ');
      n.append(Object.assign(document.createElement('span'), { className: 'mood', textContent: moods }));
    } else {
      n.textContent = `${t('quiet')} `;
      if (run.exorcised) n.append(Object.assign(document.createElement('span'), { className: 'exo', textContent: t('exorcisedN', { n: run.exorcised }) }));
    }
    const a = Object.assign(document.createElement('a'), { href: run.href, textContent: t('openRecord') });
    li.append(who, where, n, a);
    return li;
  }));
  const stamp = new Date(latest.generatedAt).toLocaleString(LOCALES[lang] ?? 'en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const p = latest.runs.find((r) => r.id === 'poltergeist');
  if (p) {
    document.getElementById('cover-caption').textContent = t('coverCaption', {
      stamp, spirits: count(p.totals.total, 'spiritsOne', 'spiritsMany'), ghosts: count(p.ghosts, 'ghostsOne', 'ghostsMany'),
    });
  }
  document.getElementById('night-meta').innerHTML = t('nightMeta', { stamp });
}

I?.onChange(render);
fetch('reports/latest.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .then((data) => { latest = data; render(); })
  .catch(() => { /* the static text in the page stays, translated by onChange */ });
