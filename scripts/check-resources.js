#!/usr/bin/env node
/**
 * SOLO Tracker — Resource health checker (standalone, first slice of the
 * Suggestion Engine described in docs/SUGGESTION_ENGINE.md, section 3C).
 *
 * Read-only. Pulls every student-facing resource URL from the two canonical
 * sources, checks each for liveness, and writes/refreshes the "Resource health"
 * section of SUGGESTIONS.md at the repo root. It never edits content or the DB.
 *
 *   Source 1 — the Supabase `resources` table (what the app actually reads).
 *   Source 2 — the hardcoded RESOURCES + BEYOND blocks in solo/index.html
 *              (the per-key / Beyond-tab fallback).
 *
 * Canonicality mirrors the app exactly (spec 3.4):
 *   liveResources[key] = DB rows for that key, ELSE code RESOURCES[key].
 *   BEYOND[unit].resources are code-only and always live (the ⭐ Beyond tab).
 *
 * Verification method follows SOLO_PIPELINE_SPEC.md 3.5:
 *   - YouTube  -> oEmbed API (returns title for live videos, errors on dead/private)
 *   - PDF/site -> HTTP HEAD then GET with a browser UA
 *   - Corbettmaths 403s non-browser requests, so 403 there = "blocked, manual check",
 *     not dead.
 *
 * Usage:  node scripts/check-resources.js
 * Env overrides (optional): SUPABASE_URL, SUPABASE_ANON_KEY.
 * Defaults are read from solo/index.html (the anon key is intentionally public).
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOLO_HTML = path.join(ROOT, 'solo', 'index.html');
const OUT_FILE = path.join(ROOT, 'SUGGESTIONS.md');

const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const PAYWALL_HINTS = ['subscribe to continue', 'sign in to continue', 'create a free account', 'start your free trial', 'members only'];

// ── 1. Extract a top-level object literal from the HTML by brace-matching ─────
// Respects string literals (', ", `) so braces inside strings don't confuse it.
function extractObjectLiteral(src, declRegex) {
  const m = src.match(declRegex);
  if (!m) throw new Error('declaration not found: ' + declRegex);
  let i = src.indexOf('{', m.index);
  if (i < 0) throw new Error('no opening brace for ' + declRegex);
  const start = i;
  let depth = 0, quote = null, prev = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote && prev !== '\\') quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
    prev = c === '\\' && prev === '\\' ? '' : c; // collapse escaped backslashes
  }
  throw new Error('unbalanced braces for ' + declRegex);
}

function evalObject(literal) {
  // The blocks are JS object literals (unquoted keys, trailing commas) — not JSON.
  // eslint-disable-next-line no-new-func
  return Function('return (' + literal + ');')();
}

// ── 2. Read config + code resources from solo/index.html ─────────────────────
function loadFromHtml() {
  const src = fs.readFileSync(SOLO_HTML, 'utf8');
  const url = process.env.SUPABASE_URL ||
    (src.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  const key = process.env.SUPABASE_ANON_KEY ||
    (src.match(/SUPABASE_ANON\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  if (!url || !key) throw new Error('Could not resolve Supabase URL / anon key');

  const RESOURCES = evalObject(extractObjectLiteral(src, /var\s+RESOURCES\s*=/));
  const BEYOND = evalObject(extractObjectLiteral(src, /var\s+BEYOND\s*=/));
  return { url, key, RESOURCES, BEYOND };
}

// ── 3. Pull every row from the Supabase resources table (paginated) ──────────
async function fetchDbResources(url, key) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const ep = `${url}/rest/v1/resources?select=unit_id,outcome_id,type,label,url,scope&limit=${pageSize}&offset=${offset}&order=unit_id,outcome_id`;
    const res = await fetch(ep, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`resources fetch failed: HTTP ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

// ── 4. Build the live resource set (per app canonicality) ────────────────────
function buildLiveSet(db, RESOURCES, BEYOND) {
  // DB rows grouped by `${unit}_${outcome}` key, URL-bearing only.
  const dbByKey = {};
  for (const r of db) {
    if (r.type === 'question' || !r.url) continue;
    const key = `${r.unit_id}_${r.outcome_id}`;
    (dbByKey[key] = dbByKey[key] || []).push({ label: r.label, url: r.url, type: r.type });
  }

  const items = [];          // {unit, outcome, key, source, label, url, type}
  const conflicts = [];      // keys where DB rows AND code RESOURCES both exist
  const seenKeys = new Set([...Object.keys(dbByKey), ...Object.keys(RESOURCES || {})]);

  for (const key of seenKeys) {
    const [unit, ...rest] = key.split('_');
    const outcome = rest.join('_');
    const hasDb = (dbByKey[key] || []).length > 0;
    const hasCode = (RESOURCES[key] || []).length > 0;
    if (hasDb && hasCode) conflicts.push({ key, db: dbByKey[key].length, code: RESOURCES[key].length });
    const live = hasDb ? dbByKey[key] : (RESOURCES[key] || []);
    for (const r of live) {
      if (!r.url) continue;
      items.push({ unit, outcome, key, source: hasDb ? 'db' : 'code', label: r.label, url: r.url, type: r.type });
    }
  }

  // BEYOND tab resources — code-only, always live.
  for (const unit of Object.keys(BEYOND || {})) {
    for (const r of (BEYOND[unit].resources || [])) {
      if (!r.url) continue;
      items.push({ unit, outcome: 'beyond', key: `${unit}_beyond`, source: 'code', label: r.label, url: r.url, type: r.type });
    }
  }
  return { items, conflicts };
}

// ── 5. Health checks ─────────────────────────────────────────────────────────
function ytId(u) {
  const m = u.match(/(?:youtube\.com\/watch\?[^#]*\bv=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

async function checkOne(item) {
  const url = item.url;
  const id = ytId(url);
  try {
    if (id) {
      const t = withTimeout(TIMEOUT_MS);
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { signal: t.signal });
      t.done();
      if (res.ok) { const j = await res.json(); return { ...item, status: 'OK', detail: `▶ ${j.title} — ${j.author_name}` }; }
      if (res.status === 401 || res.status === 404) return { ...item, status: 'DEAD', detail: 'YouTube video removed or private (oEmbed ' + res.status + ')' };
      return { ...item, status: 'UNREACHABLE', detail: 'oEmbed HTTP ' + res.status };
    }
    // Non-YouTube: HEAD, then GET fallback.
    let res, method = 'HEAD';
    let t = withTimeout(TIMEOUT_MS);
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: t.signal, headers: { 'User-Agent': UA } });
    } catch (_) { res = null; }
    t.done();
    if (!res || res.status === 405 || res.status === 403 || res.status >= 500) {
      method = 'GET';
      t = withTimeout(TIMEOUT_MS);
      try {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: t.signal, headers: { 'User-Agent': UA, Range: 'bytes=0-4096' } });
      } catch (e) { t.done(); return { ...item, status: 'UNREACHABLE', detail: 'fetch error: ' + (e.code || e.name || e.message) }; }
      t.done();
    }
    const code = res.status;
    const host = (() => { try { return new URL(res.url || url).host; } catch { return ''; } })();

    if (code === 403 && /corbettmaths\.com/i.test(host)) return { ...item, status: 'BLOCKED', detail: 'Corbettmaths bot-blocks non-browser requests (likely fine — open manually)' };
    if (code === 403 || code === 401) return { ...item, status: 'BLOCKED', detail: `HTTP ${code} (auth/bot wall — manual check)` };
    if (code === 404 || code === 410) return { ...item, status: 'DEAD', detail: `HTTP ${code}` };
    if (code >= 400) return { ...item, status: 'UNREACHABLE', detail: `HTTP ${code}` };

    // Light paywall heuristic on HTML responses only.
    if (method === 'GET' && /text\/html/i.test(res.headers.get('content-type') || '')) {
      const body = (await res.text()).slice(0, 6000).toLowerCase();
      const hit = PAYWALL_HINTS.find(h => body.includes(h));
      if (hit) return { ...item, status: 'PAYWALL_SUSPECT', detail: `page text contains "${hit}"` };
    }
    return { ...item, status: 'OK', detail: `HTTP ${code}` };
  } catch (e) {
    return { ...item, status: 'UNREACHABLE', detail: 'error: ' + (e.code || e.name || e.message) };
  }
}

async function runPool(items, worker, concurrency) {
  const out = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) { const i = next++; out[i] = await worker(items[i]); }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  return out;
}

// ── 6. Report ─────────────────────────────────────────────────────────────────
function findDupUrls(items) {
  const byKey = {};
  for (const it of items) (byKey[it.key] = byKey[it.key] || []).push(it);
  const dups = [];
  for (const [key, list] of Object.entries(byKey)) {
    const seen = {};
    for (const it of list) seen[it.url] = (seen[it.url] || 0) + 1;
    for (const [u, n] of Object.entries(seen)) if (n > 1) dups.push({ key, url: u, count: n });
  }
  return dups;
}

function fmtRows(results, status) {
  const rows = results.filter(r => r.status === status)
    .sort((a, b) => (a.unit + a.outcome).localeCompare(b.unit + b.outcome));
  if (!rows.length) return '_None._\n';
  return rows.map(r =>
    `- [ ] **${r.unit}_${r.outcome}** (${r.source}) — ${r.detail}\n  - ${r.label}\n  - ${r.url}`
  ).join('\n') + '\n';
}

function buildReport(results, conflicts, dups, dateStr) {
  const n = results.length;
  const count = s => results.filter(r => r.status === s).length;
  const dead = count('DEAD'), unreach = count('UNREACHABLE'), blocked = count('BLOCKED'),
        paywall = count('PAYWALL_SUSPECT'), ok = count('OK');

  return `# Word Labs — Suggestions

> Auto-generated by \`scripts/check-resources.js\`. Read-only suggestions for Nick — nothing
> here was changed automatically. Tick items as you action them; the next run regenerates this file.

**Generated:** ${dateStr}

---

## Resource health (SOLO Tracker)

Checked **${n}** live student-facing resource URLs (the set the app actually serves — DB rows
where present, hardcoded \`RESOURCES\`/\`BEYOND\` otherwise).

| Result | Count |
|---|---|
| ✅ OK | ${ok} |
| ❌ Dead (fix) | ${dead} |
| ⚠️ Unreachable (manual check) | ${unreach} |
| 🔒 Blocked / bot-walled (likely ok) | ${blocked} |
| 💲 Paywall suspected | ${paywall} |

### ❌ Dead links — replace these
These returned 404/410 or a removed/private YouTube video. Find a working equivalent
(per spec 3.5) and update the canonical source for that outcome.

${fmtRows(results, 'DEAD')}
### ⚠️ Unreachable — check manually
Timed out, errored, or returned an odd status. Could be transient; open in a browser.

${fmtRows(results, 'UNREACHABLE')}
### 💲 Paywall suspected — verify still free
Loaded, but the page text mentioned subscribing/signing in. Confirm it's still free for students.

${fmtRows(results, 'PAYWALL_SUSPECT')}
### 🔒 Blocked / bot-walled — almost certainly fine
Servers (notably Corbettmaths) reject non-browser requests with 403. Listed for completeness;
a quick browser open confirms them.

${fmtRows(results, 'BLOCKED')}
### ♻️ DB-vs-code conflicts
These outcomes have rows in the Supabase \`resources\` table **and** a hardcoded \`RESOURCES\`
entry. The app uses the DB rows; the code copy is dead weight and risks the spec-3.4 gotcha.
Pick one canonical source per outcome.

${conflicts.length ? conflicts.sort((a,b)=>a.key.localeCompare(b.key)).map(c => `- [ ] **${c.key}** — ${c.db} DB row(s) override ${c.code} hardcoded entry/entries`).join('\n') + '\n' : '_None._\n'}
### 🔁 Duplicate URLs within an outcome
The same link appears more than once under one outcome (spec says no duplicates per outcome).

${dups.length ? dups.sort((a,b)=>a.key.localeCompare(b.key)).map(d => `- [ ] **${d.key}** — ${d.url} (×${d.count})`).join('\n') + '\n' : '_None._\n'}
---

## Other sections — not yet implemented

These are scoped in \`docs/SUGGESTION_ENGINE.md\` and will populate in later iterations:

- **Show question fail rates by outcome** — calibration flags (needs \`solo_show_attempts\` analysis).
- **Grow lesson drop-off** — proxy via \`solo_reflections\` coverage (instrumentation as fast-follow).
- **Word Labs engagement** — never-played activities, accuracy outliers, retention decay, badge spread.
`;
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  const { url, key, RESOURCES, BEYOND } = loadFromHtml();
  console.error(`[check-resources] loaded ${Object.keys(RESOURCES).length} code RESOURCES keys, ${Object.keys(BEYOND).length} BEYOND units`);
  const db = await fetchDbResources(url, key);
  console.error(`[check-resources] fetched ${db.length} DB resource rows`);

  const { items, conflicts } = buildLiveSet(db, RESOURCES, BEYOND);
  console.error(`[check-resources] ${items.length} live URLs to check, ${conflicts.length} DB/code conflicts`);

  const results = await runPool(items, checkOne, CONCURRENCY);
  const dups = findDupUrls(items);

  const dateStr = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  fs.writeFileSync(OUT_FILE, buildReport(results, conflicts, dups, dateStr));

  const dead = results.filter(r => r.status === 'DEAD').length;
  console.error(`[check-resources] done. ${dead} dead, ${results.filter(r=>r.status==='UNREACHABLE').length} unreachable. Wrote ${path.relative(ROOT, OUT_FILE)}`);
})().catch(e => { console.error('[check-resources] FATAL', e); process.exit(1); });
