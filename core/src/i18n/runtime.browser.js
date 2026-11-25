/* Ghost Crew page translations. A browser script, not an ES module.
 *
 * English is written in the HTML itself, so a page reads correctly with no script and
 * every ghost (a fresh browser with no stored choice) always walks the English page.
 * Other languages come from dictionaries registered with GhostI18n.register(lang, dict).
 *
 *   data-i18n="key"                 replaces the element's content with dict[key]
 *   data-i18n-vars='{"n":"3"}'      values for {n} placeholders (already HTML-escaped)
 *   data-i18n-attr="alt:key;aria-label:key2"   translates attributes
 *   data-lang-switch                a container that receives the language picker
 *
 * The choice is kept in ?lang= and localStorage. <html lang> is updated only when the
 * page already declares one (the haunted demo inn has none on purpose).
 *
 * The same file ships as demo/shared/i18n.js; core/test/i18n.test.js keeps them identical.
 */
(function () {
  'use strict';
  var LANGS = [['en', 'English'], ['zh-CN', '简体中文'], ['zh-TW', '繁體中文'], ['hi', 'हिन्दी'], ['ta', 'தமிழ்']];
  var LABEL = { en: 'Language', 'zh-CN': '语言', 'zh-TW': '語言', hi: 'भाषा', ta: 'மொழி' };
  var STORE = 'ghost-crew-lang';
  // Script fonts are fetched only when someone picks that language, so English stays light.
  var FONTS = {
    'zh-CN': 'Noto+Sans+SC:wght@400;700&family=Noto+Serif+SC',
    'zh-TW': 'Noto+Sans+TC:wght@400;700&family=Noto+Serif+TC',
    hi: 'Noto+Sans+Devanagari:wght@400;700&family=Noto+Serif+Devanagari',
    ta: 'Noto+Sans+Tamil:wght@400;700&family=Noto+Serif+Tamil',
  };
  var fontsLoaded = {};
  var dicts = { en: {} };
  var listeners = [];
  var current = 'en';
  var started = false;

  function known(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === code) return true;
    return false;
  }
  function initial() {
    var fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get('lang'); } catch (e) { /* old browser */ }
    if (fromUrl && known(fromUrl)) {
      // A shared ?lang= link also becomes the choice for the pages it links to.
      try { localStorage.setItem(STORE, fromUrl); } catch (e) { /* storage blocked */ }
      return fromUrl;
    }
    try {
      var saved = localStorage.getItem(STORE);
      if (saved && known(saved)) return saved;
    } catch (e) { /* storage blocked */ }
    return 'en';
  }
  function fill(text, vars) {
    if (!vars) return text;
    return String(text).replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m; });
  }
  function lookup(key) {
    var d = dicts[current];
    if (d && Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    if (Object.prototype.hasOwnProperty.call(dicts.en, key)) return dicts.en[key];
    return null;
  }
  function t(key, vars) {
    var s = lookup(key);
    return fill(s == null ? key : s, vars);
  }
  function apply() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('data-i18n-en') == null) el.setAttribute('data-i18n-en', el.innerHTML);
      var en = el.getAttribute('data-i18n-en');
      if (current === 'en') { el.innerHTML = en; continue; }
      var s = dicts[current] && dicts[current][el.getAttribute('data-i18n')];
      var vars = null;
      try { vars = el.getAttribute('data-i18n-vars') ? JSON.parse(el.getAttribute('data-i18n-vars')) : null; } catch (e) { vars = null; }
      el.innerHTML = s == null ? en : fill(s, vars);
    }
    var withAttr = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < withAttr.length; j++) {
      var node = withAttr[j];
      var pairs = node.getAttribute('data-i18n-attr').split(';');
      for (var p = 0; p < pairs.length; p++) {
        var bits = pairs[p].split(':');
        if (bits.length !== 2) continue;
        var attr = bits[0].trim();
        var key = bits[1].trim();
        var keep = 'data-i18n-en-' + attr;
        if (node.getAttribute(keep) == null) node.setAttribute(keep, node.getAttribute(attr) || '');
        var value = current === 'en' ? null : dicts[current] && dicts[current][key];
        node.setAttribute(attr, value == null ? node.getAttribute(keep) : value);
      }
    }
    if (document.documentElement.hasAttribute('lang')) document.documentElement.setAttribute('lang', current);
    document.documentElement.setAttribute('data-lang', current);
    if (FONTS[current] && !fontsLoaded[current] && !document.documentElement.hasAttribute('data-i18n-no-fonts')) {
      fontsLoaded[current] = true;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[current] + '&display=swap';
      document.head.appendChild(link);
    }
    var pickers = document.querySelectorAll('select.lang-select');
    for (var k = 0; k < pickers.length; k++) {
      pickers[k].value = current;
      pickers[k].setAttribute('aria-label', LABEL[current] + (current === 'en' ? '' : ' / Language'));
    }
    for (var l = 0; l < listeners.length; l++) listeners[l](current);
  }
  function remember(code) {
    try { localStorage.setItem(STORE, code); } catch (e) { /* storage blocked */ }
    try {
      var url = new URL(location.href);
      if (code === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', code);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* file: or sandboxed */ }
  }
  function mountPickers() {
    var slots = document.querySelectorAll('[data-lang-switch]');
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].querySelector('select.lang-select')) continue;
      var select = document.createElement('select');
      select.className = 'lang-select';
      select.setAttribute('aria-label', LABEL.en);
      for (var j = 0; j < LANGS.length; j++) {
        var opt = document.createElement('option');
        opt.value = LANGS[j][0];
        opt.lang = LANGS[j][0];
        opt.textContent = LANGS[j][1];
        select.appendChild(opt);
      }
      select.addEventListener('change', function (ev) { set(ev.target.value); });
      slots[i].appendChild(select);
    }
  }
  function set(code) {
    if (!known(code) || code === current && started) return;
    current = code;
    remember(code);
    apply();
  }
  function start() {
    if (started) return;
    mountPickers();
    current = initial();
    started = true;
    apply();
  }

  window.GhostI18n = {
    languages: LANGS.map(function (x) { return { code: x[0], name: x[1] }; }),
    register: function (code, dict) {
      dicts[code] = dicts[code] || {};
      for (var k in dict) if (Object.prototype.hasOwnProperty.call(dict, k)) dicts[code][k] = dict[k];
      if (started && code === current) apply();
    },
    t: t,
    set: set,
    get lang() { return current; },
    onChange: function (fn) { listeners.push(fn); if (started) fn(current); },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else setTimeout(start, 0);
})();
