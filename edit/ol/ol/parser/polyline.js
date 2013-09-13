goog.provide('ol.parser.polyline');


/**
 * Encode a list of coordinates in a flat array and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} flatPoints A flat array of coordinates.
 * @param {number=} opt_dimension The dimension of the coordinates in the array.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeFlatCoordinates =
    function(flatPoints, opt_dimension) {
  var dimension = opt_dimension || 2;
  return ol.parser.polyline.encodeDeltas(flatPoints, dimension);
};


/**
 * Decode a list of coordinates from an encoded string into a flat array
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_dimension The dimension of the coordinates in the
 * encoded string.
 * @return {Array.<number>} A flat array of coordinates.
 */
ol.parser.polyline.decodeFlatCoordinates = function(encoded, opt_dimension) {
  var dimension = opt_dimension || 2;
  return ol.parser.polyline.decodeDeltas(encoded, dimension);
};


/**
 * Encode a list of n-dimensional points and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} numbers A list of n-dimensional points.
 * @param {number} dimension The dimension of the points in the list.
 * @param {number=} opt_factor The factor by which the numbers will be
 * multiplied. The remaining decimal places will get rounded away.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeDeltas = function(numbers, dimension, opt_factor) {
  var factor = opt_factor || 1e5;
  var d;

  var lastNumbers = new Array(dimension);
  for (d = 0; d < dimension; ++d) {
    lastNumbers[d] = 0;
  }

  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength;) {
    for (d = 0; d < dimension; ++d, ++i) {
      var num = numbers[i];
      var delta = num - lastNumbers[d];
      lastNumbers[d] = num;

      numbers[i] = delta;
    }
  }

  return ol.parser.polyline.encodeFloats(numbers, factor);
};


/**
 * Decode a list of n-dimensional points from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number} dimension The dimension of the points in the encoded string.
 * @param {number=} opt_factor The factor by which the resulting numbers will
 * be divided.
 * @return {Array.<number>} A list of n-dimensional points.
 */
ol.parser.polyline.decodeDeltas = function(encoded, dimension, opt_factor) {
  var factor = opt_factor || 1e5;
  var d;

  var lastNumbers = new Array(dimension);
  for (d = 0; d < dimension; ++d) {
    lastNumbers[d] = 0;
  }

  var numbers = ol.parser.polyline.decodeFloats(encoded, factor);

  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength;) {
    for (d = 0; d < dimension; ++d, ++i) {
      lastNumbers[d] += numbers[i];

      numbers[i] = lastNumbers[d];
    }
  }

  return numbers;
};


/**
 * Encode a list of floating point numbers and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} numbers A list of floating point numbers.
 * @param {number=} opt_factor The factor by which the numbers will be
 * multiplied. The remaining decimal places will get rounded away.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeFloats = function(numbers, opt_factor) {
  var factor = opt_factor || 1e5;

  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength; ++i) {
    numbers[i] = Math.round(numbers[i] * factor);
  }

  return ol.parser.polyline.encodeSignedIntegers(numbers);
};


/**
 * Decode a list of floating point numbers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_factor The factor by which the result will be divided.
 * @return {Array.<number>} A list of floating point numbers.
 */
ol.parser.polyline.decodeFloats = function(encoded, opt_factor) {
  var factor = opt_factor || 1e5;

  var numbers = ol.parser.polyline.decodeSignedIntegers(encoded);

  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength; ++i) {
    numbers[i] /= factor;
  }

  return numbers;
};


/**
 * Encode a list of signed integers and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} numbers A list of signed integers.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeSignedIntegers = function(numbers) {
  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength; ++i) {
    var num = numbers[i];

    var signedNum = num << 1;
    if (num < 0) {
      signedNum = ~(signedNum);
    }

    numbers[i] = signedNum;
  }

  return ol.parser.polyline.encodeUnsignedIntegers(numbers);
};


/**
 * Decode a list of signed integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of signed integers.
 */
ol.parser.polyline.decodeSignedIntegers = function(encoded) {
  var numbers = ol.parser.polyline.decodeUnsignedIntegers(encoded);

  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength; ++i) {
    var num = numbers[i];
    numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
  }

  return numbers;
};


/**
 * Encode a list of unsigned integers and return an encoded string
 *
 * @param {Array.<number>} numbers A list of unsigned integers.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeUnsignedIntegers = function(numbers) {
  var encoded = '';

  var numbersLength = numbers.length;
  for (var i = 0; i < numbersLength; ++i) {
    encoded += ol.parser.polyline.encodeUnsignedInteger(numbers[i]);
  }

  return encoded;
};


/**
 * Decode a list of unsigned integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of unsigned integers.
 */
ol.parser.polyline.decodeUnsignedIntegers = function(encoded) {
  var numbers = [];

  var current = 0;
  var shift = 0;

  var encodedLength = encoded.length;
  for (var i = 0; i < encodedLength; ++i) {
    var b = encoded.charCodeAt(i) - 63;

    current |= (b & 0x1f) << shift;

    if (b < 0x20) {
      numbers.push(current);
      current = 0;
      shift = 0;
    } else {
      shift += 5;
    }
  }

  return numbers;
};


/**
 * Encode one single floating point number and return an encoded string
 *
 * @param {number} num Floating point number that should be encoded.
 * @param {number=} opt_factor The factor by which num will be multiplied.
 * The remaining decimal places will get rounded away.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeFloat = function(num, opt_factor) {
  num = Math.round(num * (opt_factor || 1e5));
  return ol.parser.polyline.encodeSignedInteger(num);
};


/**
 * Decode one single floating point number from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_factor The factor by which the result will be divided.
 * @return {number} The decoded floating point number.
 */
ol.parser.polyline.decodeFloat = function(encoded, opt_factor) {
  var result = ol.parser.polyline.decodeSignedInteger(encoded);
  return result / (opt_factor || 1e5);
};


/**
 * Encode one single signed integer and return an encoded string
 *
 * @param {number} num Signed integer that should be encoded.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeSignedInteger = function(num) {
  var signedNum = num << 1;
  if (num < 0) {
    signedNum = ~(signedNum);
  }

  return ol.parser.polyline.encodeUnsignedInteger(signedNum);
};


/**
 * Decode one single signed integer from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {number} The decoded signed integer.
 */
ol.parser.polyline.decodeSignedInteger = function(encoded) {
  var result = ol.parser.polyline.decodeUnsignedInteger(encoded);
  return ((result & 1) ? ~(result >> 1) : (result >> 1));
};


/**
 * Encode one single unsigned integer and return an encoded string
 *
 * @param {number} num Unsigned integer that should be encoded.
 * @return {string} The encoded string.
 */
ol.parser.polyline.encodeUnsignedInteger = function(num) {
  var value, encoded = '';
  while (num >= 0x20) {
    value = (0x20 | (num & 0x1f)) + 63;
    encoded += (String.fromCharCode(value));
    num >>= 5;
  }
  value = num + 63;
  encoded += (String.fromCharCode(value));
  return encoded;
};


/**
 * Decode one single unsigned integer from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {number} The decoded unsigned integer.
 */
ol.parser.polyline.decodeUnsignedInteger = function(encoded) {
  var result = 0;
  var shift = 0;

  var encodedLength = encoded.length;
  for (var i = 0; i < encodedLength; ++i) {
    var b = encoded.charCodeAt(i) - 63;

    result |= (b & 0x1f) << shift;

    if (b < 0x20)
      break;

    shift += 5;
  }

  return result;
};
