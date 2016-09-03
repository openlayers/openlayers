goog.provide('ol.asserts');

goog.require('ol.AssertionError');


/**
 * @param {*} assertion Assertion we expected to be truthy.
 * @param {number} errorCode Error code.
 */
ol.asserts.assert = function(assertion, errorCode) {
  if (!assertion) {
    throw new ol.AssertionError(errorCode);
  }
};
