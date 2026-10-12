/*
 * Word Labs mock mode: an in-memory stand-in for the Supabase JS client.
 *
 * Served by tests/mock/server.js in place of the supabase-js CDN script, with
 * fixtures.js prepended. Pages call window.supabase.createClient() exactly as
 * they do in production, but every query, RPC and auth call is answered from
 * fake data held in this browser's localStorage. Nothing ever reaches the real
 * database: direct fetches to *.supabase.co are also intercepted.
 *
 * Handy in the console:
 *   __WL_MOCK__.reset()          restore the fixtures
 *   __WL_MOCK__.setRole('teacher' | '')   fake teacher sign in / out
 *   __WL_MOCK__.dump('student_progress')  inspect a table
 * Add ?mockReset=1 to any URL to start from fresh fixtures.
 */
(function () {
  'use strict';
  var FIX = window.__WL_MOCK_FIXTURES__;
  var DB_KEY = 'wl_mock_db_v1';
  var ROLE_KEY = 'wl_mock_role';

  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function nowIso() { return new Date().toISOString(); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'mock-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  // ── Store ────────────────────────────────────────────────────
  var db;
  function loadDb() {
    try {
      if (/[?&]mockReset=1/.test(location.search)) localStorage.removeItem(DB_KEY);
      var raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return clone(FIX.tables);
  }
  function saveDb() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {} }
  function tbl(name) { if (!db[name]) db[name] = []; return db[name]; }
  db = loadDb();
  saveDb();

  function getRole() { try { return localStorage.getItem(ROLE_KEY) || ''; } catch (e) { return ''; } }
  function setRole(r) { try { if (r) localStorage.setItem(ROLE_KEY, r); else localStorage.removeItem(ROLE_KEY); } catch (e) {} }

  // ── Value helpers ────────────────────────────────────────────
  function colVal(row, col) {
    var m = /^(\w+)->>?(\w+)$/.exec(col);
    if (m) { var o = row[m[1]]; return o == null ? null : o[m[2]]; }
    return row[col];
  }
  function same(a, b) {
    if (a == null || b == null) return a == null && b == null;
    if (typeof a === 'boolean' || typeof b === 'boolean') return String(a) === String(b);
    return String(a) === String(b);
  }
  function cmp(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
  }
  function likeRe(pattern, flags) {
    var s = String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
    return new RegExp('^' + s + '$', flags);
  }
  function contains(have, want) {
    if (Array.isArray(want)) {
      if (!Array.isArray(have)) return false;
      return want.every(function (w) { return have.some(function (h) { return JSON.stringify(h) === JSON.stringify(w); }); });
    }
    if (want && typeof want === 'object') {
      if (!have || typeof have !== 'object') return false;
      return Object.keys(want).every(function (k) { return contains(have[k], want[k]) || same(have[k], want[k]); });
    }
    return same(have, want);
  }
  function parseListLiteral(v) {
    if (Array.isArray(v)) return v;
    var s = String(v).replace(/^\(|\)$/g, '');
    return s ? s.split(',').map(function (x) { return x.replace(/^"|"$/g, ''); }) : [];
  }
  function opPred(col, op, val) {
    switch (op) {
      case 'eq': return function (r) { return same(colVal(r, col), val); };
      case 'neq': return function (r) { return !same(colVal(r, col), val); };
      case 'gt': return function (r) { return cmp(colVal(r, col), val) > 0; };
      case 'gte': return function (r) { return cmp(colVal(r, col), val) >= 0; };
      case 'lt': return function (r) { return cmp(colVal(r, col), val) < 0; };
      case 'lte': return function (r) { return cmp(colVal(r, col), val) <= 0; };
      case 'like': return function (r) { return likeRe(val, '').test(String(colVal(r, col))); };
      case 'ilike': return function (r) { return likeRe(val, 'i').test(String(colVal(r, col))); };
      case 'is': return function (r) {
        var v = colVal(r, col);
        if (val === null || val === 'null') return v == null;
        return String(v) === String(val);
      };
      case 'in': return function (r) {
        var list = parseListLiteral(val);
        return list.some(function (x) { return same(colVal(r, col), x); });
      };
      case 'cs': case 'contains': return function (r) { return contains(colVal(r, col), val); };
      default:
        console.warn('[mock] unsupported filter op', op);
        return function () { return true; };
    }
  }
  function parseOr(expr) {
    // "a.eq.1,b.is.null" (no nested groups)
    var parts = String(expr).split(',');
    var preds = parts.map(function (p) {
      var m = /^([\w>-]+)\.(not\.)?(\w+)\.(.*)$/.exec(p.trim());
      if (!m) return function () { return false; };
      var pr = opPred(m[1], m[3], m[4] === 'null' ? null : m[4]);
      return m[2] ? function (r) { return !pr(r); } : pr;
    });
    return function (r) { return preds.some(function (p) { return p(r); }); };
  }

  // ── Select projection (including simple embeds) ─────────────
  var SINGULAR = { classes: 'class', students: 'student', schools: 'school', teachers: 'teacher' };
  function singular(t) { return SINGULAR[t] || t.replace(/s$/, ''); }
  function splitTop(s) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function project(tableName, rows, cols) {
    if (!cols || cols.trim() === '*' || cols.trim() === '') return clone(rows);
    var fields = splitTop(cols.replace(/\s+/g, ' '));
    return rows.map(function (row) {
      var o = {};
      fields.forEach(function (f) {
        var em = /^(?:(\w+):)?(\w+)(?:!\w+)?\((.*)\)$/.exec(f);
        if (em) {
          var alias = em[1] || em[2], child = em[2], inner = em[3];
          var fk = singular(tableName) + '_id';
          var parentKey = singular(child) + '_id';
          if (row[parentKey] !== undefined) {
            var parent = tbl(child).filter(function (c) { return same(c.id, row[parentKey]); })[0] || null;
            o[alias] = parent ? project(child, [parent], inner)[0] : null;
          } else {
            var kids = tbl(child).filter(function (c) { return same(c[fk], row.id); });
            o[alias] = project(child, kids, inner);
          }
          return;
        }
        if (f === '*') { Object.keys(row).forEach(function (k) { o[k] = clone(row[k]); }); return; }
        var am = /^(?:(\w+):)?([\w>-]+)(?:::\w+)?$/.exec(f);
        if (am) {
          var key = am[1] || am[2].replace(/^.*->>?/, '');
          var v = colVal(row, am[2]);
          o[key] = v === undefined ? null : clone(v);
        }
      });
      return o;
    });
  }

  // ── Query builder ────────────────────────────────────────────
  function Query(table) {
    this.table = table;
    this.op = 'select';
    this.preds = [];
    this.cols = '*';
    this.wantRows = false;
    this.orders = [];
    this.lim = null;
    this.rng = null;
    this.mode = null; // 'single' | 'maybe'
    this.countOpt = null;
    this.head = false;
    this.payload = null;
    this.opts = {};
    this._p = null;
  }
  var Q = Query.prototype;
  Q.select = function (cols, opts) {
    if (this.op === 'select') this.cols = cols || '*';
    else { this.wantRows = true; this.cols = cols || '*'; }
    opts = opts || {};
    if (opts.count) this.countOpt = opts.count;
    if (opts.head) this.head = true;
    return this;
  };
  Q.insert = function (v, o) { this.op = 'insert'; this.payload = v; this.opts = o || {}; return this; };
  Q.upsert = function (v, o) { this.op = 'upsert'; this.payload = v; this.opts = o || {}; return this; };
  Q.update = function (v, o) { this.op = 'update'; this.payload = v; this.opts = o || {}; return this; };
  Q.delete = function (o) { this.op = 'delete'; this.opts = o || {}; return this; };
  ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains'].forEach(function (op) {
    Q[op] = function (col, val) { this.preds.push(opPred(col, op, val)); return this; };
  });
  Q.match = function (obj) { var self = this; Object.keys(obj).forEach(function (k) { self.eq(k, obj[k]); }); return this; };
  Q.not = function (col, op, val) { var p = opPred(col, op, val); this.preds.push(function (r) { return !p(r); }); return this; };
  Q.filter = function (col, op, val) { this.preds.push(opPred(col, op, val)); return this; };
  Q.or = function (expr) { this.preds.push(parseOr(expr)); return this; };
  Q.order = function (col, o) { this.orders.push({ col: col, asc: !(o && o.ascending === false), nullsFirst: !!(o && o.nullsFirst) }); return this; };
  Q.limit = function (n) { this.lim = n; return this; };
  Q.range = function (a, b) { this.rng = [a, b]; return this; };
  Q.single = function () { this.mode = 'single'; return this; };
  Q.maybeSingle = function () { this.mode = 'maybe'; return this; };
  Q.throwOnError = Q.abortSignal = Q.returns = Q.csv = function () { return this; };

  Q._match = function (row) { return this.preds.every(function (p) { return p(row); }); };
  Q._run = function () {
    var self = this, t = tbl(this.table), rows = [], err = null;
    function stamp(r) {
      if (r.id === undefined) r.id = uuid();
      if (r.created_at === undefined) r.created_at = nowIso();
      return r;
    }
    if (this.op === 'select') {
      rows = t.filter(function (r) { return self._match(r); });
    } else if (this.op === 'insert') {
      var ins = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(function (r) { return stamp(clone(r)); });
      ins.forEach(function (r) { t.push(r); });
      rows = ins;
    } else if (this.op === 'upsert') {
      var keys = String(this.opts.onConflict || 'id').split(',').map(function (s) { return s.trim(); });
      (Array.isArray(this.payload) ? this.payload : [this.payload]).forEach(function (r) {
        r = clone(r);
        var hit = t.filter(function (x) { return keys.every(function (k) { return r[k] !== undefined && same(x[k], r[k]); }); })[0];
        if (hit) { if (!self.opts.ignoreDuplicates) Object.assign(hit, r); rows.push(hit); }
        else { stamp(r); t.push(r); rows.push(r); }
      });
    } else if (this.op === 'update') {
      rows = t.filter(function (r) { return self._match(r); });
      rows.forEach(function (r) { Object.assign(r, clone(self.payload)); if ('updated_at' in r) r.updated_at = nowIso(); });
    } else if (this.op === 'delete') {
      rows = t.filter(function (r) { return self._match(r); });
      db[this.table] = t.filter(function (r) { return !self._match(r); });
    }
    if (this.op !== 'select') saveDb();

    var count = rows.length;
    if (this.op === 'select') {
      if (this.orders.length) {
        var ords = this.orders;
        rows = rows.slice().sort(function (a, b) {
          for (var i = 0; i < ords.length; i++) {
            var c = cmp(colVal(a, ords[i].col), colVal(b, ords[i].col));
            if (c) return ords[i].asc ? c : -c;
          }
          return 0;
        });
      }
      if (this.rng) rows = rows.slice(this.rng[0], this.rng[1] + 1);
      if (this.lim != null) rows = rows.slice(0, this.lim);
    }

    var data;
    if (this.op === 'select' || this.wantRows) {
      data = this.head ? null : project(this.table, rows, this.cols);
    } else {
      data = null;
    }
    if (this.mode && data) {
      if (data.length === 1) data = data[0];
      else if (data.length === 0 && this.mode === 'maybe') data = null;
      else {
        err = { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'mock', hint: null };
        data = null;
      }
    }
    var res = { data: data, error: err, count: this.countOpt ? count : null, status: err ? 406 : 200, statusText: err ? 'Not Acceptable' : 'OK' };
    return res;
  };
  Q.then = function (onOk, onErr) {
    if (!this._p) {
      var self = this;
      this._p = new Promise(function (resolve) {
        setTimeout(function () {
          try { resolve(self._run()); }
          catch (e) { console.warn('[mock] query failed', self.table, e); resolve({ data: null, error: { message: String(e) }, count: null }); }
        }, 0);
      });
    }
    return this._p.then(onOk, onErr);
  };
  Q.catch = function (f) { return this.then(null, f); };
  Q.finally = function (f) { return this.then(function (v) { f(); return v; }, function (e) { f(); throw e; }); };

  // ── RPCs ─────────────────────────────────────────────────────
  function charFor(sid) {
    var t = tbl('student_character');
    var c = t.filter(function (r) { return same(r.student_id, sid); })[0];
    if (!c) { c = { student_id: sid, quarks: 0, xp: 0, badges: [], scientist: { owned: [] }, stats: null }; t.push(c); }
    if (!c.scientist) c.scientist = {};
    if (!Array.isArray(c.scientist.owned)) c.scientist.owned = [];
    return c;
  }
  var RPC = {
    verify_student_login: function (a) {
      var s = tbl('students').filter(function (r) {
        return same(r.id, a.p_student_id) && same(r.class_id, a.p_class_id) &&
          String(r.student_code || '').toUpperCase() === String(a.p_student_code || '').toUpperCase();
      })[0];
      return s ? { success: true, extension_mode: !!s.extension_mode, eald_language: s.eald_language || null } : { success: false };
    },
    increment_progress: function (a) {
      var t = tbl('student_progress');
      var r = t.filter(function (x) { return same(x.student_id, a.p_student_id) && x.activity === a.p_activity && x.category === a.p_category; })[0];
      if (!r) { r = { id: uuid(), student_id: a.p_student_id, activity: a.p_activity, category: a.p_category, correct: 0, total: 0, total_time: 0, is_extension: !!a.p_is_extension }; t.push(r); }
      r.total += 1; if (a.p_correct) r.correct += 1; r.total_time += a.p_time_ms || 0; r.updated_at = nowIso();
      return null;
    },
    save_scientist_field: function (a) { charFor(a.p_student_id).scientist[a.p_field] = a.p_value; return null; },
    atomic_purchase: function (a) {
      var c = charFor(a.p_student_id);
      if (c.scientist.owned.indexOf(a.p_item_key) !== -1) return { success: false, reason: 'Already owned', quarks: c.quarks };
      if ((c.quarks || 0) < a.p_cost) return { success: false, reason: 'Not enough quarks', quarks: c.quarks };
      c.quarks -= a.p_cost; c.scientist.owned.push(a.p_item_key);
      return { success: true, quarks: c.quarks };
    },
    gift_owned_item: function (a) {
      var c = charFor(a.p_student_id || a.student_id);
      var item = a.p_item_key || a.p_item || a.item_key;
      if (item && c.scientist.owned.indexOf(item) === -1) c.scientist.owned.push(item);
      return { success: true };
    },
    delete_class: function (a) {
      var id = a.p_class_id || a.class_id;
      db.students = tbl('students').filter(function (s) { return !same(s.class_id, id); });
      db.classes = tbl('classes').filter(function (c) { return !same(c.id, id); });
      return { success: true };
    },
    search_schools: function (a) {
      var q = String(a.p_query || a.query || a.search || '').toLowerCase();
      return tbl('schools').filter(function (s) { return String(s.name).toLowerCase().indexOf(q) !== -1; })
        .map(function (s) { return { id: s.id, name: s.name, postcode: s.postcode }; });
    }
  };
  function rpc(name, args) {
    var q = { then: function (ok, bad) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (!RPC[name]) { resolve({ data: null, error: { message: 'Mock mode: RPC not implemented: ' + name } }); return; }
          try { var data = RPC[name](args || {}); saveDb(); resolve({ data: data, error: null }); }
          catch (e) { resolve({ data: null, error: { message: String(e) } }); }
        }, 0);
      }).then(ok, bad);
    } };
    q.catch = function (f) { return q.then(null, f); };
    q.single = q.maybeSingle = q.throwOnError = function () { return q; };
    return q;
  }

  // ── Auth (fake teacher only) ─────────────────────────────────
  function fakeUser() { return { id: FIX.teacher.authUserId, email: FIX.teacher.email, user_metadata: { school_name: 'Mock Primary School (fake data)' } }; }
  function fakeSession() { return { access_token: 'mock-access-token', token_type: 'bearer', user: fakeUser() }; }
  var listeners = [];
  function emit(evt) { listeners.forEach(function (cb) { try { cb(evt, getRole() === 'teacher' ? fakeSession() : null); } catch (e) {} }); }
  function resolved(v) { return Promise.resolve(v); }
  var auth = {
    getSession: function () { return resolved({ data: { session: getRole() === 'teacher' ? fakeSession() : null }, error: null }); },
    getUser: function () { return resolved({ data: { user: getRole() === 'teacher' ? fakeUser() : null }, error: null }); },
    signInWithPassword: function () { setRole('teacher'); emit('SIGNED_IN'); return resolved({ data: { session: fakeSession(), user: fakeUser() }, error: null }); },
    signUp: function () { setRole('teacher'); emit('SIGNED_IN'); return resolved({ data: { session: fakeSession(), user: fakeUser() }, error: null }); },
    signOut: function () { setRole(''); emit('SIGNED_OUT'); return resolved({ error: null }); },
    resetPasswordForEmail: function () { return resolved({ data: {}, error: null }); },
    updateUser: function () { return resolved({ data: { user: fakeUser() }, error: null }); },
    onAuthStateChange: function (cb) {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe: function () { listeners = listeners.filter(function (x) { return x !== cb; }); } } } };
    }
  };

  // ── Client ───────────────────────────────────────────────────
  var offline = { message: 'Mock mode: edge functions and storage are offline' };
  var client = {
    from: function (t) { return new Query(t); },
    rpc: rpc,
    auth: auth,
    functions: { invoke: function () { return resolved({ data: null, error: offline }); } },
    storage: {
      from: function () {
        return {
          upload: function (path) { return resolved({ data: { path: path }, error: null }); },
          getPublicUrl: function () { return { data: { publicUrl: '' } }; },
          remove: function () { return resolved({ data: [], error: null }); }
        };
      }
    },
    channel: function () {
      var ch = { on: function () { return ch; }, subscribe: function () { return ch; }, unsubscribe: function () { return resolved('ok'); } };
      return ch;
    },
    removeChannel: function () { return resolved('ok'); },
    removeAllChannels: function () { return resolved([]); }
  };
  window.supabase = { createClient: function () { return client; } };

  // Any direct call to Supabase (edge functions such as speak-word) gets a
  // polite failure so pages use their offline fallbacks.
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  if (realFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (/\.supabase\.co\b/.test(url)) {
        return Promise.resolve(new Response(JSON.stringify({ error: 'Mock mode: Supabase is offline' }), {
          status: 503, headers: { 'Content-Type': 'application/json' }
        }));
      }
      return realFetch(input, init);
    };
  }

  window.__WL_MOCK__ = {
    fixtures: FIX,
    reset: function () { db = clone(FIX.tables); saveDb(); setRole(''); },
    setRole: setRole,
    getRole: getRole,
    dump: function (t) { return clone(t ? tbl(t) : db); },
    // patch('classes', { id: '...' }, { settings: { lowStimMode: true } })
    patch: function (t, where, values) {
      var n = 0;
      tbl(t).forEach(function (r) {
        if (Object.keys(where).every(function (k) { return same(r[k], where[k]); })) { Object.assign(r, clone(values)); n++; }
      });
      saveDb();
      return n;
    }
  };

  // Small label so nobody mistakes mock mode for the live site.
  function label() {
    try { if (sessionStorage.getItem('wl_mock_hide_label') === '1') return; } catch (e) {}
    var d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.textContent = 'MOCK DATA';
    d.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:2147483647;pointer-events:none;' +
      'font:700 9px/1 system-ui,sans-serif;letter-spacing:.08em;color:#fff;background:rgba(220,38,38,.75);' +
      'padding:3px 5px;border-radius:4px;';
    document.body.appendChild(d);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', label);
  else label();
})();
