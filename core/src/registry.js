// @ts-check
/**
 * The two extension points of the skeleton: senses and apps.
 * Everything an app adds goes through these functions.
 */

/**
 * @typedef {import('./types.js').SenseDef} SenseDef
 * @typedef {import('./types.js').AppDef} AppDef
 */

/** @type {Map<string, SenseDef & { name: string }>} */
const senses = new Map();
/** @type {Map<string, AppDef>} */
const apps = new Map();

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Register a sense. A sense inspects a page and reports hauntings.
 * @param {string} name kebab-case, unique
 * @param {SenseDef} def
 */
export function defineSense(name, def) {
  if (!NAME.test(name)) throw new Error(`Sense name "${name}" must be kebab-case`);
  if (typeof def?.run !== 'function') throw new Error(`Sense "${name}" needs a run(ctx, options) function`);
  senses.set(name, { ...def, name });
  return name;
}

/** @param {string} name */
export function getSense(name) {
  return senses.get(name);
}

export function senseNames() {
  return [...senses.keys()].sort();
}

export function allSenses() {
  return [...senses.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Register an app built on the skeleton.
 * @param {AppDef} def
 */
export function defineApp(def) {
  if (!NAME.test(def.name)) throw new Error(`App name "${def.name}" must be kebab-case`);
  apps.set(def.name, def);
  return def;
}

/** @param {string} name */
export function getApp(name) {
  return apps.get(name);
}

export function appNames() {
  return [...apps.keys()].sort();
}
