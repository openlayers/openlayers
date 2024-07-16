/**
 * @module ol/functions
 */

import {equals as arrayEquals} from './array.js';

/**
 * Always returns true.
 * @return {boolean} true.
 */
export function TRUE() {
  return true;
}

/**
 * Always returns false.
 * @return {boolean} false.
 */
export function FALSE() {
  return false;
}

/**
 * A reusable function, used e.g. as a default for callbacks.
 *
 * @return {void} Nothing.
 */
export function VOID() {}

/**
 * Wrap a function in another function that remembers the last return.  If the
 * returned function is called twice in a row with the same arguments and the same
 * this object, it will return the value from the first call in the second call.
 *
 * @param {function(...any): ReturnType} fn The function to memoize.
 * @return {function(...any): ReturnType} The memoized function.
 * @template ReturnType
 */
export function memoizeOne(fn) {
  /** @type {ReturnType} */
  let lastResult;

  /** @type {Array<any>|undefined} */
  let lastArgs;

  let lastThis;

  /**
   * @this {*} Only need to know if `this` changed, don't care what type
   * @return {ReturnType} Memoized value
   */
  return function () {
    const nextArgs = Array.prototype.slice.call(arguments);
    if (!lastArgs || this !== lastThis || !arrayEquals(nextArgs, lastArgs)) {
      lastThis = this;
      lastArgs = nextArgs;
      lastResult = fn.apply(this, arguments);
    }
    return lastResult;
  };
}

/**
 * @template T
 * @param {function(): (T | Promise<T>)} getter A function that returns a value or a promise for a value.
 * @return {Promise<T>} A promise for the value.
 */
export function toPromise(getter) {
  function promiseGetter() {
    let value;
    try {
      value = getter();
    } catch (err) {
      return Promise.reject(err);
    }
    if (value instanceof Promise) {
      return value;
    }
    return Promise.resolve(value);
  }
  return promiseGetter();
}
