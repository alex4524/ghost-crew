#!/usr/bin/env node
// Assemble the GitHub Pages site: landing page + nightly reports + both demo houses → _site/
import fs from 'node:fs/promises';
import path from 'node:path';
import { PACKAGE_ROOT } from '../core/index.js';

const out = path.join(PACKAGE_ROOT, '_site');
await fs.rm(out, { recursive: true, force: true });
await fs.cp(path.join(PACKAGE_ROOT, 'site'), out, { recursive: true });
await fs.cp(path.join(PACKAGE_ROOT, 'demo'), path.join(out, 'demo'), { recursive: true });
await fs.writeFile(path.join(out, '.nojekyll'), '');
const reports = await fs.readdir(path.join(out, 'reports')).catch(() => []);
console.log(`Built _site/ with ${reports.filter((r) => !r.endsWith('.json')).length} séance records.`);
