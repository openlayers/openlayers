/**
 * @module ol/obj
 */

/**
 * Polyfill for Object.assign().  Assigns enumerable and own properties from
 * one or more source objects to a target object.
 * See https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign.
 *
 * @param {!Object} target The target object.
 * @param {...Object} var_sources The source object(s).
 * @return {!Object} The modified target object.
 */
export const assign =
  typeof Object.assign === 'function'
    ? Object.assign
    : function (target, var_sources) {
        if (target === undefined || target === null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        const output = Object(target);
        for (let i = 1, ii = arguments.length; i < ii; ++i) {
          const source = arguments[i];
          if (source !== undefined && source !== null) {
            for (const key in source) {
              if (source.hasOwnProperty(key)) {
                output[key] = source[key];
              }
            }
          }
        }
        return output;
      };

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
 * Polyfill for Object.values().  Get an array of property values from an object.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values
 *
 * @param {!Object<K,V>} object The object from which to get the values.
 * @return {!Array<V>} The property values.
 * @template K,V
 */
export const getValues =
  typeof Object.values === 'function'
    ? Object.values
    : function (object) {
        const values = [];
        for (const property in object) {
          values.push(object[property]);
        }
        return values;
      };

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
