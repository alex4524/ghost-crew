// @ts-check
// Shared JSDoc types. This file exports nothing at runtime.

/**
 * @typedef {'wrathful' | 'restless' | 'mischievous' | 'faint'} Mood
 *
 * @typedef {{ x: number, y: number, w: number, h: number }} Box
 *
 * @typedef {Object} Step
 * @property {'click' | 'fill' | 'press' | 'wait' | 'scroll'} kind
 * @property {string} [target]
 * @property {string} [value]
 * @property {number} [ms]
 *
 * @typedef {Object} SenseUse
 * @property {string} name
 * @property {any} options
 *
 * @typedef {Object} Ghost
 * @property {string} name
 * @property {string} file
 * @property {string} [lore]
 * @property {string} haunts
 * @property {'desktop' | 'mobile'} device
 * @property {Step[]} steps
 * @property {SenseUse[]} senses
 *
 * @typedef {Object} HauntInput
 * @property {Mood} mood
 * @property {string} title       plain, theme-free statement of the problem
 * @property {string} [key]       stable id within this sense, used for exorcism diff
 * @property {string} [detail]
 * @property {string} [help]
 * @property {string} [helpUrl]
 * @property {string} [target]    human target, resolved with locate()
 * @property {import('playwright-core').Locator} [locator]
 * @property {string[]} [selectors] CSS selectors, every match gets a box
 * @property {Box[]} [boxes]
 *
 * @typedef {Object} Haunting
 * @property {number} n
 * @property {string} key
 * @property {string} sense
 * @property {Mood} mood
 * @property {string} title
 * @property {string} [detail]
 * @property {string} [help]
 * @property {string} [helpUrl]
 * @property {Box[]} boxes
 * @property {string} scene
 * @property {'new' | 'still'} [status]
 *
 * @typedef {Object} Scene
 * @property {string} label
 * @property {string} url
 * @property {string} [living]
 * @property {string} [spirit]
 * @property {string} [livingDetail]  crop around the hauntings
 * @property {string} [spiritDetail]
 * @property {Haunting[]} hauntings
 *
 * @typedef {Object} GhostResult
 * @property {string} ghost
 * @property {string} file
 * @property {string} [lore]
 * @property {string} url
 * @property {'desktop' | 'mobile'} device
 * @property {'quiet' | 'haunted' | 'lost'} state
 * @property {number} ms
 * @property {Scene[]} scenes
 * @property {Record<string, number>} tally
 * @property {string} [error]
 *
 * @typedef {Object} SenseContext
 * @property {import('playwright-core').Page} page
 * @property {Ghost} ghost
 * @property {string} url
 * @property {{ consoleErrors: string[], pageErrors: string[], failedRequests: string[] }} events
 * @property {(target: string) => Promise<import('playwright-core').Locator | null>} locate
 * @property {(h: HauntInput) => Promise<void>} haunt
 * @property {(label: string, fn: (ctx: SenseContext) => Promise<void>) => Promise<void>} scene
 * @property {(name: string, n?: number) => void} tally
 *
 * @typedef {Object} SenseDef
 * @property {string} [describe]
 * @property {(ctx: SenseContext, options: any) => Promise<void>} run
 *
 * @typedef {Object} Theme
 * @property {string} name        shown as the report title
 * @property {string} tagline
 * @property {string} [tallyLabel] how to read ghost tallies, e.g. "curses survived"
 *
 * @typedef {Object} AppDef
 * @property {string} name
 * @property {Theme} theme
 * @property {(url: string) => Ghost[]} [defaultCrew]  zero-config ghosts for a bare URL
 * @property {string} [ghostsDir]  folder of example ghosts shipped with the app
 */

export {};
