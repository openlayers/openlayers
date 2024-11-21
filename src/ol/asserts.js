/**
 * @module ol/asserts
 */

/**
 * @param {*} assertion Assertion we expected to be truthy.
 * @param {string} errorMessage Error message.
 */
export function assert(assertion, errorMessage) {
  if (!assertion) {
    throw new Error(errorMessage);
  }
}
