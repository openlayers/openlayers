/**
 * @module ol/console
 */

/**
 * @typedef {'info'|'warn'|'error'|'none'} Level
 */

/**
 * @type {Object<Level, number>}
 */
const levels = {
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * @type {number}
 */
let level = levels.info;

/**
 * Set the logging level.  By default, the level is set to 'info' and all
 * messages will be logged.  Set to 'warn' to only display warnings and errors.
 * Set to 'error' to only display errors.  Set to 'none' to silence all messages.
 *
 * @param {Level} l The new level.
 */
export function setLevel(l) {
  level = levels[l];
}

/**
 * @param  {...any} args Arguments to log
 */
export function log(...args) {
  if (level > levels.info) {
    return;
  }
  console.log(...args); // eslint-disable-line no-console
}

/**
 * @param  {...any} args Arguments to log
 */
export function warn(...args) {
  if (level > levels.warn) {
    return;
  }
  console.warn(...args); // eslint-disable-line no-console
}

/**
 * @param  {...any} args Arguments to log
 */
export function error(...args) {
  if (level > levels.error) {
    return;
  }
  console.error(...args); // eslint-disable-line no-console
}
