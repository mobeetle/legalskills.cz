// Download gate API for legalskills.cz — Express router + reusable logic.
//
// Port of scripts/download_api.py. Files are streamed by token (no symlinks,
// no token directories): the token is a 32-char unguessable key stored in
// tokens.json; without it the bundles have no public URL.
//
//   DOWNLOAD_SRC_DIR=/srv/legalskills/bundles   # real files live here
//   DOWNLOAD_DATA_DIR=/srv/legalskills/data     # leads.csv + tokens.json (NOT webroot)
//
//   node scripts/download_api.mjs --selftest
//   node scripts/download_api.mjs --cleanup     # cron, hourly: purge links > 48 h
//
// The server wires the router with explicit paths:
//   app.use(apiRouter({ srcDir: SRC_DIR, dataDir: DATA_DIR }))
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import express from 'express';

export const TTL = 48 * 3600;
export const FILES = ['legalsuite.tar.gz'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Module-level defaults (env-configurable); apiRouter takes explicit paths.
let SRC_DIR = process.env.DOWNLOAD_SRC_DIR || '/srv/legalskills/bundles';
let DATA_DIR = process.env.DOWNLOAD_DATA_DIR || '/srv/legalskills/data';

const tokensPath = (dir = DATA_DIR) => path.join(dir, 'tokens.json');
const leadsPath = (dir = DATA_DIR) => path.join(dir, 'leads.csv');

// Python datetime.isoformat() shape: microseconds + "+00:00" (not JS ".123Z").
function isoUtc(date = new Date()) {
  return date.toISOString().replace(/\.(\d{3})Z$/, (_, ms) => `.${ms}000+00:00`);
}

// Python csv QUOTE_MINIMAL: quote only on delimiter, quotechar or line break.
function csvField(value) {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const csvRow = (fields) => fields.map(csvField).join(',') + '\r\n';

export function loadTokens(dir = DATA_DIR) {
  try {
    return JSON.parse(fs.readFileSync(tokensPath(dir), 'utf8'));
  } catch {
    return {};
  }
}

export function saveTokens(tokens, dir = DATA_DIR) {
  fs.mkdirSync(dir, { recursive: true });
  const file = tokensPath(dir);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(tokens), 'utf8');
  fs.renameSync(tmp, file);
}

export function validate(name, email, consent) {
  return (
    typeof name === 'string' &&
    name.trim().length >= 2 &&
    typeof email === 'string' &&
    EMAIL_RE.test(email.trim()) &&
    consent === true
  );
}

export function mint(name, email, lang = 'cs', opts = {}) {
  const srcDir = opts.srcDir ?? SRC_DIR;
  const dataDir = opts.dataDir ?? DATA_DIR;
  const token = crypto.randomBytes(24).toString('base64url'); // 32 chars
  const exp = Math.floor(Date.now() / 1000) + TTL;

  fs.mkdirSync(dataDir, { recursive: true });
  const leads = leadsPath(dataDir);
  const isNew = !fs.existsSync(leads);
  let row = '';
  if (isNew) row += csvRow(['ts', 'name', 'email', 'lang', 'token', 'expires']);
  row += csvRow([isoUtc(), name.trim(), email.trim(), lang, token, exp]);
  fs.appendFileSync(leads, row, 'utf8');

  const tokens = loadTokens(dataDir);
  tokens[token] = { exp, email: email.trim() };
  saveTokens(tokens, dataDir);
  return { token, exp };
}

export function cleanup(opts = {}) {
  const dataDir = opts.dataDir ?? DATA_DIR;
  const tokens = loadTokens(dataDir);
  const now = Math.floor(Date.now() / 1000);
  const dead = Object.keys(tokens).filter((t) => (tokens[t].exp ?? 0) < now);
  for (const t of dead) delete tokens[t];
  if (dead.length) saveTokens(tokens, dataDir);
  return dead.length;
}

export function apiRouter({ srcDir, dataDir }) {
  const router = express.Router();

  router.get('/api/health', (_req, res) => res.json({ ok: true }));

  router.post('/api/request-download', express.json(), (req, res) => {
    const data = req.body ?? {};
    if (!validate(data.name ?? '', data.email ?? '', data.consent)) {
      return res.status(400).json({ ok: false });
    }
    const { token, exp } = mint(data.name, data.email, data.lang ?? 'cs', { srcDir, dataDir });
    res.json({
      ok: true,
      links: FILES.map((file) => ({ file, url: `/downloads/${token}/${file}` })),
      expiresAt: isoUtc(new Date(exp * 1000)),
    });
  });

  // Malformed JSON body -> 400 {ok:false} instead of Express's HTML error.
  router.use((err, _req, res, next) => {
    if (err) return res.status(400).json({ ok: false });
    next();
  });

  router.get('/downloads/:token/:file', (req, res) => {
    const { token, file } = req.params;
    const tokens = loadTokens(dataDir);
    const entry = tokens[token];
    const now = Math.floor(Date.now() / 1000);
    if (!entry || (entry.exp ?? 0) < now) return res.status(404).json({ ok: false });
    if (!FILES.includes(file)) return res.status(404).json({ ok: false }); // blocks traversal

    const abs = path.join(srcDir, file);
    if (!fs.existsSync(abs)) return res.status(404).json({ ok: false });

    res.setHeader('Content-Type', file.endsWith('.tar.gz') ? 'application/gzip' : 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    const stream = fs.createReadStream(abs);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ ok: false });
      else res.destroy();
    });
    stream.pipe(res);
  });

  router.use((_req, res) => res.status(404).json({ ok: false }));

  return router;
}

export function selftest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dlg-'));
  const srcDir = path.join(tmp, 'bundles');
  const dataDir = path.join(tmp, 'data');
  fs.mkdirSync(srcDir);
  for (const f of FILES) fs.writeFileSync(path.join(srcDir, f), 'x');

  assert(!validate('A', 'bad', true), 'bad email must fail');
  assert(!validate('Bo', 'a@b.cz', false), 'missing consent must fail');
  assert(validate('Božena', 'boz@example.cz', true), 'valid input must pass');

  const { token, exp } = mint('Božena', 'boz@example.cz', 'cs', { srcDir, dataDir });
  assert(token.length >= 32, 'token must be unguessable');
  assert(exp - Date.now() / 1000 > 47 * 3600, 'TTL must be ~48h');

  assert(cleanup({ dataDir }) === 0, 'fresh token must survive cleanup');

  const tokens = loadTokens(dataDir);
  tokens[token].exp = Math.floor(Date.now() / 1000) - 1;
  saveTokens(tokens, dataDir);
  assert(cleanup({ dataDir }) === 1 && !loadTokens(dataDir)[token], 'expired token must be purged');

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('download_api selftest PASS');
}

function assert(cond, msg) {
  if (!cond) throw new Error(`selftest failed: ${msg}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) {
    selftest();
  } else if (args.includes('--cleanup')) {
    console.log(`purged ${cleanup()} expired token(s)`);
  } else {
    console.log('usage: download_api.mjs --selftest | --cleanup');
  }
}
