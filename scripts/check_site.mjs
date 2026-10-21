#!/usr/bin/env node
// Static checks for the LegalSkills.cz site. Node port of scripts/check_site.py.
//
//     node scripts/check_site.mjs
//
// Fails (exit 1) if:
//   1. the Czech and English page sets diverge, or
//   2. any internal link / asset referenced by an HTML file does not exist, or
//   3. a generated page on disk differs from a fresh render of its source
//      (the committed HTML is derived output; it must never be stale).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, SLUGS } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['assets', 'scripts', '.git', '.openchamber', 'downloads', 'data', 'storage', 'node_modules', '.workflow']);
const LINK_RE = /(?:href|src)="([^"]+)"/g;
const DYNAMIC_PREFIXES = ['/api/', '/downloads/'];

function htmlFiles() {
  const out = [];
  (function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(path.join(dir, ent.name));
      } else if (ent.name.endsWith('.html')) {
        out.push(path.relative(ROOT, path.join(dir, ent.name)));
      }
    }
  })(ROOT);
  return out.sort();
}

// Page identity independent of language: 'en/blog/x.html' -> 'blog/x.html'.
const slug = (p) => (p.startsWith('en/') ? p.slice(3) : p);

// Return the on-disk target for an internal link, or null if external.
function resolve(pagePath, link) {
  if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(link)) return null;
  link = link.split('#')[0].split('?')[0];
  if (!link) return null;
  let target = link.startsWith('/')
    ? path.join(ROOT, link.replace(/^\/+/, ''))
    : path.join(ROOT, path.dirname(pagePath), link);
  target = path.normalize(target);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  } else if (!path.extname(target)) {
    target += '.html';
  }
  return target;
}

function main() {
  const files = htmlFiles();
  const cs = new Set(files.filter((p) => !p.startsWith('en/')).map(slug));
  const en = new Set(files.filter((p) => p.startsWith('en/')).map(slug));
  const problems = [];

  const missingEn = [...cs].filter((x) => !en.has(x)).sort();
  const missingCs = [...en].filter((x) => !cs.has(x)).sort();
  if (missingEn.length) problems.push(`pages with no English version: ${JSON.stringify(missingEn)}`);
  if (missingCs.length) problems.push(`pages with no Czech version: ${JSON.stringify(missingCs)}`);

  const broken = [];
  for (const pagePath of files) {
    const text = fs.readFileSync(path.join(ROOT, pagePath), 'utf8');
    for (const m of text.matchAll(LINK_RE)) {
      const link = m[1];
      if (DYNAMIC_PREFIXES.some((p) => link.startsWith(p))) continue; // minted at runtime
      const target = resolve(pagePath, link);
      if (target !== null && !fs.existsSync(target)) {
        broken.push(`${pagePath}: ${link} -> ${path.relative(ROOT, target)}`);
      }
    }
  }
  if (broken.length) problems.push('broken links/assets:\n    ' + [...new Set(broken)].sort().join('\n    '));

  // The HTML on disk is generated output. It must match a fresh render of
  // scripts/render.mjs, or the published site drifts from its source.
  const stale = [];
  const expected = new Set();
  for (const slug of SLUGS) {
    const rel = slug || 'index.html';
    expected.add(rel);
    expected.add(path.join('en', rel));
    for (const lang of ['cs', 'en']) {
      const file = path.join(ROOT, lang === 'en' ? path.join('en', rel) : rel);
      if (!fs.existsSync(file)) {
        stale.push(`${lang === 'en' ? 'en/' : ''}${rel}: missing (run npm run build)`);
      } else if (fs.readFileSync(file, 'utf8') !== renderPage(lang, slug)) {
        stale.push(`${lang === 'en' ? 'en/' : ''}${rel}: differs from render (run npm run build)`);
      }
    }
  }
  if (stale.length) problems.push('stale generated pages:\n    ' + stale.sort().join('\n    '));

  // A page on disk that render.mjs does not produce is an orphan: a page
  // added by hand, or one whose source entry was removed. Either way it is
  // published but unverifiable.
  const orphans = files.filter((p) => !expected.has(p));
  if (orphans.length) {
    problems.push('orphan pages (not produced by render.mjs):\n    ' + orphans.sort().join('\n    '));
  }

  console.log(`pages: ${files.length} (${cs.size} cs / ${en.size} en)`);
  if (problems.length) {
    console.log('FAIL');
    for (const p of problems) console.log('  - ' + p);
    return 1;
  }
  console.log('PASS — cs/en parity intact, all internal links resolve, no stale generated pages.');
  return 0;
}

process.exit(main());
