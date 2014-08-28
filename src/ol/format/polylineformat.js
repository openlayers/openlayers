goog.provide('ol.format.Polyline');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.TextFeature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.flat.inflate');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.format.TextFeature}
 * @param {olx.format.PolylineOptions=} opt_options
 *     Optional configuration object.
 * @api stable
 */
ol.format.Polyline = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get('EPSG:4326');

  /**
   * @private
   * @type {number}
   */
  this.factor_ = goog.isDef(options.factor) ? options.factor : 1e5;
};
goog.inherits(ol.format.Polyline, ol.format.TextFeature);


/**
 * Encode a list of n-dimensional points and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} numbers A list of n-dimensional points.
 * @param {number} stride The number of dimension of the points in the list.
 * @param {number=} opt_factor The factor by which the numbers will be
 *     multiplied. The remaining decimal places will get rounded away.
 *     Default is `1e5`.
 * @return {string} The encoded string.
 * @api
 */
ol.format.Polyline.encodeDeltas = function(numbers, stride, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  var d;

  var lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  var i, ii;
  for (i = 0, ii = numbers.length; i < ii;) {
    for (d = 0; d < stride; ++d, ++i) {
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
 * @param {number} stride The number of dimension of the points in the
 *     encoded string.
 * @param {number=} opt_factor The factor by which the resulting numbers will
 *     be divided. Default is `1e5`.
 * @return {Array.<number>} A list of n-dimensional points.
 * @api
 */
ol.format.Polyline.decodeDeltas = function(encoded, stride, opt_factor) {
  var factor = goog.isDef(opt_factor) ? opt_factor : 1e5;
  var d;

  /** @type {Array.<number>} */
  var lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  var numbers = ol.format.Polyline.decodeFloats(encoded, factor);

  var i, ii;
  for (i = 0, ii = numbers.length; i < ii;) {
    for (d = 0; d < stride; ++d, ++i) {
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
 *     multiplied. The remaining decimal places will get rounded away.
 *     Default is `1e5`.
 * @return {string} The encoded string.
 * @api
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
 *     Default is `1e5`.
 * @return {Array.<number>} A list of floating point numbers.
 * @api
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
 * Read the feature from the Polyline source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api stable
 */
ol.format.Polyline.prototype.readFeature;


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readFeatureFromText = function(text, opt_options) {
  var geometry = this.readGeometryFromText(text, opt_options);
  return new ol.Feature(geometry);
};


/**
 * Read the feature from the source. As Polyline sources contain a single
 * feature, this will return the feature in an array.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.Polyline.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readFeaturesFromText =
    function(text, opt_options) {
  var feature = this.readFeatureFromText(text, opt_options);
  return [feature];
};


/**
 * Read the geometry from the source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 * @api stable
 */
ol.format.Polyline.prototype.readGeometry;


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readGeometryFromText =
    function(text, opt_options) {
  var flatCoordinates = ol.format.Polyline.decodeDeltas(text, 2, this.factor_);
  var coordinates = ol.geom.flat.inflate.coordinates(
      flatCoordinates, 0, flatCoordinates.length, 2);

  return /** @type {ol.geom.Geometry} */ (
      ol.format.Feature.transformWithOptions(
          new ol.geom.LineString(coordinates), false,
          this.adaptOptions(opt_options)));
};


/**
 * Read the projection from a Polyline source.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api stable
 */
ol.format.Polyline.prototype.readProjection;


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.readProjectionFromText = function(text) {
  return this.defaultDataProjection;
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.writeFeatureText = function(feature, opt_options) {
  var geometry = feature.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    return this.writeGeometryText(geometry, opt_options);
  } else {
    goog.asserts.fail();
    return '';
  }
};


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.writeFeaturesText =
    function(features, opt_options) {
  goog.asserts.assert(features.length == 1);
  return this.writeFeatureText(features[0], opt_options);
};


/**
 * Write a single geometry in Polyline format.
 *
 * @function
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Geometry.
 * @api stable
 */
ol.format.Polyline.prototype.writeGeometry;


/**
 * @inheritDoc
 */
ol.format.Polyline.prototype.writeGeometryText =
    function(geometry, opt_options) {
  goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
  geometry = /** @type {ol.geom.LineString} */
      (ol.format.Feature.transformWithOptions(
          geometry, true, this.adaptOptions(opt_options)));
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  return ol.format.Polyline.encodeDeltas(flatCoordinates, stride, this.factor_);
};
