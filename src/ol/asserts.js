/**
 * @module ol/asserts
 */
import AssertionError from './AssertionError.js';

/**
 * @param {*} assertion Assertion we expected to be truthy.
 * @param {number} errorCode Error code.
 */
export function assert(assertion, errorCode) {
  if (!assertion) {
    throw new AssertionError(errorCode);
  }
}
