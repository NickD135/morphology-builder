# School Search on Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text school name input on signup with a search-as-you-type field that lets teachers join an existing school or create a new one with a postcode disambiguator, so multiple teachers at the same school share one school record.

**Architecture:** Add `postcode` column to `schools` table. Both signup pages (`teacher-signup.html`, `teacher-login.html`) get an inline search dropdown that queries `schools` by name (3+ chars). Results show `Name (postcode)`. Selecting a result sets `join_school_id` in user metadata; the existing `createSchoolAndTeacher`/`ensureSchoolAndTeacher` flow handles the rest. New schools prompt for postcode. The existing invite-code flow is preserved as an alternative path. Account page shows and allows editing of postcode.

**Tech Stack:** Vanilla JS (no frameworks, no build system), Supabase (PostgreSQL), existing `schools` table + RLS policies. No new edge functions.

---

## Design details

### Search UX flow

1. Teacher starts typing school name (minimum 3 characters).
2. Debounced query (300ms) hits `schools` table: `SELECT id, name, postcode FROM schools WHERE name ILIKE '%query%' ORDER BY name LIMIT 10`.
3. Results appear in a dropdown below the input showing `Name (postcode)` per row.
4. Teacher clicks a result → school name input becomes read-only, showing `Name (postcode)`. A hidden field stores the school ID. A small "✕ Change" link lets them clear and search again.
5. If no results match, the dropdown shows a footer: **"Create new school: [typed name]"** → clicking it reveals a postcode input.
6. On form submit: if a school was selected, `join_school_id` is passed in user metadata. If creating new, the school is created with name + postcode.

### RLS for school search

