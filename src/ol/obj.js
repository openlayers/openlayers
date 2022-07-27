/**
 * @module ol/obj
 */

/**
 * Removes all properties from an object.
 * @param {Object} object The object to clear.
 */
export function clear(object) {
  for (const property in object) {
    delete object[property];
  }
}

/**
 * Determine if an object has any properties.
 * @param {Object} object The object to check.
 * @return {boolean} The object is empty.
 */
export function isEmpty(object) {
  let property;
  for (property in object) {
    return false;
  }
  return !property;
}
