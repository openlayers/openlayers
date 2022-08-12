/**
 * @module ol/format/Polyline
 */
import Feature from '../Feature.js';
import LineString from '../geom/LineString.js';
import TextFeature from './TextFeature.js';
import {assert} from '../asserts.js';
import {flipXY} from '../geom/flat/flip.js';
import {get as getProjection} from '../proj.js';
import {getStrideForLayout} from '../geom/SimpleGeometry.js';
import {inflateCoordinates} from '../geom/flat/inflate.js';
import {transformGeometryWithOptions} from './Feature.js';

/**
 * @typedef {Object} Options
 * @property {number} [factor=1e5] The factor by which the coordinates values will be scaled.
 * @property {import("../geom/Geometry.js").GeometryLayout} [geometryLayout='XY'] Layout of the
 * feature geometries created by the format reader.
 */

/**
 * @classdesc
 * Feature format for reading and writing data in the Encoded
 * Polyline Algorithm Format.
 *
 * When reading features, the coordinates are assumed to be in two dimensions
 * and in [latitude, longitude] order.
 *
 * As Polyline sources contain a single feature,
 * {@link module:ol/format/Polyline~Polyline#readFeatures} will return the
 * feature in an array.
 *
 * @api
 */
class Polyline extends TextFeature {
  /**
   * @param {Options} [options] Optional configuration object.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection('EPSG:4326');

    /**
     * @private
     * @type {number}
     */
    this.factor_ = options.factor ? options.factor : 1e5;

    /**
     * @private
     * @type {import("../geom/Geometry.js").GeometryLayout}
     */
    this.geometryLayout_ = options.geometryLayout
      ? options.geometryLayout
      : 'XY';
  }

  /**
   * @protected
   * @param {string} text Text.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../Feature.js").default} Feature.
   */
  readFeatureFromText(text, options) {
    const geometry = this.readGeometryFromText(text, options);
    return new Feature(geometry);
  }

  /**
   * @param {string} text Text.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<Feature>} Features.
   */
  readFeaturesFromText(text, options) {
    const feature = this.readFeatureFromText(text, options);
    return [feature];
  }

  /**
   * @param {string} text Text.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromText(text, options) {
    const stride = getStrideForLayout(this.geometryLayout_);
    const flatCoordinates = decodeDeltas(text, stride, this.factor_);
    flipXY(flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
    const coordinates = inflateCoordinates(
      flatCoordinates,
      0,
      flatCoordinates.length,
      stride
    );
    const lineString = new LineString(coordinates, this.geometryLayout_);

    return transformGeometryWithOptions(
      lineString,
      false,
      this.adaptOptions(options)
    );
  }

  /**
   * @param {import("../Feature.js").default<LineString>} feature Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeatureText(feature, options) {
    const geometry = feature.getGeometry();
    if (geometry) {
      return this.writeGeometryText(geometry, options);
    } else {
      assert(false, 40); // Expected `feature` to have a geometry
      return '';
    }
  }

  /**
   * @param {Array<import("../Feature.js").default<LineString>>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @protected
   * @return {string} Text.
   */
  writeFeaturesText(features, options) {
    return this.writeFeatureText(features[0], options);
  }

  /**
   * @param {LineString} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @protected
   * @return {string} Text.
   */
  writeGeometryText(geometry, options) {
    geometry =
      /** @type {LineString} */
      (
        transformGeometryWithOptions(geometry, true, this.adaptOptions(options))
      );
    const flatCoordinates = geometry.getFlatCoordinates();
    const stride = geometry.getStride();
    flipXY(flatCoordinates, 0, flatCoordinates.length, stride, flatCoordinates);
    return encodeDeltas(flatCoordinates, stride, this.factor_);
  }
}

/**
 * Encode a list of n-dimensional points and return an encoded string
 *
 * Attention: This function will modify the passed array!
 *
 * @param {Array<number>} numbers A list of n-dimensional points.
 * @param {number} stride The number of dimension of the points in the list.
 * @param {number} [factor] The factor by which the numbers will be
 *     multiplied. The remaining decimal places will get rounded away.
 *     Default is `1e5`.
 * @return {string} The encoded string.
 * @api
 */
export function encodeDeltas(numbers, stride, factor) {
  factor = factor ? factor : 1e5;
  let d;

  const lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  for (let i = 0, ii = numbers.length; i < ii; ) {
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
 * @param {number} [factor] The factor by which the resulting numbers will
 *     be divided. Default is `1e5`.
 * @return {Array<number>} A list of n-dimensional points.
 * @api
 */
export function decodeDeltas(encoded, stride, factor) {
  factor = factor ? factor : 1e5;
  let d;

  /** @type {Array<number>} */
  const lastNumbers = new Array(stride);
  for (d = 0; d < stride; ++d) {
    lastNumbers[d] = 0;
  }

  const numbers = decodeFloats(encoded, factor);

  for (let i = 0, ii = numbers.length; i < ii; ) {
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
 * @param {Array<number>} numbers A list of floating point numbers.
 * @param {number} [factor] The factor by which the numbers will be
 *     multiplied. The remaining decimal places will get rounded away.
 *     Default is `1e5`.
 * @return {string} The encoded string.
 * @api
 */
export function encodeFloats(numbers, factor) {
  factor = factor ? factor : 1e5;
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    numbers[i] = Math.round(numbers[i] * factor);
  }

  return encodeSignedIntegers(numbers);
}

/**
 * Decode a list of floating point numbers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @param {number} [factor] The factor by which the result will be divided.
 *     Default is `1e5`.
 * @return {Array<number>} A list of floating point numbers.
 * @api
 */
export function decodeFloats(encoded, factor) {
  factor = factor ? factor : 1e5;
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
 * @param {Array<number>} numbers A list of signed integers.
 * @return {string} The encoded string.
 */
export function encodeSignedIntegers(numbers) {
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    const num = numbers[i];
    numbers[i] = num < 0 ? ~(num << 1) : num << 1;
  }
  return encodeUnsignedIntegers(numbers);
}

/**
 * Decode a list of signed integers from an encoded string
 *
 * @param {string} encoded An encoded string.
 * @return {Array<number>} A list of signed integers.
 */
export function decodeSignedIntegers(encoded) {
  const numbers = decodeUnsignedIntegers(encoded);
  for (let i = 0, ii = numbers.length; i < ii; ++i) {
    const num = numbers[i];
    numbers[i] = num & 1 ? ~(num >> 1) : num >> 1;
  }
  return numbers;
}

/**
 * Encode a list of unsigned integers and return an encoded string
 *
 * @param {Array<number>} numbers A list of unsigned integers.
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
 * @return {Array<number>} A list of unsigned integers.
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
  let value,
    encoded = '';
  while (num >= 0x20) {
    value = (0x20 | (num & 0x1f)) + 63;
    encoded += String.fromCharCode(value);
    num >>= 5;
  }
  value = num + 63;
  encoded += String.fromCharCode(value);
  return encoded;
}

export default Polyline;
