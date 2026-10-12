#!/usr/bin/env node
/*
 * Word Labs mock mode: drive pages in a headless browser as a pretend student
 * or teacher, with fake data only. Used by the improvement agent for student
 * walkthroughs and before/after screenshots.
 *
 * CLI:
 *   node tests/mock/browse.js --as ava --page /phoneme-mode --shot shots/phoneme.png
 *   node tests/mock/browse.js --as ben --page /landing --shot ben.png --width 1366 --height 768
 *   node tests/mock/browse.js --as chloe --solo --shot solo-home.png
 *   node tests/mock/browse.js --as teacher --page /dashboard --shot dash.png --full
 *   Options: --low-stim  --reduced-motion  --full  --wait 1500  --first-visit  --keep-data
 *
 * Module:
 *   const { openMock } = require('./tests/mock/browse');
 *   const s = await openMock({ as: 'ava' });
 *   await s.goto('/syllable-mode'); await s.page.click('...'); await s.shot('a.png');
 *   console.log(s.errors); await s.close();
 *
 * Students: ava (typical), ben (support mode, below level), chloe (extension),
 * dev (EAL/D). Every request that is not to the local mock server is blocked.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server');
const { requireTool } = require('./resolve');

const STUDENTS = ['ava', 'ben', 'chloe', 'dev'];

async function openMock(opts) {
  opts = opts || {};
  const as = (opts.as || 'ava').toLowerCase();
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync('/opt/pw-browsers')) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = '/opt/pw-browsers';
  }
  const { chromium } = requireTool('playwright');
  const server = opts.baseUrl ? null : await startServer({ port: opts.port || 0 });
  const base = opts.baseUrl || server.url;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: opts.width || 1366, height: opts.height || 768 },
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
    locale: 'en-AU', timezoneId: 'Australia/Sydney'
  });
  // Only the local mock server is reachable. No real APIs, fonts or CDNs.
  await context.route('**/*', function (route) {
    const u = route.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  // One-off popups (storage notice, guided tours, first-visit game help) are
  // treated as already seen so screenshots show the page itself. Pass
  // firstVisit: true (CLI --first-visit) to see them as a new student would.
  if (!opts.firstVisit) {
    await context.addInitScript(function () {
      try {
        var get = Storage.prototype.getItem;
        Storage.prototype.getItem = function (k) {
          if (this === window.localStorage && /^(wl_notice_v1|wl_tour_seen_|wl_help_seen_)/.test(String(k))) return '1';
          return get.call(this, k);
        };
      } catch (e) {}
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/ERR_FAILED|net::|Failed to load resource/.test(t)) return; // blocked external assets
    errors.push('console: ' + t);
  });

  async function goto(p) {
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(opts.wait == null ? 1200 : opts.wait);
  }

  // Fresh fake data for each session unless asked to keep it.
  await page.goto(base + '/landing' + (opts.keepData ? '' : '?mockReset=1'), { waitUntil: 'load' });
  await page.evaluate(function () { try { sessionStorage.setItem('wl_mock_hide_label', '0'); } catch (e) {} });

  if (opts.lowStim) {
    await page.evaluate(function () {
      var c = __WL_MOCK__.fixtures.tables.classes[0];
      __WL_MOCK__.patch('classes', { id: c.id }, { settings: Object.assign({}, c.settings, { lowStimMode: true }) });
    });
  }

  if (as === 'teacher') {
    await page.evaluate(function () { __WL_MOCK__.setRole('teacher'); });
  } else if (STUDENTS.indexOf(as) !== -1) {
    await page.evaluate(async function (who) {
      var L = __WL_MOCK__.fixtures.logins, s = L.students[who];
      var cls = __WL_MOCK__.fixtures.tables.classes[0];
      var W = WordLabData; // top-level const in wordlab-data.js, not on window
      var r = await W.verifyStudentCode(s.id, s.code, cls.id);
      if (!r.ok) throw new Error('mock login failed for ' + who);
      sessionStorage.setItem('wl_extension_mode', r.extensionMode ? 'true' : 'false');
      if (r.ealdLanguage) sessionStorage.setItem('wl_eald_language', r.ealdLanguage);
      await W.startSession(cls.id, s.id, s.name);
      try { await W.loadLowStimMode(cls.id); } catch (e) {}
      try { await W.loadSupportMode(s.id); } catch (e) {}
      try { await W.getStudentData(); } catch (e) {}
    }, as);
  } else if (as !== 'none') {
    throw new Error('Unknown --as ' + as + ' (use ava, ben, chloe, dev, teacher or none)');
  }

  async function loginSolo() {
    if (STUDENTS.indexOf(as) === -1) throw new Error('loginSolo needs a student');
    await page.goto(base + '/solo', { waitUntil: 'load' });
    const L = await page.evaluate(function () { return __WL_MOCK__.fixtures.logins; });
    const code = L.students[as].code;
    await page.waitForSelector('input', { timeout: 15000 });
    await page.locator('input').first().fill(L.classCode);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    await page.locator('input').first().fill(code);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(opts.wait == null ? 1500 : opts.wait);
  }

  async function shot(file, o) {
    o = o || {};
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    await page.screenshot({ path: file, fullPage: !!(o.full || opts.full) });
    return file;
  }

  async function close() {
    await browser.close();
    if (server) await server.close();
  }

  return { page, context, browser, base, errors, goto, shot, loginSolo, close };
}

module.exports = { openMock };

if (require.main === module) {
  const argv = process.argv.slice(2);
  function arg(name, def) { const i = argv.indexOf('--' + name); return i > -1 ? argv[i + 1] : def; }
  function flag(name) { return argv.indexOf('--' + name) > -1; }
  (async function () {
    const s = await openMock({
      as: arg('as', 'ava'), width: Number(arg('width', 1366)), height: Number(arg('height', 768)),
      lowStim: flag('low-stim'), reducedMotion: flag('reduced-motion'), full: flag('full'),
      wait: arg('wait') ? Number(arg('wait')) : undefined, keepData: !flag('reset') && flag('keep-data'),
      firstVisit: flag('first-visit')
    });
    try {
      if (flag('solo')) await s.loginSolo();
      else await s.goto(arg('page', '/landing'));
      const out = arg('shot', 'mock-shot.png');
      await s.shot(out);
      console.log('Saved ' + out + ' (' + s.page.url().replace(s.base, '') + ')');
      if (s.errors.length) { console.log('Page errors:'); s.errors.forEach(function (e) { console.log('  ' + e); }); }
      else console.log('No page errors.');
    } finally {
      await s.close();
    }
  })().catch(function (e) { console.error(e); process.exit(1); });
}
