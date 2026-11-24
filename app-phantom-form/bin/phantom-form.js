#!/usr/bin/env node
import { runAppCli } from '../../core/index.js';

process.exitCode = await runAppCli('phantom-form', process.argv.slice(2));
