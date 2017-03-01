goog.provide('ol.AssertionError');

goog.require('ol');

/**
 * Error object thrown when an assertion failed. This is an ECMA-262 Error,
 * extended with a `code` property.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
 * @constructor
 * @extends {Error}
 * @implements {oli.AssertionError}
 * @param {number} code Error code.
 */
ol.AssertionError = function(code) {

  /**
   * @type {string}
   */
  this.message = 'Assertion failed. See ' +
      (ol.VERSION ? 'https://openlayers.org/en/' + ol.VERSION.split('-')[0] : '') +
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

  this.name = 'AssertionError';

};
ol.inherits(ol.AssertionError, Error);
