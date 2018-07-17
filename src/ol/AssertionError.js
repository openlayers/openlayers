/**
 * @module ol/AssertionError
 */
import {VERSION} from './util.js';

/**
 * Error object thrown when an assertion failed. This is an ECMA-262 Error,
 * extended with a `code` property.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
 * @extends {Error}
 */
class AssertionError extends Error {

  /**
   * @param {number} code Error code.
   */
  constructor(code) {
    const path = VERSION.split('-')[0];

    /**
     * @type {string}
     */
    this.message = 'Assertion failed. See https://openlayers.org/en/' + path +
        '/doc/errors/#' + code + ' for details.';

    /**
     * Error code. The meaning of the code can be found on
     * {@link https://openlayers.org/en/latest/doc/errors/} (replace `latest` with
     * the version found in the OpenLayers script's header comment if a version
     * other than the latest is used).
     * @type {number}
     * @api
     */
    this.code = code;

    /**
     * @type {string}
     */
    this.name = 'AssertionError';

  }

}

export default AssertionError;
