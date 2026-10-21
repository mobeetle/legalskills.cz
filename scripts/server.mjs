#!/usr/bin/env node
// LegalSkills.cz — Express server.
//
// One Node app serves the whole site. Per page, the render mode comes from
// site.config.json: "static" (serve the pre-rendered .html) or "dynamic"
// (render on every request). The config is hot-reloaded, so flipping a page's
// mode needs no restart.
//
//   node scripts/server.mjs
//   PORT=8765 HOST=127.0.0.1 \
//     DOWNLOAD_SRC_DIR=/srv/legalskills/bundles \
//     DOWNLOAD_DATA_DIR=/srv/legalskills/data \
//     node scripts/server.mjs
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, PAGE_META } from './render.mjs';
import { apiRouter } from './download_api.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CONFIG_PATH = path.join(ROOT, 'site.config.json');
const PORT = Number(process.env.PORT || 8765);
const HOST = process.env.HOST || '127.0.0.1';
const SRC_DIR = process.env.DOWNLOAD_SRC_DIR || '/srv/legalskills/bundles';
const DATA_DIR = process.env.DOWNLOAD_DATA_DIR || '/srv/legalskills/data';

/* --- config: hot-reloaded on mtime change -------------------------------- */
let cfg = { default: 'static', pages: {} };
let cfgMtime = -1;
function config() {
  try {
    const m = fs.statSync(CONFIG_PATH).mtimeMs;
    if (m !== cfgMtime) {
      cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      cfgMtime = m;
    }
  } catch { /* keep the last good config */ }
  return cfg;
}
const modeFor = (slug) => config().pages?.[slug] || config().default || 'static';

/* --- URL -> { lang, slug } ----------------------------------------------- */
function parsePage(p) {
  if (p === '/' || p === '') return { lang: 'cs', slug: '' };
  if (p === '/en' || p === '/en/') return { lang: 'en', slug: '' };
  if (p === '/index.html') return { lang: 'cs', slug: '' };
  if (p === '/en/index.html') return { lang: 'en', slug: '' };
  let s = p;
  let lang = 'cs';
  if (s.startsWith('/en/')) { lang = 'en'; s = s.slice(4); } else { s = s.slice(1); }
  if (s.endsWith('/')) s += 'index.html';
  if (!/\.[a-z0-9]+$/i.test(s)) s += '.html';
  if (s === 'index.html') return { lang, slug: '' };
  return PAGE_META[s] ? { lang, slug: s } : { lang, slug: null };
}

const cache = new Map(); // static fallback render cache

const app = express();
app.disable('x-powered-by');

// 1. assets
app.use('/assets', express.static(path.join(ROOT, 'assets'), { maxAge: '1h' }));

// 2. pages — GET/HEAD only; dynamic renders per request, static serves the file
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const { lang, slug } = parsePage(req.path);
  if (slug === null) return next();

  if (modeFor(slug) === 'dynamic') {
    res.set('Cache-Control', 'no-store');
    return res.type('html').send(renderPage(lang, slug));
  }
  const file = path.join(ROOT, lang === 'en' ? 'en' : '', slug || 'index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  const key = `${lang}:${slug}`; // no pre-rendered file yet: render once, cache
  if (!cache.has(key)) cache.set(key, renderPage(lang, slug));
  res.set('Cache-Control', 'no-cache');
  return res.type('html').send(cache.get(key));
});

// 3. download gate API + token file streaming (/api/*, /downloads/:token/:file)
app.use(apiRouter({ srcDir: SRC_DIR, dataDir: DATA_DIR }));

// 4. fallback
app.use((req, res) => res.status(404).type('html').send('<!DOCTYPE html>\n<title>404</title>\n<h1>404 — not found</h1>\n'));

const server = app.listen(PORT, HOST, () => {
  const c = config();
  const dyn = Object.entries(c.pages || {}).filter(([, v]) => v === 'dynamic').map(([k]) => k);
  console.log(`legalskills serving on http://${HOST}:${PORT}  (default=${c.default}, dynamic=[${dyn.join(', ')}])`);
});

export { app, server };
