goog.provide('ol.string');

goog.require('goog.asserts');

/**
 * Checks whether a given string ends with another string. Will use the ES6
 * method `String.prototype.endsWith` if possible.
 *
 * @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
 * @param {!string} subjectString The string to test.
 * @param {!string} searchString The string to be searched for at the end of the
 *     subjectString.
 * @return {boolean} Whether subjectString ends with searchString.
 */
ol.string.endsWith = function(subjectString, searchString) {
  goog.asserts.assert(subjectString !== undefined,
      'subjectString must not be undefined');
  goog.asserts.assert(searchString !== undefined,
      'searchString must not be undefined');
  if ('endsWith' in String.prototype) {
    return subjectString.endsWith(searchString);
  }
  var pos = subjectString.length - searchString.length;
  var lastIndex = subjectString.indexOf(searchString, pos);
  return lastIndex !== -1 && lastIndex === pos;
};
