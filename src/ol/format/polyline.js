import _ol_ from '../index';
import _ol_asserts_ from '../asserts';
import _ol_Feature_ from '../feature';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_TextFeature_ from '../format/textfeature';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_SimpleGeometry_ from '../geom/simplegeometry';
import _ol_geom_flat_flip_ from '../geom/flat/flip';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate';
import _ol_proj_ from '../proj';

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
var _ol_format_Polyline_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_TextFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get('EPSG:4326');

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
    options.geometryLayout : _ol_geom_GeometryLayout_.XY;
};

_ol_.inherits(_ol_format_Polyline_, _ol_format_TextFeature_);


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
_ol_format_Polyline_.encodeDeltas = function(numbers, stride, opt_factor) {
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

  return _ol_format_Polyline_.encodeFloats(numbers, factor);
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
_ol_format_Polyline_.decodeDeltas = function(encoded, stride, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
  var d;

  /** @type {Array.<number>} */
  var lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  var numbers = _ol_format_Polyline_.decodeFloats(encoded, factor);

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
_ol_format_Polyline_.encodeFloats = function(numbers, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    numbers[i] = Math.round(numbers[i] * factor);
  }

  return _ol_format_Polyline_.encodeSignedIntegers(numbers);
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
_ol_format_Polyline_.decodeFloats = function(encoded, opt_factor) {
  var factor = opt_factor ? opt_factor : 1e5;
  var numbers = _ol_format_Polyline_.decodeSignedIntegers(encoded);
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
_ol_format_Polyline_.encodeSignedIntegers = function(numbers) {
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    var num = numbers[i];
    numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
  }
  return _ol_format_Polyline_.encodeUnsignedIntegers(numbers);
};


/**
 * Decode a list of signed integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of signed integers.
 */
_ol_format_Polyline_.decodeSignedIntegers = function(encoded) {
  var numbers = _ol_format_Polyline_.decodeUnsignedIntegers(encoded);
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
_ol_format_Polyline_.encodeUnsignedIntegers = function(numbers) {
  var encoded = '';
  var i, ii;
  for (i = 0, ii = numbers.length; i < ii; ++i) {
    encoded += _ol_format_Polyline_.encodeUnsignedInteger(numbers[i]);
  }
  return encoded;
};


/**
 * Decode a list of unsigned integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of unsigned integers.
 */
_ol_format_Polyline_.decodeUnsignedIntegers = function(encoded) {
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
_ol_format_Polyline_.encodeUnsignedInteger = function(num) {
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
_ol_format_Polyline_.prototype.readFeature;


/**
 * @inheritDoc
 */
_ol_format_Polyline_.prototype.readFeatureFromText = function(text, opt_options) {
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
_ol_format_Polyline_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_Polyline_.prototype.readFeaturesFromText = function(text, opt_options) {
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
_ol_format_Polyline_.prototype.readGeometry;


/**
 * @inheritDoc
 */
_ol_format_Polyline_.prototype.readGeometryFromText = function(text, opt_options) {
  var stride = _ol_geom_SimpleGeometry_.getStrideForLayout(this.geometryLayout_);
  var flatCoordinates = _ol_format_Polyline_.decodeDeltas(
      text, stride, this.factor_);
  _ol_geom_flat_flip_.flipXY(
      flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
  var coordinates = _ol_geom_flat_inflate_.coordinates(
      flatCoordinates, 0, flatCoordinates.length, stride);

  return (
    /** @type {ol.geom.Geometry} */ _ol_format_Feature_.transformWithOptions(
        new _ol_geom_LineString_(coordinates, this.geometryLayout_), false,
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
_ol_format_Polyline_.prototype.readProjection;


/**
 * @inheritDoc
 */
_ol_format_Polyline_.prototype.writeFeatureText = function(feature, opt_options) {
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
_ol_format_Polyline_.prototype.writeFeaturesText = function(features, opt_options) {
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
_ol_format_Polyline_.prototype.writeGeometry;


/**
 * @inheritDoc
 */
_ol_format_Polyline_.prototype.writeGeometryText = function(geometry, opt_options) {
  geometry = /** @type {ol.geom.LineString} */
    (_ol_format_Feature_.transformWithOptions(
        geometry, true, this.adaptOptions(opt_options)));
  var flatCoordinates = geometry.getFlatCoordinates();
  var stride = geometry.getStride();
  _ol_geom_flat_flip_.flipXY(
      flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
  return _ol_format_Polyline_.encodeDeltas(flatCoordinates, stride, this.factor_);
};
export default _ol_format_Polyline_;