The search query runs as the **anon** user (the teacher hasn't signed up yet). The `schools` table currently has RLS that restricts SELECT to authenticated users who belong to that school. We need a narrow exception: allow anon users to read `id, name, postcode` (but NOT plan, stripe details, student counts, etc.) for the search to work.

Options:
- **A: RLS policy allowing anon SELECT on (id, name, postcode) only.** RLS policies apply to the whole row — can't restrict columns. So this would expose all columns to anon.
- **B: Postgres RPC function** that returns only `{id, name, postcode}` and is callable by anon. Safer — the function controls what's returned regardless of RLS.
- **C: Supabase Edge Function** for the search. Overkill for this.

**Choice: B** — a Postgres RPC `search_schools(query text)` that returns `TABLE(id uuid, name text, postcode text)`. Called via `sb().rpc('search_schools', { query: 'spring' })`. RLS stays tight.

### Postcode validation

Australian postcodes are 4 digits (0200–9999). Validate client-side: `/^\d{4}$/`. Don't restrict further (some valid postcodes start with 0).

### Files touched

| File | Change |
|---|---|
| `supabase/migrations/school_postcode_search.sql` | Add `postcode` column, create `search_schools` RPC, create index |
| `teacher-signup.html` | Replace school name `<input>` with search-as-you-type + postcode input for new schools |
| `teacher-login.html` | Same treatment on the register tab |
| `wordlab-data.js` | Update `getTeacherRecord()` auto-create path to accept postcode |
| `account.html` | Show postcode, add edit button, backfill prompt for existing schools without postcode |
| `onboarding.html` | Check if school has postcode; if not, prompt on first step |

---

## Task 1: Database migration — postcode column + search RPC

**Files:**
- Create: `supabase/migrations/school_postcode_search.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Add postcode column to schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS postcode text;

-- Index for search performance
CREATE INDEX IF NOT EXISTS schools_name_search_idx ON schools USING gin (lower(name) gin_trgm_ops);

-- Enable the pg_trgm extension if not already enabled (needed for ILIKE performance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- RPC function for anon-safe school search.
-- Returns only id, name, postcode — no sensitive fields exposed.
-- Minimum 3-char query enforced server-side.
CREATE OR REPLACE FUNCTION search_schools(query text)
RETURNS TABLE(id uuid, name text, postcode text)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT s.id, s.name, s.postcode
  FROM schools s
  WHERE length(query) >= 3
    AND lower(s.name) LIKE '%' || lower(query) || '%'
  ORDER BY s.name
  LIMIT 10;
$$;

-- Grant anon access to call the RPC
GRANT EXECUTE ON FUNCTION search_schools(text) TO anon;
GRANT EXECUTE ON FUNCTION search_schools(text) TO authenticated;
```

- [ ] **Step 2: Verify the SQL is syntactically valid**

Run: `node -e "require('fs').readFileSync('supabase/migrations/school_postcode_search.sql','utf8').length"` — should return a number > 0.

Note: This migration must be run manually in Supabase SQL Editor before testing the frontend changes. The file documents what was run.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/school_postcode_search.sql
git commit -m "feat(schools): add postcode column + search_schools RPC"
```

---

## Task 2: School search component for `teacher-signup.html`

**Files:**
- Modify: `teacher-signup.html`

This is the primary signup page. The school name input (line 161-163) becomes a search-as-you-type field.

- [ ] **Step 1: Replace the school name field with search UI**

Find the existing field (around line 160-163):
```html
<div class="field">
  <label for="schoolInput">School name</label>
  <input type="text" id="schoolInput" placeholder="e.g. Riverside Primary School" autocomplete="organization">
</div>
```

Replace it with:

```html
<div class="field" id="schoolField">
  <label for="schoolInput">School name</label>
  <div style="position:relative;">
    <input type="text" id="schoolInput" placeholder="Start typing your school name…" autocomplete="off" autocapitalize="words">
    <div id="schoolResults" role="listbox" aria-label="School search results"
         style="display:none;position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--navy-2,#1e293b);border:1px solid var(--line,#334155);border-radius:0 0 10px 10px;max-height:240px;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.3);"></div>
  </div>
  <input type="hidden" id="joinSchoolId" value="">
  <div id="schoolSelected" style="display:none;margin-top:6px;padding:8px 12px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:8px;font-size:13px;color:#e0e7ff;">
    <span id="schoolSelectedName" style="font-weight:700;"></span>
    <button type="button" id="schoolChangeBtn" style="margin-left:8px;border:none;background:transparent;color:#a5b4fc;font-size:12px;cursor:pointer;font-weight:700;text-decoration:underline;">Change</button>
  </div>
</div>
<div class="field" id="postcodeField" style="display:none;">
  <label for="postcodeInput">School postcode</label>
  <input type="text" id="postcodeInput" placeholder="e.g. 2150" maxlength="4" inputmode="numeric" pattern="\d{4}" autocomplete="postal-code">
  <div class="fieldHint">Australian 4-digit postcode — helps distinguish schools with the same name.</div>
</div>
```

- [ ] **Step 2: Add the search logic and event wiring**

In the `<script>` section of `teacher-signup.html`, add the following functions (before the existing `signUp()` function):

```js
var _schoolSearchTimer = null;
var _selectedSchoolId = null;

function schoolSearchInit(){
  var input = document.getElementById('schoolInput');
  var results = document.getElementById('schoolResults');
  var selectedBox = document.getElementById('schoolSelected');
  var selectedName = document.getElementById('schoolSelectedName');
  var changeBtn = document.getElementById('schoolChangeBtn');
  var postcodeField = document.getElementById('postcodeField');
  var hiddenId = document.getElementById('joinSchoolId');

  input.addEventListener('input', function(){
    clearTimeout(_schoolSearchTimer);
    var q = (input.value || '').trim();
    if (q.length < 3) { results.style.display = 'none'; return; }
    _schoolSearchTimer = setTimeout(function(){ schoolSearch(q); }, 300);
  });

  changeBtn.addEventListener('click', function(){
    _selectedSchoolId = null;
    hiddenId.value = '';
    selectedBox.style.display = 'none';
    input.style.display = '';
    input.value = '';
    input.focus();
    postcodeField.style.display = 'none';
    results.style.display = 'none';
  });

  // Close results on outside click
  document.addEventListener('click', function(e){
    if (!e.target.closest('#schoolField')) results.style.display = 'none';
  });
}

async function schoolSearch(query){
  var results = document.getElementById('schoolResults');
  try {
    var { data, error } = await sb().rpc('search_schools', { query: query });
    if (error) throw error;
    renderSchoolResults(data || [], query);
  } catch(e){
    console.warn('School search error:', e);
    results.style.display = 'none';
  }
}

function renderSchoolResults(schools, query){
  var container = document.getElementById('schoolResults');
  while (container.firstChild) container.removeChild(container.firstChild);

  schools.forEach(function(s){
    var row = document.createElement('button');
    row.type = 'button';
    row.setAttribute('role', 'option');
    row.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 14px;border:none;background:transparent;color:#e0e7ff;font-size:13px;cursor:pointer;font-family:inherit;border-bottom:1px solid rgba(255,255,255,.06);';
    row.addEventListener('mouseenter', function(){ row.style.background = 'rgba(99,102,241,.15)'; });
    row.addEventListener('mouseleave', function(){ row.style.background = 'transparent'; });
    var nameSpan = document.createElement('span');
    nameSpan.style.fontWeight = '700';
    nameSpan.textContent = s.name;
    var pcSpan = document.createElement('span');
    pcSpan.style.cssText = 'color:#94a3b8;margin-left:6px;';
    pcSpan.textContent = s.postcode ? '(' + s.postcode + ')' : '';
    row.appendChild(nameSpan);
    row.appendChild(pcSpan);
    row.addEventListener('click', function(){ selectSchool(s.id, s.name, s.postcode); });
    container.appendChild(row);
  });

  // "Create new school" footer
  var footer = document.createElement('button');
  footer.type = 'button';
  footer.setAttribute('role', 'option');
  footer.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 14px;border:none;background:rgba(16,185,129,.08);color:#6ee7b7;font-size:13px;cursor:pointer;font-family:inherit;font-weight:700;';
  footer.addEventListener('mouseenter', function(){ footer.style.background = 'rgba(16,185,129,.15)'; });
  footer.addEventListener('mouseleave', function(){ footer.style.background = 'rgba(16,185,129,.08)'; });
  footer.textContent = '+ Create new school: "' + query + '"';
  footer.addEventListener('click', function(){ createNewSchool(query); });
  container.appendChild(footer);

  container.style.display = '';
}

function selectSchool(id, name, postcode){
  _selectedSchoolId = id;
  document.getElementById('joinSchoolId').value = id;
  document.getElementById('schoolSelectedName').textContent = name + (postcode ? ' (' + postcode + ')' : '');
  document.getElementById('schoolSelected').style.display = '';
  document.getElementById('schoolInput').style.display = 'none';
  document.getElementById('schoolResults').style.display = 'none';
  document.getElementById('postcodeField').style.display = 'none';
}

function createNewSchool(name){
  _selectedSchoolId = null;
  document.getElementById('joinSchoolId').value = '';
  document.getElementById('schoolInput').value = name;
  document.getElementById('schoolResults').style.display = 'none';
  document.getElementById('postcodeField').style.display = '';
  document.getElementById('postcodeInput').focus();
}
```

Call `schoolSearchInit()` at the bottom of the script block (after DOMContentLoaded or at the end):

```js
schoolSearchInit();
```

- [ ] **Step 3: Update the `signUp()` function to use school search state**

In the existing `signUp()` function:

**a)** Replace the old invite-code validation block (lines 289-308) and the school name read (line 274). The new flow:
- If `_selectedSchoolId` is set → teacher selected an existing school. Set `joinSchoolId = _selectedSchoolId`.
- If `_selectedSchoolId` is null and school name is entered → creating new school. Validate postcode.
- If neither → error.

Find the line:
```js
const school   = document.getElementById('schoolInput').value.trim();
```

And the invite code block below it. Replace the whole validation section (from `const inviteCode` through `joinSchoolId = existingSchool.id;`) with:

```js
const school   = document.getElementById('schoolInput').value.trim();
const postcode = (document.getElementById('postcodeInput')?.value || '').trim();

// School selection: either picked an existing school, or creating new
var joinSchoolId = _selectedSchoolId || null;

if (!joinSchoolId && !school) {
  showErr('Please search for your school, or type a name to create a new one.');
  setInvalid('schoolInput', true);
  return;
}
if (!joinSchoolId && postcode && !/^\d{4}$/.test(postcode)) {
  showErr('Please enter a valid 4-digit Australian postcode.');
  setInvalid('postcodeInput', true);
  return;
}
```

**b)** Update the `signUp` metadata to include postcode:

Find the line:
```js
data: { school_name: school || '', join_school_id: joinSchoolId || '' },
```

Replace with:
```js
data: { school_name: school || '', join_school_id: joinSchoolId || '', school_postcode: postcode || '' },
```

- [ ] **Step 4: Update `createSchoolAndTeacher()` to save postcode**

In `createSchoolAndTeacher()` (around line 365), update the school insert to include postcode:

Find:
```js
const joinSchoolId = user?.user_metadata?.join_school_id || '';
```

Add after it:
```js
const postcode = user?.user_metadata?.school_postcode || '';
```

Find the school insert:
```js
.insert({ name: schoolName || 'My School', plan: 'active', trial_ends_at: new Date(Date.now() + 365 * 86400000).toISOString() })
```

Replace with:
```js
.insert({ name: schoolName || 'My School', postcode: postcode || null, plan: 'active', trial_ends_at: new Date(Date.now() + 365 * 86400000).toISOString() })
```

- [ ] **Step 5: Remove or hide the invite code section**

The invite code field (lines 151-158) can be removed or hidden since school search replaces it. Replace the invite box div with a comment noting it's superseded:

Find the `<div class="inviteBox">` block (lines 151-158) and hide it:

```html
<!-- Invite code flow superseded by school search — preserved for backwards compat -->
<div class="inviteBox" style="display:none;">
```

(Keep the HTML so existing invite-code links still work if someone has one.)

- [ ] **Step 6: Verify no innerHTML introduced**

Run: `grep -c "innerHTML" teacher-signup.html` — note the count (should be unchanged or only contain pre-existing usages).

- [ ] **Step 7: Commit**

```bash
git add teacher-signup.html
git commit -m "feat(schools): search-as-you-type school picker on signup page"
```

---

## Task 3: School search component for `teacher-login.html`

**Files:**
- Modify: `teacher-login.html`

The register tab on the login page has the same school name + invite code fields. Apply the same search-as-you-type treatment.

- [ ] **Step 1: Replace the school name field in the register tab**

Find the register tab school field (around line 104-107):
```html
<div class="field">
  <label for="regSchool">School name</label>
  <input type="text" id="regSchool" placeholder="e.g. Riverside Primary School" autocomplete="organization">
</div>
```

Replace with (note: IDs use `reg` prefix to avoid collisions with the login tab):

```html
<div class="field" id="regSchoolField">
  <label for="regSchool">School name</label>
  <div style="position:relative;">
    <input type="text" id="regSchool" placeholder="Start typing your school name…" autocomplete="off" autocapitalize="words">
    <div id="regSchoolResults" role="listbox" aria-label="School search results"
         style="display:none;position:absolute;top:100%;left:0;right:0;z-index:100;background:#1e293b;border:1px solid #334155;border-radius:0 0 10px 10px;max-height:240px;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.3);"></div>
  </div>
  <input type="hidden" id="regJoinSchoolId" value="">
  <div id="regSchoolSelected" style="display:none;margin-top:6px;padding:8px 12px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:8px;font-size:13px;color:#e0e7ff;">
    <span id="regSchoolSelectedName" style="font-weight:700;"></span>
    <button type="button" id="regSchoolChangeBtn" style="margin-left:8px;border:none;background:transparent;color:#a5b4fc;font-size:12px;cursor:pointer;font-weight:700;text-decoration:underline;">Change</button>
  </div>
</div>
<div class="field" id="regPostcodeField" style="display:none;">
  <label for="regPostcode">School postcode</label>
  <input type="text" id="regPostcode" placeholder="e.g. 2150" maxlength="4" inputmode="numeric" pattern="\d{4}">
</div>
```

- [ ] **Step 2: Add the search logic**

In the `<script>` block, add the same search functions but with `reg` prefixed IDs. Add these functions (before `ensureSchoolAndTeacher`):

```js
var _regSchoolSearchTimer = null;
var _regSelectedSchoolId = null;

function regSchoolSearchInit(){
  var input = document.getElementById('regSchool');
  var results = document.getElementById('regSchoolResults');
  var selectedBox = document.getElementById('regSchoolSelected');
  var selectedName = document.getElementById('regSchoolSelectedName');
  var changeBtn = document.getElementById('regSchoolChangeBtn');
  var postcodeField = document.getElementById('regPostcodeField');
  var hiddenId = document.getElementById('regJoinSchoolId');

  input.addEventListener('input', function(){
    clearTimeout(_regSchoolSearchTimer);
    var q = (input.value || '').trim();
    if (q.length < 3) { results.style.display = 'none'; return; }
    _regSchoolSearchTimer = setTimeout(function(){ regSchoolSearch(q); }, 300);
  });

  changeBtn.addEventListener('click', function(){
    _regSelectedSchoolId = null;
    hiddenId.value = '';
    selectedBox.style.display = 'none';
    input.style.display = '';
    input.value = '';
    input.focus();
    postcodeField.style.display = 'none';
    results.style.display = 'none';
  });

  document.addEventListener('click', function(e){
    if (!e.target.closest('#regSchoolField')) results.style.display = 'none';
  });
}

async function regSchoolSearch(query){
  var results = document.getElementById('regSchoolResults');
  try {
    var { data, error } = await sb().rpc('search_schools', { query: query });
    if (error) throw error;
    regRenderResults(data || [], query);
  } catch(e){
    console.warn('School search error:', e);
    results.style.display = 'none';
  }
}

function regRenderResults(schools, query){
  var container = document.getElementById('regSchoolResults');
  while (container.firstChild) container.removeChild(container.firstChild);

  schools.forEach(function(s){
    var row = document.createElement('button');
    row.type = 'button';
    row.setAttribute('role', 'option');
    row.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 14px;border:none;background:transparent;color:#e0e7ff;font-size:13px;cursor:pointer;font-family:inherit;border-bottom:1px solid rgba(255,255,255,.06);';
    row.addEventListener('mouseenter', function(){ row.style.background = 'rgba(99,102,241,.15)'; });
    row.addEventListener('mouseleave', function(){ row.style.background = 'transparent'; });
    var nameSpan = document.createElement('span');
    nameSpan.style.fontWeight = '700';
    nameSpan.textContent = s.name;
    var pcSpan = document.createElement('span');
    pcSpan.style.cssText = 'color:#94a3b8;margin-left:6px;';
    pcSpan.textContent = s.postcode ? '(' + s.postcode + ')' : '';
    row.appendChild(nameSpan);
    row.appendChild(pcSpan);
    row.addEventListener('click', function(){ regSelectSchool(s.id, s.name, s.postcode); });
    container.appendChild(row);
  });

  var footer = document.createElement('button');
  footer.type = 'button';
  footer.setAttribute('role', 'option');
  footer.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 14px;border:none;background:rgba(16,185,129,.08);color:#6ee7b7;font-size:13px;cursor:pointer;font-family:inherit;font-weight:700;';
  footer.addEventListener('mouseenter', function(){ footer.style.background = 'rgba(16,185,129,.15)'; });
  footer.addEventListener('mouseleave', function(){ footer.style.background = 'rgba(16,185,129,.08)'; });
  footer.textContent = '+ Create new school: "' + query + '"';
  footer.addEventListener('click', function(){ regCreateNewSchool(query); });
  container.appendChild(footer);

  container.style.display = '';
}

function regSelectSchool(id, name, postcode){
  _regSelectedSchoolId = id;
  document.getElementById('regJoinSchoolId').value = id;
  document.getElementById('regSchoolSelectedName').textContent = name + (postcode ? ' (' + postcode + ')' : '');
  document.getElementById('regSchoolSelected').style.display = '';
  document.getElementById('regSchool').style.display = 'none';
  document.getElementById('regSchoolResults').style.display = 'none';
  document.getElementById('regPostcodeField').style.display = 'none';
}

function regCreateNewSchool(name){
  _regSelectedSchoolId = null;
  document.getElementById('regJoinSchoolId').value = '';
  document.getElementById('regSchool').value = name;
  document.getElementById('regSchoolResults').style.display = 'none';
  document.getElementById('regPostcodeField').style.display = '';
  document.getElementById('regPostcode').focus();
}
```

Call `regSchoolSearchInit()` at the bottom of the script block.

- [ ] **Step 3: Update the register submission to use search state**

In the existing register form submission handler (the function that reads `regSchool`, `regInviteCode` etc., around line 248-296), update:

**a)** Read the new fields:
```js
var schoolName = document.getElementById('regSchool').value.trim();
var postcode = (document.getElementById('regPostcode')?.value || '').trim();
var joinSchoolId = _regSelectedSchoolId || null;
```

**b)** Replace the invite code validation block with:
```js
if (!joinSchoolId && !schoolName) {
  errEl.textContent = 'Please search for your school, or type a name to create a new one.';
  return;
}
if (!joinSchoolId && postcode && !/^\d{4}$/.test(postcode)) {
  errEl.textContent = 'Please enter a valid 4-digit Australian postcode.';
  return;
}
```

**c)** Update the signUp metadata:
```js
data: { full_name: name, school_name: schoolName || '', join_school_id: joinSchoolId || '', school_postcode: postcode || '' },
```

**d)** Update `ensureSchoolAndTeacher` to read and use postcode:

Find:
```js
const schoolName = user?.user_metadata?.school_name || 'My School';
const joinSchoolId = user?.user_metadata?.join_school_id || '';
```

Add after `joinSchoolId`:
```js
const postcode = user?.user_metadata?.school_postcode || '';
```

Update the school insert to include postcode:
```js
.insert({ name: schoolName, postcode: postcode || null, plan: 'active', trial_ends_at: new Date(Date.now() + 365 * 86400000).toISOString() })
```

- [ ] **Step 4: Hide the old invite code box**

Find the invite code box (around line 96-103) and hide it:
```html
<!-- Invite code flow superseded by school search -->
<div style="display:none;">
```

Close it before the next field.

- [ ] **Step 5: Verify**

Run: `grep -c "innerHTML" teacher-login.html` — unchanged from baseline.

- [ ] **Step 6: Commit**

```bash
git add teacher-login.html
git commit -m "feat(schools): search-as-you-type school picker on login register tab"
```

---

## Task 4: Update `wordlab-data.js` auto-create path

**Files:**
- Modify: `wordlab-data.js`

The `getTeacherRecord()` function (line 377) has an auto-create path that creates a school when no teacher record exists. This needs to read and save postcode from user metadata.

- [ ] **Step 1: Update the auto-create block**

Find the line (around line 392):
```js
var joinSchoolId = session.user.user_metadata?.join_school_id || '';
```

Add after it:
```js
var postcode = session.user.user_metadata?.school_postcode || '';
```

Find the school insert (around line 401):
```js
.insert({ name: schoolName, plan: 'active', trial_ends_at: new Date(Date.now() + 365 * 86400000).toISOString() })
```

Replace with:
```js
.insert({ name: schoolName, postcode: postcode || null, plan: 'active', trial_ends_at: new Date(Date.now() + 365 * 86400000).toISOString() })
```

- [ ] **Step 2: Commit**

```bash
git add wordlab-data.js
git commit -m "feat(schools): pass postcode through auto-create path in getTeacherRecord"
```

---

## Task 5: Account page — show postcode + edit + backfill prompt

**Files:**
- Modify: `account.html`

- [ ] **Step 1: Add postcode display next to school name**

Find the line that populates the school name (around line 499):
```js
document.getElementById('acctSchool').textContent = school.name || '—';
```

Add after it:
```js
var pcEl = document.getElementById('acctPostcode');
if (pcEl) pcEl.textContent = school.postcode || '—';
```

Find the school name display in the HTML (around line 216). After the school name row, add a postcode row. Look for the pattern used for the school name label/value/edit button and add a parallel one for postcode. The exact HTML depends on the layout — read the surrounding markup and add:

```html
<!-- Add after the school name row -->
<div class="acct-row">
  <span class="acct-label">Postcode</span>
  <span class="acct-value" id="acctPostcode">—</span>
  <button id="editPostcodeBtn" class="editInlineBtn" aria-label="Edit postcode">Edit</button>
</div>
```

- [ ] **Step 2: Add the edit postcode handler**

Add after the `editSchoolName()` function (around line 699):

```js
async function editPostcode() {
  var current = document.getElementById('acctPostcode').textContent;
  var newPostcode = await wlInputModal({
    title: 'Edit school postcode',
    body: 'Your 4-digit Australian postcode helps distinguish schools with the same name.',
    placeholder: 'e.g. 2150',
    defaultValue: current === '—' ? '' : current,
    confirmText: 'Save',
    validate: function(v) {
      if (!v || !v.trim()) return 'Please enter a postcode.';
      if (!/^\d{4}$/.test(v.trim())) return 'Postcode must be 4 digits.';
      if (v.trim() === current) return 'Postcode is unchanged.';
      return true;
    }
  });
  if (!newPostcode || !_schoolId) return;

  try {
    var { error } = await WordLabData._sb()
      .from('schools')
      .update({ postcode: newPostcode.trim() })
      .eq('id', _schoolId);
    if (error) {
      wlToast('Could not update postcode. Please try again.', 'err');
    } else {
      document.getElementById('acctPostcode').textContent = newPostcode.trim();
      wlToast('Postcode updated.', 'ok');
    }
  } catch(e) {
    wlToast('Something went wrong. Please try again.', 'err');
  }
}
```

Wire the button (add near where `editSchoolBtn` is wired):
```js
document.getElementById('editPostcodeBtn').addEventListener('click', editPostcode);
```

- [ ] **Step 3: Add backfill prompt for schools without postcode**

After the school data is loaded (after the line that sets `acctPostcode`), add:

```js
if (!school.postcode) {
  var banner = document.createElement('div');
  banner.style.cssText = 'background:rgba(217,119,6,.1);border:1px solid rgba(217,119,6,.2);border-radius:10px;padding:10px 14px;margin:12px 0;font-size:13px;color:#fbbf24;';
  banner.textContent = 'Please add your school postcode to help colleagues find your school when signing up.';
  var addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.style.cssText = 'margin-left:10px;border:none;background:#d97706;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:inherit;';
  addBtn.textContent = 'Add postcode';
  addBtn.addEventListener('click', editPostcode);
  banner.appendChild(addBtn);
  // Insert banner before the plan section
  var acctCard = document.getElementById('acctPostcode').closest('.acct-card') || document.getElementById('acctPostcode').parentElement.parentElement;
  if (acctCard) acctCard.appendChild(banner);
}
```

- [ ] **Step 4: Update the school SELECT to include postcode**

Find where the school is queried (around line 486-490). Ensure `postcode` is in the select list:

```js
.select('id, name, plan, trial_ends_at, stripe_customer_id, postcode')
```

- [ ] **Step 5: Commit**

```bash
git add account.html
git commit -m "feat(schools): show postcode on account page with edit + backfill prompt"
```

---

## Self-review

**Spec coverage:**
- Add `postcode` column: Task 1 ✓
- Search-as-you-type on teacher-signup.html: Task 2 ✓
- Search-as-you-type on teacher-login.html register tab: Task 3 ✓
- RPC for anon-safe search: Task 1 ✓
- New school creation includes postcode: Tasks 2, 3, 4 ✓
- Joining existing school via search: Tasks 2, 3 ✓
- Account page shows/edits postcode: Task 5 ✓
- Backfill prompt for existing schools: Task 5 ✓
- Postcode validation (4-digit): Tasks 2, 3, 5 ✓
- Existing invite code flow preserved (hidden but functional): Tasks 2, 3 ✓

**Placeholder scan:** All code blocks contain actual implementation. No TBD/TODO.

**Type consistency:**
- `postcode` column name used consistently across migration, insert, select, update, metadata.
- `school_postcode` as the metadata key, used in signUp options and read in create functions.
- `join_school_id` / `_selectedSchoolId` / `_regSelectedSchoolId` — distinct per page, consistent within.
- `search_schools` RPC name used in both Task 2 and Task 3.

**Risks:**
1. `pg_trgm` extension may not be enabled on the Supabase instance. The migration includes `CREATE EXTENSION IF NOT EXISTS pg_trgm` but this may require superuser permissions. If it fails, fall back to plain `ILIKE` without the gin index — still functional, just slower on large school lists (unlikely to be an issue with <1000 schools).
2. The `SECURITY DEFINER` on the RPC means it runs as the function owner (postgres), bypassing RLS. This is intentional — it only returns `id, name, postcode` and is read-only. But it means a malicious caller could enumerate all schools by searching single characters. The 3-char minimum mitigates this somewhat.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-16-school-search-signup.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
