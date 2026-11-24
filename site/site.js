// Fills the "Last night" ledger and the cover caption from the nightly run's latest.json.
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const MOODS = ['wrathful', 'restless', 'mischievous', 'faint'];

fetch('reports/latest.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .then((latest) => {
    const ledger = document.getElementById('ledger');
    ledger.replaceChildren(...latest.runs.map((run) => {
      const li = document.createElement('li');
      const who = Object.assign(document.createElement('span'), { className: 'who', textContent: run.appName });
      const where = Object.assign(document.createElement('span'), { className: 'where', textContent: `the ${run.house} inn` });
      const n = Object.assign(document.createElement('span'), { className: 'n' });
      if (run.totals.total) {
        n.textContent = plural(run.totals.total, 'haunting');
        const moods = MOODS.filter((m) => run.totals[m]).map((m) => `${run.totals[m]} ${m}`).join(', ');
        n.append(Object.assign(document.createElement('span'), { className: 'mood', textContent: moods }));
      } else {
        n.textContent = 'The house is quiet. ';
        if (run.exorcised) n.append(Object.assign(document.createElement('span'), { className: 'exo', textContent: `${run.exorcised} exorcised` }));
      }
      const a = Object.assign(document.createElement('a'), { href: run.href, textContent: 'Open the séance record' });
      li.append(who, where, n, a);
      return li;
    }));
    const when = new Date(latest.generatedAt);
    const stamp = when.toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const p = latest.runs.find((r) => r.id === 'poltergeist');
    if (p) {
      document.getElementById('cover-caption').textContent =
        `Plate one. The Hollow Pines Inn, photographed by Poltergeist on ${stamp} UTC. ${plural(p.totals.total, 'spirit')} present across ${plural(p.ghosts, 'ghost')}; each numbered seal is explained in the séance record.`;
    }
    document.getElementById('night-meta').innerHTML =
      `Run finished ${stamp} UTC. Visit the <a href="demo/haunted/">haunted inn</a> or the <a href="demo/exorcised/">exorcised inn</a> to see the pages the ghosts walked.`;
  })
  .catch(() => { /* the static fallback text already in the page stays */ });
