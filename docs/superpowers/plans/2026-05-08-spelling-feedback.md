# Spelling Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Spelling Feedback" tab to the teacher dashboard that shows a student's spelling check-in history and generates AI diagnostic feedback via a new Supabase Edge Function.

**Architecture:** Dashboard JS queries `spelling_check_in_results` client-side, expands `results` jsonb in JS, formats a history string, and POSTs it to a new `spelling-feedback` edge function. The edge function verifies teacher auth, calls Anthropic (`claude-sonnet-4-20250514`) with a structured system prompt, and returns JSON feedback. The API key never touches the browser.

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), Anthropic Messages API, vanilla JS (no framework, no build step), dashboard.html inline CSS/JS.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/functions/spelling-feedback/index.ts` | **Create** | Auth verification, Anthropic API call, JSON response |
| `dashboard.html` (CSS `<style>` block) | **Modify** | `.sf-*` component styles |
| `dashboard.html` (`.viewTabs` strip) | **Modify** | Third tab button |
| `dashboard.html` (after `#viewSpelling`) | **Modify** | `#viewFeedback` div |
| `dashboard.html` (`switchView()`) | **Modify** | Handle 'feedback' view |
| `dashboard.html` (before `// ── Boot ──`) | **Modify** | All SF state + JS functions |

---

## Task 1: Edge Function `spelling-feedback`

**Files:**
- Create: `supabase/functions/spelling-feedback/index.ts`

- [ ] **Step 1: Create the edge function file**

Create `supabase/functions/spelling-feedback/index.ts` with the following content. This follows the exact same structure as `analyze-words/index.ts`: same CORS pattern, same auth pattern, same Anthropic fetch call — only the system prompt, request shape, and response parsing differ.

```
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://wordlabs.app',
  'https://morphology-builder.vercel.app',
  'https://nickd135.github.io',
  'http://localhost:8080',
  'http://localhost:3000',
];

function getCorsOrigin(req) {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(req) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const SYSTEM_PROMPT = `You are an expert literacy diagnostician working with Australian primary school teachers. You will be given a student's spelling attempt history. Analyse the data and return a JSON object only — no preamble, no markdown — with this exact structure:
{
  "summary": "2-3 sentence overall diagnostic summary",
  "strengths": [
    { "title": "short title", "detail": "explanation" }
  ],
  "improvements": [
    { "title": "short title", "detail": "explanation", "tag": "Persistent or Recent" }
  ],
  "nextSteps": "1-2 concrete teaching strategies the teacher can use this week"
}

When identifying patterns, categorise errors explicitly as: phonological (vowel sounds, blends, digraphs), morphological (prefixes, suffixes, base words, inflectional endings), or orthographic (silent letters, double consonants, common letter sequences). Name the pattern type in each improvement's title (e.g. "Orthographic: double consonants", "Morphological: -ed suffix dropping").

Tag each improvement as "Persistent" if the error pattern appears across older and recent sessions, or "Recent" if it has emerged in the last 1-2 sessions.

Use Australian English spelling throughout.`;

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'AI not configured' }, 500);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!body.history || typeof body.history !== 'string' || !body.history.trim()) {
    return json({ error: 'Missing or empty history string' }, 400);
  }

  try {
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: body.history }],
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => '');
      return json({ error: 'AI API error (HTTP ' + anthropicResp.status + '): ' + errText.slice(0, 500) }, 502);
    }

    const data = await anthropicResp.json();
    const text = data.content?.[0]?.text || '';
    if (!text) return json({ error: 'Empty response from AI' }, 500);

    let feedback;
    try { feedback = JSON.parse(text); }
    catch { return json({ error: 'Could not parse AI response as JSON' }, 500); }

    return json({ feedback });
  } catch (e) {
    console.error('spelling-feedback error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
});
```

Note: In the actual TypeScript file, add `: Request`, `: unknown`, `: string` type annotations to match the `analyze-words` style. The Deno runtime accepts both with and without annotations.

- [ ] **Step 2: Verify file exists**

```bash
cat supabase/functions/spelling-feedback/index.ts | head -5
```

