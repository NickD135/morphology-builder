// Shared helpers for the printable worksheet generators (worksheet-*.html).
// Load after the supabase-js CDN script and before the page's own script.
(function () {
  var SUPABASE_URL  = 'https://kdpavfrzmmzknqfpodrl.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGF2ZnJ6bW16a25xZnBvZHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjgzOTIsImV4cCI6MjA5MDAwNDM5Mn0.n5fe7HvXWMsM4xN_iaU_N4xLkC5xD4y9Uoer_DG-dlg';

  // Screen-only styles for the notice and the "fewer than asked" note.
  var css = '.ws-short-note{font-weight:700;color:#b45309;}' +
    '#wsNotice{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:9999;max-width:min(560px,calc(100% - 32px));' +
    'background:#fffbeb;border:1.5px solid #f59e0b;color:#78350f;border-radius:10px;padding:10px 36px 10px 14px;' +
    'font:600 13px/1.45 Lexend,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.15);}' +
    '#wsNotice.err{background:#fef2f2;border-color:#dc2626;color:#7f1d1d;}' +
    '#wsNotice a{color:inherit;font-weight:800;}' +
    '#wsNotice button{position:absolute;top:6px;right:8px;border:0;background:none;font-size:16px;cursor:pointer;color:inherit;}' +
    '@media print{.ws-short-note,#wsNotice{display:none!important;}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"'`]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
  }

  function hideNotice() {
    var el = document.getElementById('wsNotice');
    if (el) el.remove();
  }

  // Shows a message above the page (not printed). html must be trusted markup.
  function showNotice(html, isError) {
    hideNotice();
    var el = document.createElement('div');
    el.id = 'wsNotice';
    el.setAttribute('role', 'alert');
    if (isError) el.className = 'err';
    el.innerHTML = html + '<button type="button" aria-label="Close">×</button>';
    el.querySelector('button').addEventListener('click', hideNotice);
    document.body.appendChild(el);
  }

  var client = null;
  function sb() {
    if (!client && window.supabase && window.supabase.createClient) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    }
    return client;
  }

  async function teacherToken() {
    var c = sb();
    if (!c) return null;
    try {
      var r = await c.auth.getSession();
      return (r && r.data && r.data.session && r.data.session.access_token) || null;
    } catch (e) { return null; }
  }

  function signInLink(text) {
    // Last path segment only (works on the GitHub Pages mirror too); teacher-login only accepts plain relative paths.
    var back = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    return '<a href="teacher-login.html?returnTo=' + encodeURIComponent(back) + '" target="_blank" rel="noopener">' + text + '</a>';
  }

  // Translates words with the translate-words edge function using the signed-in
  // teacher's session. Returns { english: escaped translation }. On any problem
  // the worksheet is still made, and a notice says why translations are missing.
  async function translate(words, lang, context) {
    hideNotice();
    var token = await teacherToken();
    if (!token) {
      showNotice('Sign in to add translations. ' + signInLink('Sign in as a teacher') +
        ', then generate the worksheet again. This sheet was made without translations.');
      return {};
    }
    try {
      var resp = await fetch(SUPABASE_URL + '/functions/v1/translate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: 'Bearer ' + token },
        body: JSON.stringify({ words: words, language: lang, contexts: words.map(function () { return context || 'word'; }) }),
      });
      var data = null;
      try { data = await resp.json(); } catch (e) { /* not JSON */ }
      if (resp.status === 401) {
        showNotice('Your sign-in has expired. ' + signInLink('Sign in again') +
          ', then generate the worksheet again. This sheet was made without translations.', true);
        return {};
      }
      if (!resp.ok || !data || !Array.isArray(data.translations)) {
        var why = data && data.error ? ' (' + esc(data.error) + ')' : '';
        showNotice('Translations could not be added' + why + '. This sheet was made without them. Please try again in a moment.', true);
        return {};
      }
      var map = {};
      data.translations.forEach(function (t) { if (t && t.translation) map[t.word] = esc(t.translation); });
      if (!Object.keys(map).length) {
        showNotice('No translations came back for this language. This sheet was made without them.', true);
      }
      return map;
    } catch (e) {
      showNotice('Translations could not be added (no connection to Word Labs). This sheet was made without them.', true);
      return {};
    }
  }

  // "12 words", plus a screen-only note when fewer were produced than asked for.
  function countLabel(produced, requested, singular, plural) {
    var noun = produced === 1 ? singular : (plural || singular + 's');
    var out = produced + ' ' + noun;
    if (requested && produced < requested) {
      out += ' <span class="ws-short-note">(Only ' + produced + ' ' + noun + ' ' + (produced === 1 ? 'matches' : 'match') + ' these settings; you asked for ' + requested + '.)</span>';
    }
    return out;
  }

  window.WSCommon = { translate: translate, countLabel: countLabel, showNotice: showNotice, hideNotice: hideNotice };
})();
