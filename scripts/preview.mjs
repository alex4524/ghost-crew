#!/usr/bin/env node
// Serve _site/ on 127.0.0.1 for a local look. Stops by itself after PREVIEW_SECONDS (default 900).
import path from 'node:path';
import { serveStatic, PACKAGE_ROOT } from '../core/index.js';

const s = await serveStatic(path.join(PACKAGE_ROOT, '_site'), Number(process.env.PREVIEW_AT ?? 4174));
console.log(`Previewing _site at ${s.url}`);
setTimeout(() => s.close().then(() => process.exit(0)), Number(process.env.PREVIEW_SECONDS ?? 900) * 1000);
