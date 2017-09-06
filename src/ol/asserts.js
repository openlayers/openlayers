import _ol_AssertionError_ from './assertionerror';
var _ol_asserts_ = {};


/**
 * @param {*} assertion Assertion we expected to be truthy.
 * @param {number} errorCode Error code.
 */
_ol_asserts_.assert = function(assertion, errorCode) {
  if (!assertion) {
    throw new _ol_AssertionError_(errorCode);
  }
};
export default _ol_asserts_;
