#!/usr/bin/env node
// LegalSkills.cz static site generator CLI — Node.js port of scripts/build_site.py.
// Writes hand-quality static HTML (cs at root, en under /en/).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const n = build(process.env.OUT_ROOT || ROOT);
console.log(`built ${n} pages`);
