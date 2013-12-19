goog.provide('ol.format.Polyline');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.format.Text');
goog.require('ol.geom.LineString');
goog.require('ol.geom.flat');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.format.Text}
 */
ol.format.Polyline = function() {
  goog.base(this);
};
goog.inherits(ol.format.Polyline, ol.format.Text);


/**
 * Encode a list of coordinates in a flat array and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} flatPoints A flat array of coordinates.
 * @param {number=} opt_dimension The dimension of the coordinates in the array.
 * @return {string} The encoded string.
 */
ol.format.Polyline.encodeFlatCoordinates =
    function(flatPoints, opt_dimension) {
  var dimension = goog.isDef(opt_dimension) ? opt_dimension : 2;
  return ol.format.Polyline.encodeDeltas(flatPoints, dimension);
};


/**
 * Decode a list of coordinates from an encoded string into a flat array
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_dimension The dimension of the coordinates in the
 * encoded string.
 * @return {Array.<number>} A flat array of coordinates.
 */
ol.format.Polyline.decodeFlatCoordinates = function(encoded, opt_dimension) {
  var dimension = goog.isDef(opt_dimension) ? opt_dimension : 2;
  return ol.format.Polyline.decodeDeltas(encoded, dimension);
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
ol.format.Polyline.encodeDeltas = function(numbers, dimension, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  var d;

  var lastNumbers = new Array(dimension);
  for (d = 0; d < dimension; ++d) {
    lastNumbers[d] = 0;
  }

  var i, ii;
  for (i = 0, ii = numbers.length; i < ii;) {
    for (d = 0; d < dimension; ++d, ++i) {
      var num = numbers[i];
      var delta = num - lastNumbers[d];
      lastNumbers[d] = num;

      numbers[i] = delta;
    }
  }

  return ol.format.Polyline.encodeFloats(numbers, factor);
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
ol.format.Polyline.decodeDeltas = function(encoded, dimension, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  var d;

  var lastNumbers = new Array(dimension);
  for (d = 0; d < dimension; ++d) {
    lastNumbers[d] = 0;
  }

  var numbers = ol.format.Polyline.decodeFloats(encoded, factor);

  var i, ii;
  for (i = 0, ii = numbers.length; i < ii;) {
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
ol.format.Polyline.encodeFloats = function(numbers, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;

  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    numbers[i] = Math.round(numbers[i] * factor);
  }

  return ol.format.Polyline.encodeSignedIntegers(numbers);
};


/**
 * Decode a list of floating point numbers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_factor The factor by which the result will be divided.
 * @return {Array.<number>} A list of floating point numbers.
 */
ol.format.Polyline.decodeFloats = function(encoded, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  var numbers = ol.format.Polyline.decodeSignedIntegers(encoded);
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
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
ol.format.Polyline.encodeSignedIntegers = function(numbers) {
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    var num = numbers[i];
    numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
  }
  return ol.format.Polyline.encodeUnsignedIntegers(numbers);
};


/**
 * Decode a list of signed integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of signed integers.
 */
ol.format.Polyline.decodeSignedIntegers = function(encoded) {
  var numbers = ol.format.Polyline.decodeUnsignedIntegers(encoded);
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
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
ol.format.Polyline.encodeUnsignedIntegers = function(numbers) {
  var encoded = '';
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    encoded += ol.format.Polyline.encodeUnsignedInteger(numbers[i]);
  }
  return encoded;
};


/**
 * Decode a list of unsigned integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of unsigned integers.
 */
ol.format.Polyline.decodeUnsignedIntegers = function(encoded) {
  var numbers = [];
  var current = 0;
  var shift = 0;
  var i, ii;
  for (i = 0, ii = encoded.length; i < ii; ++i) {
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
ol.format.Polyline.encodeFloat = function(num, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  num = Math.round(num * factor);
  return ol.format.Polyline.encodeSignedInteger(num);
};


/**
 * Decode one single floating point number from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_factor The factor by which the result will be divided.
 * @return {number} The decoded floating point number.
 */
ol.format.Polyline.decodeFloat = function(encoded, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  var result = ol.format.Polyline.decodeSignedInteger(encoded);
  return result / factor;
};


/**
 * Encode one single signed integer and return an encoded string
 *
 * @param {number} num Signed integer that should be encoded.
 * @return {string} The encoded string.
 */
ol.format.Polyline.encodeSignedInteger = function(num) {
  var signedNum = (num < 0) ? ~(num << 1) : (num << 1);
  return ol.format.Polyline.encodeUnsignedInteger(signedNum);
};


/**
 * Decode one single signed integer from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {number} The decoded signed integer.
 */
ol.format.Polyline.decodeSignedInteger = function(encoded) {
  var result = ol.format.Polyline.decodeUnsignedInteger(encoded);
  return ((result & 1) ? ~(result >> 1) : (result >> 1));
};


/**
 * Encode one single unsigned integer and return an encoded string
 *
 * @param {number} num Unsigned integer that should be encoded.
 * @return {string} The encoded string.
 */
ol.format.Polyline.encodeUnsignedInteger = function(num) {
  var value, encoded = '';
  while (num >= 0x20) {
    value = (0x20 | (num & 0x1f)) + 63;
    encoded += String.fromCharCode(value);
    num >>= 5;
  }
  value = num + 63;
  encoded += String.fromCharCode(value);
  return encoded;
};


/**
 * Decode one single unsigned integer from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {number} The decoded unsigned integer.
 */
ol.format.Polyline.decodeUnsignedInteger = function(encoded) {
  var result = 0;
  var shift = 0;
  var i, ii;
  for (i = 0, ii = encoded.length; i < ii; ++i) {
    var b = encoded.charCodeAt(i) - 63;
    result |= (b & 0x1f) << shift;
    if (b < 0x20) {
      break;
    }
    shift += 5;
  }
  return result;
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readFeatureFromText = function(text) {
  var geometry = this.readGeometryFromText(text);
  return new ol.Feature(geometry);
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readFeaturesFromText = function(text) {
  var feature = this.readFeatureFromText(text);
  return [feature];
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readGeometryFromText = function(text) {
  var flatCoordinates = ol.format.Polyline.decodeFlatCoordinates(text, 2);
  var coordinates = ol.geom.flat.inflateCoordinates(
      flatCoordinates, 0, flatCoordinates.length, 2);
  return new ol.geom.LineString(coordinates);
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readProjectionFromText = function(text) {
  return ol.proj.get('EPSG:4326');
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.writeFeatureText = function(feature) {
  var geometry = feature.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    return this.writeGeometryText(geometry);
  } else {
    goog.asserts.fail();
    return '';
  }
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.writeFeaturesText = function(features) {
  goog.asserts.assert(features.length == 1);
  return this.writeFeatureText(features[0]);
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.writeGeometryText = function(geometry) {
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  return ol.format.Polyline.encodeFlatCoordinates(flatCoordinates, stride);
};
