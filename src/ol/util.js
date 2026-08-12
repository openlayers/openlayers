/**
 * @module ol/util
 */

/**
 * @return {never} Any return.
 */
export function abstract() {
  throw new Error('Unimplemented abstract method.');
}

/**
 * Counter for getUid.
 * @type {number}
 * @private
 */
let uidCounter_ = 0;

/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {string} The unique ID for the object.
 * @api
 */
export function getUid(obj) {
  const uidObj = /** @type {{ol_uid: (string|undefined)}} */ (
    /** @type {unknown} */ (obj)
  );
  return uidObj.ol_uid || (uidObj.ol_uid = String(++uidCounter_));
}

/**
 * OpenLayers version.
 * @type {string}
 */
export const VERSION = 'latest';

/***
 * Determine whether a value is thenable, i.e. it has `then` and `catch` methods.
 * @param {*} value The value to check.
 * @return {value is Promise<any>} The value is thenable.
 */
export function isThenable(value) {
  return (
    !!value &&
    typeof value.then === 'function' &&
    typeof value.catch === 'function'
  );
}
