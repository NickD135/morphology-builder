#!/usr/bin/env node
/*
 * Word Labs mock mode server.
 *
 * Serves the site from this repo with fake data in place of Supabase, so pages
 * can be used, tested and screenshotted without any access to real student
 * data. It rewrites each HTML page on the way out:
 *   - the supabase-js CDN script  -> /__mock/supabase-mock.js (fixtures + fake client)
 *   - React 18 UMD CDN scripts    -> a local React build (/__mock/react-global.js)
 *   - Babel standalone            -> nothing; <script type="text/babel"> blocks are
 *                                    compiled ahead of time with esbuild instead
 * Everything else is served as is, with Vercel style clean URLs (/landing).
 *
 *   node tests/mock/server.js            # http://127.0.0.1:8787
 *   node tests/mock/server.js --port 9000
 *
 * Then open http://127.0.0.1:8787/landing and log in with class code MOCK6A
 * and student code AVA, BEN, CHL or DEV (see tests/mock/README.md).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { requireTool, resolveTool } = require('./resolve');

const ROOT = path.resolve(__dirname, '..', '..');
const MOCK_DIR = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.zip': 'application/zip',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const compiled = new Map();   // hash -> js
let reactBundle = null;        // { code, version }

function esbuild() { return requireTool('esbuild'); }

function buildReact() {
  if (reactBundle) return reactBundle;
  const reactPkg = resolveTool('react/package.json');
  const nodeModules = path.dirname(path.dirname(reactPkg));
  const version = JSON.parse(fs.readFileSync(reactPkg, 'utf8')).version;
  const out = esbuild().buildSync({
    stdin: {
      contents: "window.React = require('react');\n" +
        "window.ReactDOM = Object.assign({}, require('react-dom'), require('react-dom/client'));\n",
      resolveDir: nodeModules, sourcefile: 'react-global.js', loader: 'js'
    },
    nodePaths: [nodeModules],
    bundle: true, format: 'iife', platform: 'browser', minify: true, write: false,
    define: { 'process.env.NODE_ENV': '"production"' }
  });
  reactBundle = { code: out.outputFiles[0].text, version };
  return reactBundle;
}

function compileJsx(source) {
  const hash = crypto.createHash('sha1').update(source).digest('hex').slice(0, 16);
  if (!compiled.has(hash)) {
    const res = esbuild().transformSync(source, {
      loader: 'jsx', jsx: 'transform', jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment', sourcefile: 'inline-babel.jsx'
    });
    compiled.set(hash, res.code);
  }
  return hash;
}

function rewriteHtml(html) {
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2[^"']*/g, '/__mock/supabase-mock.js');
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/react@18[^"']*/g, '/__mock/react-global.js');
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/react-dom@18[^"']*/g, '/__mock/blank.js');
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@babel\/standalone[^"']*/g, '/__mock/blank.js');
  html = html.replace(/<script([^>]*)type=["']text\/babel["']([^>]*)>([\s\S]*?)<\/script>/g, function (_m, _a, _b, body) {
    const hash = compileJsx(body);
    return '<script defer src="/__mock/compiled/' + hash + '.js"></script>';
  });
  return html;
}

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p === '/' || p === '') p = '/landing';
  const abs = path.normalize(path.join(ROOT, p));
  if (!abs.startsWith(ROOT)) return null;
  const candidates = [abs, abs + '.html', path.join(abs, 'index.html')];
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return c; } catch (e) {}
  }
  return null;
}

function handle(req, res) {
  const url = req.url || '/';
  try {
    if (url.startsWith('/__mock/')) {
      const name = url.slice('/__mock/'.length).split('?')[0];
      if (name === 'supabase-mock.js') {
        const body = fs.readFileSync(path.join(MOCK_DIR, 'fixtures.js'), 'utf8') + '\n' +
          fs.readFileSync(path.join(MOCK_DIR, 'mock-supabase.js'), 'utf8');
        return send(res, 200, TYPES['.js'], body);
      }
      if (name === 'react-global.js') return send(res, 200, TYPES['.js'], buildReact().code);
      if (name === 'blank.js') return send(res, 200, TYPES['.js'], '/* replaced in mock mode */');
      if (name.startsWith('compiled/')) {
        const hash = name.slice('compiled/'.length).replace(/\.js$/, '');
        if (compiled.has(hash)) return send(res, 200, TYPES['.js'], compiled.get(hash));
        return send(res, 404, 'text/plain', 'not compiled');
      }
      if (name === 'status') {
        return send(res, 200, TYPES['.json'], JSON.stringify({
          mock: true, react: reactBundle ? reactBundle.version : 'not built yet',
          esbuild: esbuild().version
        }));
      }
      return send(res, 404, 'text/plain', 'unknown mock asset');
    }
    const file = resolveFile(url);
    if (!file) return send(res, 404, 'text/html; charset=utf-8', '<h1>404</h1><p>Not found in mock mode.</p>');
    const ext = path.extname(file).toLowerCase();
    if (ext === '.html') {
      return send(res, 200, TYPES['.html'], rewriteHtml(fs.readFileSync(file, 'utf8')));
    }
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error('[mock-server]', url, e);
    send(res, 500, 'text/plain', 'mock server error: ' + e.message);
  }
}

function startServer(opts) {
  opts = opts || {};
  const host = opts.host || '127.0.0.1';
  const port = opts.port == null ? 8787 : opts.port;
  return new Promise(function (resolve, reject) {
    const server = http.createServer(handle);
    server.on('error', reject);
    server.listen(port, host, function () {
      const addr = server.address();
      resolve({
        url: 'http://' + host + ':' + addr.port,
        close: function () { return new Promise(function (r) { server.close(function () { r(); }); }); }
      });
    });
  });
}

module.exports = { startServer, rewriteHtml };

if (require.main === module) {
  const i = process.argv.indexOf('--port');
  const port = i > -1 ? Number(process.argv[i + 1]) : 8787;
  startServer({ port }).then(function (s) {
    try { buildReact(); } catch (e) { console.warn('React build unavailable (SOLO will not render):', e.message); }
    console.log('Word Labs mock mode (fake data only) at ' + s.url + '/landing');
    console.log('Class code MOCK6A, student codes AVA, BEN, CHL, DEV. Add ?mockReset=1 to reset data.');
  });
}