Expected: shows the import line.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/spelling-feedback/index.ts
git commit -m "feat(edge): add spelling-feedback edge function"
```

---

## Task 2: Dashboard CSS

**Files:**
- Modify: `dashboard.html` — add `.sf-*` styles before the `</style>` closing tag in `<head>`

The closing tag is at the end of the `<style>` block, preceded by `/* Footer: uses wordlab-common.css */`.

- [ ] **Step 1: Add `.sf-*` CSS block**

Find the line `/* Footer: uses wordlab-common.css */` followed by `</style>` and insert before `</style>`:

```
    /* ── Spelling Feedback Tab ── */
    .sf-student-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;cursor:pointer;border:1px solid transparent;transition:all .15s;width:100%;background:none;text-align:left;font-family:'Lexend',sans-serif;}
    .sf-student-item:hover{background:var(--navy-3);}
    .sf-student-item.active{background:var(--indigo-soft);border-color:rgba(99,102,241,.35);}
    .sf-avatar{width:32px;height:32px;border-radius:50%;background:var(--indigo);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;flex-shrink:0;}
    .sf-student-name{flex:1;font-size:13px;font-weight:800;color:var(--text-primary);}
    .sf-session-pill{font-size:10px;font-weight:900;color:var(--text-secondary);background:rgba(255,255,255,.06);border-radius:999px;padding:2px 8px;white-space:nowrap;}
    .sf-session-pill--none{color:var(--muted);opacity:.6;}
    .sf-history-wrap{max-height:320px;overflow-y:auto;border-radius:14px;border:1px solid var(--line);}
    .sf-history-table{width:100%;border-collapse:collapse;font-size:13px;}
    .sf-history-table th{padding:10px 14px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:var(--text-secondary);border-bottom:1px solid var(--line);text-align:left;background:var(--panel);position:sticky;top:0;}
    .sf-history-table td{padding:9px 14px;border-bottom:1px solid var(--line);}
    .sf-history-table tr:last-child td{border-bottom:none;}
    .sf-correct{color:#4ade80;font-weight:900;}
    .sf-incorrect{color:#f87171;font-weight:900;}
    .sf-date{color:var(--muted);font-size:12px;}
    .sf-feedback-card{background:var(--panel);border-radius:16px;border:1px solid var(--line);padding:18px 20px;border-left-width:4px;}
    .sf-feedback-card--summary{border-left-color:#6366f1;}
    .sf-feedback-card--strengths{border-left-color:#4ade80;}
    .sf-feedback-card--improvements{border-left-color:#fbbf24;}
    .sf-feedback-card--nextsteps{border-left-color:#06b6d4;}
    .sf-card-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.22em;margin-bottom:10px;}
    .sf-feedback-card--summary .sf-card-label{color:#818cf8;}
    .sf-feedback-card--strengths .sf-card-label{color:#4ade80;}
    .sf-feedback-card--improvements .sf-card-label{color:#fbbf24;}
    .sf-feedback-card--nextsteps .sf-card-label{color:#06b6d4;}
    .sf-card-text{font-size:14px;color:var(--text-primary);font-weight:500;line-height:1.6;}
    .sf-sub-item{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);}
    .sf-sub-item:first-child{margin-top:0;padding-top:0;border-top:none;}
    .sf-sub-title{font-size:13px;font-weight:900;color:var(--text-primary);margin-bottom:4px;}
    .sf-sub-detail{font-size:13px;color:var(--text-secondary);font-weight:600;line-height:1.5;}
    .sf-tag{display:inline-block;border-radius:999px;padding:2px 9px;font-size:10px;font-weight:900;margin-left:8px;vertical-align:middle;}
    .sf-tag--persistent{background:rgba(248,113,113,.15);color:#f87171;}
    .sf-tag--recent{background:rgba(251,191,36,.15);color:#fbbf24;}
    .sf-generate-btn{border:none;background:var(--indigo);color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:14px;cursor:pointer;font-family:'Lexend',sans-serif;transition:all .15s;display:inline-flex;align-items:center;gap:8px;}
    .sf-generate-btn:hover:not(:disabled){background:#4f46e5;}
    .sf-generate-btn:disabled{opacity:.4;cursor:not-allowed;}
    @keyframes sfSpin{to{transform:rotate(360deg);}}
    .sf-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sfSpin .7s linear infinite;display:inline-block;}
    .sf-empty{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:14px;padding:28px;text-align:center;color:var(--muted);font-size:14px;font-weight:700;}
    .sf-error-card{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:14px;padding:16px 20px;}
    .sf-error-title{font-size:14px;font-weight:900;color:#f87171;margin-bottom:6px;}
    .sf-error-detail{font-size:12px;color:var(--muted);font-weight:600;}
```

- [ ] **Step 2: Verify**

```bash
grep -c "sf-student-item\|sf-generate-btn\|sf-feedback-card" dashboard.html
```

Expected: a number >= 10.

- [ ] **Step 3: Commit**

```bash
git add dashboard.html
git commit -m "feat(dashboard): add .sf-* CSS for Spelling Feedback tab"
```

---

## Task 3: HTML Structure and `switchView` Update

**Files:**
- Modify: `dashboard.html`

- [ ] **Step 1: Add the third tab button**

Find:
```
    <button class="viewTab" id="ssTabBtn" onclick="switchView('spelling',this)" role="tab" aria-selected="false">Class Spelling Sets</button>
  </div>
```

Replace with:
```
    <button class="viewTab" id="ssTabBtn" onclick="switchView('spelling',this)" role="tab" aria-selected="false">Class Spelling Sets</button>
    <button class="viewTab" id="sfTabBtn" onclick="switchView('feedback',this)" role="tab" aria-selected="false">&#x2709; Spelling Feedback</button>
  </div>
```

- [ ] **Step 2: Add the `#viewFeedback` container**

Find:
```
  <div id="viewSpelling" class="hidden">
    <div id="sectionSpellingSets"></div>
  </div>
</div>
</div>
```

Replace with:
```
  <div id="viewSpelling" class="hidden">
    <div id="sectionSpellingSets"></div>
  </div>
  <div id="viewFeedback" class="hidden">
    <div id="sectionSpellingFeedback"></div>
  </div>
</div>
</div>
```

- [ ] **Step 3: Extend `switchView()`**

Find:
```
  document.getElementById('viewGames').classList.toggle('hidden', view !== 'games');
  document.getElementById('viewSpelling').classList.toggle('hidden', view !== 'spelling');

  if (view === 'spelling') renderSpellingSetsTab();
  if (view === 'games') gdRefresh();
```

Replace with:
```
  document.getElementById('viewGames').classList.toggle('hidden', view !== 'games');
  document.getElementById('viewSpelling').classList.toggle('hidden', view !== 'spelling');
  document.getElementById('viewFeedback').classList.toggle('hidden', view !== 'feedback');

  if (view === 'spelling') renderSpellingSetsTab();
  if (view === 'games') gdRefresh();
  if (view === 'feedback') renderSpellingFeedbackTab();
```

- [ ] **Step 4: Verify in browser**

Open the dashboard. Three tabs should appear. Clicking "Spelling Feedback" should show an empty container with no JS errors in the console (`renderSpellingFeedbackTab is not defined` is expected at this stage — it gets added in Task 4).

- [ ] **Step 5: Commit**

```bash
git add dashboard.html
git commit -m "feat(dashboard): add Spelling Feedback tab HTML + switchView"
```

---

## Task 4: State Variables + `sfInitials` + `renderSpellingFeedbackTab`

**Files:**
- Modify: `dashboard.html` — insert JS block before `// ── Boot ──` at the end of the inline `<script>`

The last lines of the script are:
```
// ── Boot ─────────────────────────────────────────────────────────
initDashboard();
```

- [ ] **Step 1: Insert the SF section before the Boot comment**

Find `// ── Boot ─────────────────────────────────────────────────────────` and insert immediately before it:

```
// ── Spelling Feedback Tab ────────────────────────────────────────
var _sfSessionCounts = {};
var _sfSelectedStudentId = null;
var _sfHistory = [];

function sfInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

async function renderSpellingFeedbackTab() {
  var container = document.getElementById('sectionSpellingFeedback');
  if (!container) return;
  container.textContent = '';
  var loading = document.createElement('div');
  loading.className = 'sf-empty';
  loading.textContent = 'Loading students…';
  container.appendChild(loading);

  var students = (currentClass && currentClass.students) || [];
  if (!students.length) {
    container.textContent = '';
    var empty = document.createElement('div');
    empty.className = 'sf-empty';
    empty.textContent = 'No students in this class yet.';
    container.appendChild(empty);
    return;
  }

  _sfSessionCounts = {};
  try {
    var studentIds = students.map(function(s) { return s.id; });
    var ciResult = await dbSb()
      .from('spelling_check_in_results')
      .select('student_id')
      .in('student_id', studentIds);
    if (ciResult.data) {
      ciResult.data.forEach(function(row) {
        _sfSessionCounts[row.student_id] = (_sfSessionCounts[row.student_id] || 0) + 1;
      });
    }
  } catch(e) { console.warn('sfSessionCounts error', e); }

  // Build sidebar student buttons using DOM methods (XSS-safe)
  var sidebar = document.createElement('aside');
  sidebar.className = 'ss-sidebar';
  sidebar.setAttribute('aria-label', 'Student list');

  var titleRow = document.createElement('div');
  titleRow.className = 'ss-sidebar-title';
  var titleSpan = document.createElement('span');
  titleSpan.textContent = 'Students';
  var countSpan = document.createElement('span');
  countSpan.className = 'ss-sidebar-count';
  countSpan.textContent = String(students.length);
  titleRow.appendChild(titleSpan);
  titleRow.appendChild(countSpan);
  sidebar.appendChild(titleRow);

  students.forEach(function(s) {
    var count = _sfSessionCounts[s.id] || 0;
    var btn = document.createElement('button');
    btn.className = 'sf-student-item';
    btn.dataset.id = s.id;
    btn.setAttribute('aria-label', 'View feedback for ' + s.name);
    btn.addEventListener('click', function() { sfSelectStudent(s.id, s.name); });

    var avatar = document.createElement('div');
    avatar.className = 'sf-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = sfInitials(s.name);

    var nameSpan = document.createElement('span');
    nameSpan.className = 'sf-student-name';
    nameSpan.textContent = s.name;

    var pill = document.createElement('span');
    pill.className = 'sf-session-pill' + (count ? '' : ' sf-session-pill--none');
    pill.textContent = count ? count + (count === 1 ? ' session' : ' sessions') : 'No data';

    btn.appendChild(avatar);
    btn.appendChild(nameSpan);
    btn.appendChild(pill);
    sidebar.appendChild(btn);

    if (_sfSelectedStudentId === s.id) btn.classList.add('active');
  });

  var mainPanel = document.createElement('div');
  mainPanel.className = 'ss-main';
  mainPanel.id = 'sfMainPanel';
  var defaultMsg = document.createElement('div');
  defaultMsg.className = 'sf-empty';
  defaultMsg.textContent = 'Select a student from the list to see their spelling history.';
  mainPanel.appendChild(defaultMsg);

  var layout = document.createElement('div');
  layout.className = 'ss-layout';
  layout.appendChild(sidebar);
  layout.appendChild(mainPanel);

  var hero = document.createElement('div');
  hero.className = 'gd-pageHero';
  var heroText = document.createElement('div');
  heroText.className = 'gd-pageHero-text';
  var heroH1 = document.createElement('h1');
  heroH1.innerHTML = '✉ <span class="gd-accent">Spelling Feedback</span>';
  var heroP = document.createElement('p');
  heroP.textContent = 'Select a student to view their check-in history and generate AI diagnostic feedback.';
  heroText.appendChild(heroH1);
  heroText.appendChild(heroP);
  hero.appendChild(heroText);

  container.textContent = '';
  container.appendChild(hero);
  container.appendChild(layout);
}

```

- [ ] **Step 2: Verify**

```bash
grep -n "sfInitials\|renderSpellingFeedbackTab\|_sfSessionCounts" dashboard.html | wc -l
```

Expected: at least 6 lines.

- [ ] **Step 3: Verify in browser**

Click "✉ Spelling Feedback". You should see the page hero and a two-column layout — student list on the left with session count pills, "Select a student..." on the right. No console errors.

- [ ] **Step 4: Commit**

```bash
git add dashboard.html
git commit -m "feat(dashboard): add renderSpellingFeedbackTab with student list"
```

---

## Task 5: `sfSelectStudent` and `sfRenderHistoryPanel`

**Files:**
- Modify: `dashboard.html` — add two functions after `renderSpellingFeedbackTab`, before Boot comment

- [ ] **Step 1: Insert `sfSelectStudent` and `sfRenderHistoryPanel`**

Find the last line of `renderSpellingFeedbackTab` — it ends with `container.appendChild(layout);` followed by `}`. Insert immediately after that closing brace (still before `// ── Boot ──`):

```
async function sfSelectStudent(studentId, studentName) {
  _sfSelectedStudentId = studentId;
  _sfHistory = [];

  document.querySelectorAll('.sf-student-item').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.id === studentId);
  });

  var panel = document.getElementById('sfMainPanel');
  if (!panel) return;
  panel.textContent = '';
  var loadingEl = document.createElement('div');
  loadingEl.className = 'sf-empty';
  loadingEl.textContent = 'Loading history…';
  panel.appendChild(loadingEl);

  try {
    var result = await dbSb()
      .from('spelling_check_in_results')
      .select('created_at, results')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (result.error) throw result.error;

    _sfHistory = [];
    (result.data || []).forEach(function(row) {
      var items = Array.isArray(row.results) ? row.results : [];
      items.forEach(function(item) {
        _sfHistory.push({
          created_at: row.created_at,
          target: item.word || '',
          attempt: item.typed || '',
          correct: item.correct === true || item.correct === 'true',
        });
      });
    });

    sfRenderHistoryPanel(studentName);
  } catch(e) {
    panel.textContent = '';
    var errCard = document.createElement('div');
    errCard.className = 'sf-error-card';
    var errTitle = document.createElement('div');
    errTitle.className = 'sf-error-title';
    errTitle.textContent = 'Could not load history.';
    var errDetail = document.createElement('div');
    errDetail.className = 'sf-error-detail';
    errDetail.textContent = String(e);
    errCard.appendChild(errTitle);
    errCard.appendChild(errDetail);
    panel.appendChild(errCard);
  }
}

function sfRenderHistoryPanel(studentName) {
  var panel = document.getElementById('sfMainPanel');
  if (!panel) return;
  panel.textContent = '';

  var hasHistory = _sfHistory.length > 0;

  if (!hasHistory) {
    var emptyEl = document.createElement('div');
    emptyEl.className = 'sf-empty';
    emptyEl.textContent = 'No spelling check-in data yet for this student.';
    panel.appendChild(emptyEl);
  } else {
    var wrap = document.createElement('div');
    wrap.className = 'sf-history-wrap';
    var table = document.createElement('table');
    table.className = 'sf-history-table';
    table.setAttribute('aria-label', 'Spelling attempt history for ' + studentName);

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    ['Target word','Student attempt','Result','Date'].forEach(function(h, i) {
      var th = document.createElement('th');
      th.textContent = h;
      if (i === 2) th.style.textAlign = 'center';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    _sfHistory.forEach(function(item) {
      var d = new Date(item.created_at);
      var dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      var tr = document.createElement('tr');

      var tdTarget = document.createElement('td');
      tdTarget.style.fontWeight = '800';
      tdTarget.textContent = item.target;

      var tdAttempt = document.createElement('td');
      tdAttempt.style.fontFamily = 'monospace';
      tdAttempt.textContent = item.attempt || '—';

      var tdResult = document.createElement('td');
      tdResult.style.textAlign = 'center';
      var indicator = document.createElement('span');
      indicator.className = item.correct ? 'sf-correct' : 'sf-incorrect';
      indicator.setAttribute('aria-label', item.correct ? 'correct' : 'incorrect');
      indicator.textContent = item.correct ? '✓' : '✗';
      tdResult.appendChild(indicator);

      var tdDate = document.createElement('td');
      tdDate.className = 'sf-date';
      tdDate.textContent = dateStr;

      tr.appendChild(tdTarget);
      tr.appendChild(tdAttempt);
      tr.appendChild(tdResult);
      tr.appendChild(tdDate);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    panel.appendChild(wrap);
  }

  var btnWrap = document.createElement('div');
  btnWrap.style.marginTop = '20px';
  var genBtn = document.createElement('button');
  genBtn.className = 'sf-generate-btn';
  genBtn.id = 'sfGenerateBtn';
  genBtn.disabled = !hasHistory;
  genBtn.setAttribute('aria-disabled', String(!hasHistory));
  genBtn.addEventListener('click', sfGenerateFeedback);

  var btnIcon = document.createElement('span');
  btnIcon.id = 'sfGenerateBtnIcon';
  btnIcon.textContent = '🔍';
  var btnText = document.createElement('span');
  btnText.id = 'sfGenerateBtnText';
  btnText.textContent = 'Generate Feedback';
  genBtn.appendChild(btnIcon);
  genBtn.appendChild(btnText);
  btnWrap.appendChild(genBtn);
  panel.appendChild(btnWrap);

  var outputDiv = document.createElement('div');
  outputDiv.id = 'sfFeedbackOutput';
  outputDiv.style.cssText = 'margin-top:24px;display:flex;flex-direction:column;gap:16px;';
  outputDiv.setAttribute('aria-live', 'polite');
  panel.appendChild(outputDiv);
}

```

- [ ] **Step 2: Verify in browser**

Click "✉ Spelling Feedback", then click a student with check-in data. The right panel should show a scrollable table of their attempts (target word, typed attempt, ✓/✗, date). The "Generate Feedback" button should be enabled (indigo). Click a student with no data — the button should be greyed out.

- [ ] **Step 3: Commit**

```bash
git add dashboard.html
git commit -m "feat(dashboard): add sfSelectStudent and word history panel"
```

---

## Task 6: `sfGenerateFeedback` and `sfRenderFeedbackCards`

**Files:**
- Modify: `dashboard.html` — add two final functions after `sfRenderHistoryPanel`, before Boot comment

- [ ] **Step 1: Insert `sfGenerateFeedback` and `sfRenderFeedbackCards`**

Find the closing `}` of `sfRenderHistoryPanel` and insert immediately after it (before `// ── Boot ──`):

```
async function sfGenerateFeedback() {
  var btn = document.getElementById('sfGenerateBtn');
  var icon = document.getElementById('sfGenerateBtnIcon');
  var textEl = document.getElementById('sfGenerateBtnText');
  var output = document.getElementById('sfFeedbackOutput');
  if (!btn || !output) return;

  var historyStr = 'Student spelling history (oldest to most recent):\n' +
    _sfHistory.map(function(item) {
      var d = new Date(item.created_at);
      var dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
      return dateStr + ' | target: ' + item.target +
        ' | typed: ' + (item.attempt || '') +
        ' | correct: ' + item.correct;
    }).join('\n');

  btn.disabled = true;
  icon.textContent = '';
  var spinner = document.createElement('span');
  spinner.className = 'sf-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  icon.appendChild(spinner);
  textEl.textContent = 'Analysing spelling patterns…';
  output.textContent = '';

  try {
    var sessionResult = await WordLabData._sb().auth.getSession();
    var session = sessionResult.data && sessionResult.data.session;
    if (!session) throw new Error('Session expired. Please reload the page.');

    var resp = await fetch('https://kdpavfrzmmzknqfpodrl.supabase.co/functions/v1/spelling-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token,
      },
      body: JSON.stringify({ history: historyStr }),
    });

    var respText = await resp.text();
    var parsed;
    try { parsed = JSON.parse(respText); }
    catch(pe) { throw new Error('Could not parse server response.'); }

    if (!resp.ok) throw new Error(parsed.error || 'AI service error (HTTP ' + resp.status + ')');

    var fb = parsed.feedback;
    if (!fb || typeof fb.summary !== 'string') throw new Error('Unexpected response format from AI.');

    sfRenderFeedbackCards(fb, output);
  } catch(e) {
    output.textContent = '';
    var errCard = document.createElement('div');
    errCard.className = 'sf-error-card';
    var errTitle = document.createElement('div');
    errTitle.className = 'sf-error-title';
    errTitle.textContent = 'Could not generate feedback. Please try again.';
    var errDetail = document.createElement('div');
    errDetail.className = 'sf-error-detail';
    errDetail.textContent = String(e);
    errCard.appendChild(errTitle);
    errCard.appendChild(errDetail);
    output.appendChild(errCard);
  } finally {
    btn.disabled = false;
    icon.textContent = '🔍';
    textEl.textContent = 'Generate Feedback';
  }
}

function sfRenderFeedbackCards(fb, container) {
  container.textContent = '';

  // Summary card
  var summaryCard = document.createElement('div');
  summaryCard.className = 'sf-feedback-card sf-feedback-card--summary';
  var summaryLabel = document.createElement('div');
  summaryLabel.className = 'sf-card-label';
  summaryLabel.textContent = 'Summary';
  var summaryText = document.createElement('div');
  summaryText.className = 'sf-card-text';
  summaryText.textContent = fb.summary;
  summaryCard.appendChild(summaryLabel);
  summaryCard.appendChild(summaryText);
  container.appendChild(summaryCard);

  // Strengths card
  if (fb.strengths && fb.strengths.length) {
    var strCard = document.createElement('div');
    strCard.className = 'sf-feedback-card sf-feedback-card--strengths';
    var strLabel = document.createElement('div');
    strLabel.className = 'sf-card-label';
    strLabel.textContent = 'Strengths';
    strCard.appendChild(strLabel);
    fb.strengths.forEach(function(s) {
      var item = document.createElement('div');
      item.className = 'sf-sub-item';
      var title = document.createElement('div');
      title.className = 'sf-sub-title';
      title.textContent = s.title;
      var detail = document.createElement('div');
      detail.className = 'sf-sub-detail';
      detail.textContent = s.detail;
      item.appendChild(title);
      item.appendChild(detail);
      strCard.appendChild(item);
    });
    container.appendChild(strCard);
  }

  // Improvements card
  if (fb.improvements && fb.improvements.length) {
    var impCard = document.createElement('div');
    impCard.className = 'sf-feedback-card sf-feedback-card--improvements';
    var impLabel = document.createElement('div');
    impLabel.className = 'sf-card-label';
    impLabel.textContent = 'Areas for Improvement';
    impCard.appendChild(impLabel);
    fb.improvements.forEach(function(imp) {
      var item = document.createElement('div');
      item.className = 'sf-sub-item';
      var titleRow = document.createElement('div');
      titleRow.className = 'sf-sub-title';
      titleRow.textContent = imp.title;
      if (imp.tag) {
        var tag = document.createElement('span');
        tag.className = 'sf-tag ' + (imp.tag === 'Persistent' ? 'sf-tag--persistent' : 'sf-tag--recent');
        tag.textContent = imp.tag;
        titleRow.appendChild(tag);
      }
      var detail = document.createElement('div');
      detail.className = 'sf-sub-detail';
      detail.textContent = imp.detail;
      item.appendChild(titleRow);
      item.appendChild(detail);
      impCard.appendChild(item);
    });
    container.appendChild(impCard);
  }

  // Next Steps card
  if (fb.nextSteps) {
    var nsCard = document.createElement('div');
    nsCard.className = 'sf-feedback-card sf-feedback-card--nextsteps';
    var nsLabel = document.createElement('div');
    nsLabel.className = 'sf-card-label';
    nsLabel.textContent = 'Next Steps';
    var nsText = document.createElement('div');
    nsText.className = 'sf-card-text';
    nsText.textContent = fb.nextSteps;
    nsCard.appendChild(nsLabel);
    nsCard.appendChild(nsText);
    container.appendChild(nsCard);
  }
}

```

Note: All user-supplied content is set via `.textContent` (not innerHTML), making it XSS-safe by design. The only innerHTML usage is `heroH1.innerHTML` in Task 4 for the static heading with a hardcoded `<span>` — not user data.

- [ ] **Step 2: Verify all six SF functions exist**

```bash
grep -c "^function sf\|^async function sf" dashboard.html
```

Expected: 6 (sfInitials, renderSpellingFeedbackTab, sfSelectStudent, sfRenderHistoryPanel, sfGenerateFeedback, sfRenderFeedbackCards). Note: `renderSpellingFeedbackTab` starts with `renderSpelling`, not `sf`, so adjust the grep:

```bash
grep "^function sf\|^async function sf\|^async function renderSpellingFeedbackTab\|^function renderSpellingFeedbackTab" dashboard.html
```

Expected: six matching lines.

- [ ] **Step 3: End-to-end browser test**

1. Click "✉ Spelling Feedback" tab
2. Select a student with at least one completed check-in session
3. Confirm history table renders (target word, attempt, ✓/✗, date)
4. Click "Generate Feedback"
5. Confirm spinner + "Analysing spelling patterns…" shows
6. After ~5–10s, confirm four cards appear: indigo Summary, green Strengths, amber Improvements (with Persistent/Recent pills), cyan Next Steps
7. Confirm button resets to "Generate Feedback" after completion
8. Select a student with no data — button is greyed out, empty state shown
9. Switch tabs and return — panel resets cleanly

- [ ] **Step 4: Commit**

```bash
git add dashboard.html
git commit -m "feat(dashboard): add sfGenerateFeedback and feedback card renderer"
```

---

## Task 7: Deploy Edge Function and Push

- [ ] **Step 1: Deploy the edge function**

```bash
supabase functions deploy spelling-feedback --project-ref kdpavfrzmmzknqfpodrl
```

If the Supabase CLI is not installed, use `npx`:
```bash
npx supabase functions deploy spelling-feedback --project-ref kdpavfrzmmzknqfpodrl
```

Expected: success message confirming `spelling-feedback` is deployed.

- [ ] **Step 2: Confirm function responds (unauthenticated request → 401)**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://kdpavfrzmmzknqfpodrl.supabase.co/functions/v1/spelling-feedback \
  -H "Content-Type: application/json" \
  -d '{"history":"test"}'
```

Expected: `401`

- [ ] **Step 3: Push and verify auto-deploy**

```bash
git push
```

Expected: Vercel auto-deploys within ~60 seconds. Visit `https://wordlabs.app/dashboard.html` to confirm the three tabs are visible.

---

## Spec Coverage Checklist

| Spec requirement | Task |
|-----------------|------|
| Third tab "✉ Spelling Feedback" | 3 |
| Left panel: initials avatar, name, session count | 4 |
| Right panel: word history list (target, attempt, ✓/✗, date) | 5 |
| Generate Feedback button + spinner + "Analysing…" text | 5 & 6 |
| Supabase query — expand results jsonb in JS | 5 |
| Edge function: CORS, teacher auth, 400/401/502 error responses | 1 |
| System prompt with error category naming | 1 |
| model `claude-sonnet-4-20250514`, max_tokens 1500 | 1 |
| Summary card — indigo left border | 6 |
| Strengths card — green left border | 6 |
| Improvements card — amber left border + Persistent/Recent pills | 6 |
| Next Steps card — cyan left border | 6 |
| Error state cards (all scenarios) | 1 & 6 |
| Empty state (no data) | 5 |
| Dark navy `.sf-*` styles matching dashboard theme | 2 |
| `sfInitials` handles single-name and two-name students | 4 |
| Session counts aggregated in one query, counted in JS | 4 |
| All user content via textContent (XSS-safe) | 4–6 |
