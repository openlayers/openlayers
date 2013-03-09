goog.provide('ol.parser.polyline');


/**
 * Encode one single signed integer and return an encoded string
 *
 * @param {number} num Signed integer that should be encoded.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeSignedInteger = function(num) {
  var sgn_num = num << 1;
  if (num < 0)
    sgn_num = ~(sgn_num);

  return ol.parser.polyline.encodeUnsignedInteger(sgn_num);
};


/**
 * Encode one single unsigned integer and return an encoded string
 *
 * @param {number} num Unsigned integer that should be encoded.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeUnsignedInteger = function(num) {
  var value, encodeString = '';
  while (num >= 0x20) {
    value = (0x20 | (num & 0x1f)) + 63;
    encodeString += (String.fromCharCode(value));
    num >>= 5;
  }
  value = num + 63;
  encodeString += (String.fromCharCode(value));
  return encodeString;
};
