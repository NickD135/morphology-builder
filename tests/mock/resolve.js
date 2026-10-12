/*
 * Finds the tools mock mode needs (esbuild, react, react-dom, playwright)
 * without requiring an npm install, since cloud sessions cannot reach npm.
 * Looks in this repo's node_modules first, then shared tool folders.
 *
 * On your own machine, `npm i --no-save esbuild react@18.3.1 react-dom@18.3.1`
 * makes mock mode use the same React version as production.
 */
'use strict';
const path = require('path');
const { execSync } = require('child_process');

let cached = null;
function searchPaths() {
  if (cached) return cached;
  const repo = path.resolve(__dirname, '..', '..', 'node_modules');
  const list = [repo, '/opt/npm-tools/node_modules'];
  try {
    const g = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (g) list.push(g, path.join(g, 'tsx', 'node_modules'));
  } catch (e) {}
  cached = list;
  return list;
}

function resolveTool(id) {
  try { return require.resolve(id, { paths: searchPaths() }); }
  catch (e) {
    throw new Error('Mock mode could not find "' + id + '". Searched: ' + searchPaths().join(', ') +
      '. Install it locally with npm i --no-save ' + id.split('/')[0]);
  }
}

function requireTool(id) { return require(resolveTool(id)); }

module.exports = { resolveTool, requireTool, searchPaths };
