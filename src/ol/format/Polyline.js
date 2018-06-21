/**
 * @module ol/format/Polyline
 */
import {inherits} from '../util.js';
import {assert} from '../asserts.js';
import Feature from '../Feature.js';
import {transformWithOptions} from '../format/Feature.js';
import TextFeature from '../format/TextFeature.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import {getStrideForLayout} from '../geom/SimpleGeometry.js';
import {flipXY} from '../geom/flat/flip.js';
import {inflateCoordinates} from '../geom/flat/inflate.js';
import {get as getProjection} from '../proj.js';


/**
 * @typedef {Object} Options
 * @property {number} [factor=1e5] The factor by which the coordinates values will be scaled.
 * @property {module:ol/geom/GeometryLayout} [geometryLayout='XY'] Layout of the
 * feature geometries created by the format reader.
 */


/**
 * @classdesc
 * Feature format for reading and writing data in the Encoded
 * Polyline Algorithm Format.
 *
 * @constructor
 * @extends {module:ol/format/TextFeature}
 * @param {module:ol/format/Polyline~Options=} opt_options Optional configuration object.
 * @api
 */
const Polyline = function(opt_options) {

  const options = opt_options ? opt_options : {};

  TextFeature.call(this);

  /**
   * @inheritDoc
   */
  this.dataProjection = getProjection('EPSG:4326');

  /**
   * @private
   * @type {number}
   */
  this.factor_ = options.factor ? options.factor : 1e5;

  /**
   * @private
   * @type {module:ol/geom/GeometryLayout}
   */
  this.geometryLayout_ = options.geometryLayout ?
    options.geometryLayout : GeometryLayout.XY;
};

inherits(Polyline, TextFeature);


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
export function encodeDeltas(numbers, stride, opt_factor) {
  const factor = opt_factor ? opt_factor : 1e5;
  let d;

  const lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  for (let i = 0, ii = numbers.length; i < ii;) {
    for (d = 0; d < stride; ++d, ++i) {
      const num = numbers[i];
      const delta = num - lastNumbers[d];
      lastNumbers[d] = num;

      numbers[i] = delta;
    }
  }

  return encodeFloats(numbers, factor);
}


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
export function decodeDeltas(encoded, stride, opt_factor) {
  const factor = opt_factor ? opt_factor : 1e5;
  let d;

  /** @type {Array.<number>} */
  const lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  const numbers = decodeFloats(encoded, factor);

  for (let i = 0, ii = numbers.length; i < ii;) {
    for (d = 0; d < stride; ++d, ++i) {
      lastNumbers[d] += numbers[i];

      numbers[i] = lastNumbers[d];
    }
  }

  return numbers;
}


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
export function encodeFloats(numbers, opt_factor) {
  const factor = opt_factor ? opt_factor : 1e5;
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    numbers[i] = Math.round(numbers[i] * factor);
  }

  return encodeSignedIntegers(numbers);
}


/**
 * Decode a list of floating point numbers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number=} opt_factor The factor by which the result will be divided.
 *     Default is `1e5`.
 * @return {Array.<number>} A list of floating point numbers.
 * @api
 */
export function decodeFloats(encoded, opt_factor) {
  const factor = opt_factor ? opt_factor : 1e5;
  const numbers = decodeSignedIntegers(encoded);
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    numbers[i] /= factor;
  }
  return numbers;
}


/**
 * Encode a list of signed integers and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array.<number>} numbers A list of signed integers.
 * @return {string} The encoded string.
 */
export function encodeSignedIntegers(numbers) {
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    const num = numbers[i];
    numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
  }
  return encodeUnsignedIntegers(numbers);
}


/**
 * Decode a list of signed integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of signed integers.
 */
export function decodeSignedIntegers(encoded) {
  const numbers = decodeUnsignedIntegers(encoded);
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    const num = numbers[i];
    numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
  }
  return numbers;
}


/**
 * Encode a list of unsigned integers and return an encoded string
 *
 * @param {Array.<number>} numbers A list of unsigned integers.
 * @return {string} The encoded string.
 */
export function encodeUnsignedIntegers(numbers) {
  let encoded = '';
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    encoded += encodeUnsignedInteger(numbers[i]);
  }
  return encoded;
}


/**
 * Decode a list of unsigned integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array.<number>} A list of unsigned integers.
 */
export function decodeUnsignedIntegers(encoded) {
  const numbers = [];
  let current = 0;
  let shift = 0;
  for (let i = 0, ii = encoded.length; i < ii; ++i) {
    const b = encoded.charCodeAt(i) - 63;
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
}


/**
 * Encode one single unsigned integer and return an encoded string
 *
 * @param {number} num Unsigned integer that should be encoded.
 * @return {string} The encoded string.
 */
export function encodeUnsignedInteger(num) {
  let value, encoded = '';
  while (num >= 0x20) {
    value = (0x20 | (num & 0x1f)) + 63;
    encoded += String.fromCharCode(value);
    num >>= 5;
  }
  value = num + 63;
  encoded += String.fromCharCode(value);
  return encoded;
}


/**
 * Read the feature from the Polyline source. The coordinates are assumed to be
 * in two dimensions and in latitude, longitude order.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/Feature} Feature.
 * @api
 */
Polyline.prototype.readFeature;


/**
 * @inheritDoc
 */
Polyline.prototype.readFeatureFromText = function(text, opt_options) {
  const geometry = this.readGeometryFromText(text, opt_options);
  return new Feature(geometry);
};


/**
 * Read the feature from the source. As Polyline sources contain a single
 * feature, this will return the feature in an array.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
Polyline.prototype.readFeatures;


/**
 * @inheritDoc
 */
Polyline.prototype.readFeaturesFromText = function(text, opt_options) {
  const feature = this.readFeatureFromText(text, opt_options);
  return [feature];
};


/**
 * Read the geometry from the source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @return {module:ol/geom/Geometry} Geometry.
 * @api
 */
Polyline.prototype.readGeometry;


/**
 * @inheritDoc
 */
Polyline.prototype.readGeometryFromText = function(text, opt_options) {
  const stride = getStrideForLayout(this.geometryLayout_);
  const flatCoordinates = decodeDeltas(text, stride, this.factor_);
  flipXY(flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
  const coordinates = inflateCoordinates(flatCoordinates, 0, flatCoordinates.length, stride);

  return (
    /** @type {module:ol/geom/Geometry} */ (transformWithOptions(
      new LineString(coordinates, this.geometryLayout_),
      false,
      this.adaptOptions(opt_options)
    ))
  );
};


/**
 * Read the projection from a Polyline source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {module:ol/proj/Projection} Projection.
 * @api
 */
Polyline.prototype.readProjection;


/**
 * @inheritDoc
 */
Polyline.prototype.writeFeatureText = function(feature, opt_options) {
  const geometry = feature.getGeometry();
  if (geometry) {
    return this.writeGeometryText(geometry, opt_options);
  } else {
    assert(false, 40); // Expected `feature` to have a geometry
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
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {string} Geometry.
 * @api
 */
Polyline.prototype.writeGeometry;


/**
 * @inheritDoc
 */
Polyline.prototype.writeGeometryText = function(geometry, opt_options) {
  geometry = /** @type {module:ol/geom/LineString} */
    (transformWithOptions(geometry, true, this.adaptOptions(opt_options)));
  const flatCoordinates = geometry.getFlatCoordinates();
  const stride = geometry.getStride();
  flipXY(flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
  return encodeDeltas(flatCoordinates, stride, this.factor_);
};
export default Polyline;
