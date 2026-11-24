// @ts-check
// Public surface of the Ghost Crew skeleton. Apps import from here and nowhere else.
export { defineSense, defineApp, getApp, appNames, senseNames, allSenses } from './src/registry.js';
export { parseGhost, loadGhosts, findGhostFiles, resolveHaunt, GhostError, ghostTemplate, ghostFileName } from './src/ghost.js';
export { summon, walkSteps } from './src/runner.js';
export { locate } from './src/locate.js';
export { findOverflow, findBrokenCharacters, findText } from './src/senses/page-probes.js';
export { buildReport, writeReport, readReport, summarize, MOODS } from './src/report/model.js';
export { renderReportHtml, BASE_CSS, FONTS, GHOST_MARK } from './src/report/html.js';
export { serveStatic } from './src/serve.js';
export { loadApps, PACKAGE_ROOT } from './src/apps.js';
export { haunt, runCli, runAppCli } from './src/cli.js';
