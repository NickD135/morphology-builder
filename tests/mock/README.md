# Mock mode

Run Word Labs and the SOLO tracker locally with **fake data only**. Nothing talks to Supabase: the
real client library is swapped for an in-memory fake (`mock-supabase.js`) seeded from
`fixtures.js`, and any direct call to `*.supabase.co` gets an offline response. Built so the
improvement agent can play through pages as a student and take screenshots without ever seeing
real student data, and handy for demos and quick checks too.

**Never add real student, teacher or school data to `fixtures.js`.**

## Try it in your browser

```
node tests/mock/server.js
```

Open http://127.0.0.1:8787/landing and log in with class code **MOCK6A**, then a student:

| Student | Code | Who they represent |
|---|---|---|
| Ava | AVA | Typical Year 5/6 student (stage s3e) |
| Ben | BEN | Reads below level, Support Mode on (s2l) |
| Chloe | CHL | Finishes early, extension on (s4) |
| Dev | DEV | EAL/D learner, Vietnamese (s3l) |

SOLO is at http://127.0.0.1:8787/solo with the same codes. Teacher pages accept any email and
password and sign you in as a fake teacher for Mock Class 6A. Add `?mockReset=1` to any URL to
restore the fake data. A small red MOCK DATA label sits in the bottom left corner.

The server needs `esbuild`, `react` and `react-dom`. Cloud sessions find them in shared tool
folders. On your own machine run `npm i --no-save esbuild react@18.3.1 react-dom@18.3.1` once so
mock mode uses the same React version as production (otherwise it falls back to whatever React it
finds; cloud sessions currently use React 19, which renders the SOLO tracker fine).

## Screenshots and walkthroughs (Playwright)

```
node tests/mock/browse.js --as ava --page /phoneme-mode --shot out/phoneme.png
node tests/mock/browse.js --as ben --page /landing --shot out/ben.png --width 1366 --height 768
node tests/mock/browse.js --as chloe --solo --shot out/solo.png
node tests/mock/browse.js --as teacher --page /dashboard --shot out/dash.png --wait 6000
```

Options: `--low-stim`, `--reduced-motion`, `--full` (full page), `--wait <ms>`, `--first-visit`
(show the storage notice, tours and first-visit help popups that are otherwise treated as already
seen), `--keep-data` (do not reset fake data). The command prints any page errors.

From a script:

```js
const { openMock } = require('./tests/mock/browse');
const s = await openMock({ as: 'ben', width: 1366, height: 768 });
await s.goto('/syllable-mode');
await s.page.getByRole('button', { name: '15' }).click();
await s.shot('out/syllable-round.png');
console.log(s.errors);          // page errors and console errors
await s.page.evaluate(() => __WL_MOCK__.dump('student_progress'));  // what got saved
await s.page.evaluate(() => __WL_MOCK__.add('resources', [{ unit_id: 'u31', outcome_id: 'y5', type: 'website', label: 'Fake link', url: 'https://example.org/', scope: 'global' }]));  // fake rows, e.g. so a SOLO Grow button shows
await s.close();
```

`s.loginSolo()` logs the same student into the SOLO tracker. Every request that is not to the
local mock server is blocked, so Google Fonts and other CDNs do not load: pages render with a
fallback font in screenshots.

## Limits

Edge functions (text to speech, translations, AI analysis, Stripe) are offline, so pages use their
fallbacks. Resources stored in the `resources` table are not available; SOLO uses its built in
fallback resources. For units whose resources live only in the database, the Grow button stays hidden
until you add a fake row with `__WL_MOCK__.add('resources', …)` (see above). Row level security is not simulated. The fake client covers the queries the
site uses today; if a page uses a new query feature, `mock-supabase.js` logs `[mock] unsupported`
in the console.
