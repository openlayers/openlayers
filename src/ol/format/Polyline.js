/**
 * @module ol/format/Polyline
 */
import {inherits} from '../index.js';
import _ol_asserts_ from '../asserts.js';
import _ol_Feature_ from '../Feature.js';
import FeatureFormat from '../format/Feature.js';
import _ol_format_TextFeature_ from '../format/TextFeature.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import _ol_geom_flat_flip_ from '../geom/flat/flip.js';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate.js';
import {get as getProjection} from '../proj.js';

/**
 * @classdesc
 * Feature format for reading and writing data in the Encoded
 * Polyline Algorithm Format.
 *
 * @constructor
 * @extends {ol.format.TextFeature}
 * @param {olx.format.PolylineOptions=} opt_options
 *     Optional configuration object.
 * @api
 */
var Polyline = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_TextFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = getProjection('EPSG:4326');

  /**
   * @private
   * @type {number}
   */
  this.factor_ = options.factor ? options.factor : 1e5;

  /**
   * @private
   * @type {ol.geom.GeometryLayout}
   */
  this.geometryLayout_ = options.geometryLayout ?
    options.geometryLayout : GeometryLayout.XY;
};

inherits(Polyline, _ol_format_TextFeature_);


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
Polyline.encodeDeltas = function(numbers, stride, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
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

  return Polyline.encodeFloats(numbers, factor);
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
Polyline.decodeDeltas = function(encoded, stride, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
  var d;

  /** @type {Array.<number>} */
  var lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  var numbers = Polyline.decodeFloats(encoded, factor);

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
Polyline.encodeFloats = function(numbers, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    numbers[i] = Math.round(numbers[i] * factor);
  }

  return Polyline.encodeSignedIntegers(numbers);
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
Polyline.decodeFloats = function(encoded, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
  var numbers = Polyline.decodeSignedIntegers(encoded);
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
Polyline.encodeSignedIntegers = function(numbers) {
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    var num = numbers[i];
    numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
  }
  return Polyline.encodeUnsignedIntegers(numbers);
};


/**
 * Decode a list of signed integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of signed integers.
 */
Polyline.decodeSignedIntegers = function(encoded) {
  var numbers = Polyline.decodeUnsignedIntegers(encoded);
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
Polyline.encodeUnsignedIntegers = function(numbers) {
  var encoded = '';
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    encoded += Polyline.encodeUnsignedInteger(numbers[i]);
  }
  return encoded;
};


/**
 * Decode a list of unsigned integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of unsigned integers.
 */
Polyline.decodeUnsignedIntegers = function(encoded) {
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
Polyline.encodeUnsignedInteger = function(num) {
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
 * Read the feature from the Polyline source. The coordinates are assumed to be
 * in two dimensions and in latitude, longitude order.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
Polyline.prototype.readFeature;


/**
 * @inheritDoc
 */
Polyline.prototype.readFeatureFromText = function(text, opt_options) {
  var geometry = this.readGeometryFromText(text, opt_options);
  return new _ol_Feature_(geometry);
};


/**
 * Read the feature from the source. As Polyline sources contain a single
 * feature, this will return the feature in an array.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
Polyline.prototype.readFeatures;


/**
 * @inheritDoc
 */
Polyline.prototype.readFeaturesFromText = function(text, opt_options) {
  var feature = this.readFeatureFromText(text, opt_options);
  return [feature];
};


/**
 * Read the geometry from the source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 * @api
 */
Polyline.prototype.readGeometry;


/**
 * @inheritDoc
 */
Polyline.prototype.readGeometryFromText = function(text, opt_options) {
  var stride = SimpleGeometry.getStrideForLayout(this.geometryLayout_);
  var flatCoordinates = Polyline.decodeDeltas(
      text, stride, this.factor_);
  _ol_geom_flat_flip_.flipXY(
      flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
  var coordinates = _ol_geom_flat_inflate_.coordinates(
      flatCoordinates, 0, flatCoordinates.length, stride);

  return (
    /** @type {ol.geom.Geometry} */ FeatureFormat.transformWithOptions(
        new LineString(coordinates, this.geometryLayout_), false,
        this.adaptOptions(opt_options))
  );
};


/**
 * Read the projection from a Polyline source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
Polyline.prototype.readProjection;


/**
 * @inheritDoc
 */
Polyline.prototype.writeFeatureText = function(feature, opt_options) {
  var geometry = feature.getGeometry();
  if (geometry) {
    return this.writeGeometryText(geometry, opt_options);
  } else {
    _ol_asserts_.assert(false, 40); // Expected `feature` to have a geometry
    return '';
  }
};


/**
 * @inheritDoc
 */
Polyline.prototype.writeFeaturesText = function(features, opt_options) {
  return this.writeFeatureText(features[0], opt_options);
};


/**
 * Write a single geometry in Polyline format.
 *
 * @function
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Geometry.
 * @api
 */
Polyline.prototype.writeGeometry;


/**
 * @inheritDoc
 */
Polyline.prototype.writeGeometryText = function(geometry, opt_options) {
  geometry = /** @type {ol.geom.LineString} */
    (FeatureFormat.transformWithOptions(
        geometry, true, this.adaptOptions(opt_options)));
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  _ol_geom_flat_flip_.flipXY(
      flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
  return Polyline.encodeDeltas(flatCoordinates, stride, this.factor_);
};
export default Polyline;
