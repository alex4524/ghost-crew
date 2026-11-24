#!/usr/bin/env node
import { runAppCli } from '../../core/index.js';

process.exitCode = await runAppCli('poltergeist', process.argv.slice(2));
