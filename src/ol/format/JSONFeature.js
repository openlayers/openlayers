/**
 * @module ol/format/JSONFeature
 */
import FeatureFormat from './Feature.js';
import {abstract} from '../util.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for JSON feature formats.
 *
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("../Feature.js").default]
 * @extends {FeatureFormat<FeatureType>}
 * @abstract
 */
class JSONFeature extends FeatureFormat {
  constructor() {
    super();
  }

  /**
   * @return {import("./Feature.js").Type} Format.
   * @override
   */
  getType() {
    return 'json';
  }

  /**
   * Read a feature.  Only works for a single feature. Use `readFeatures` to
   * read a feature collection.
   *
   * @param {ArrayBuffer|Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {FeatureType|Array<FeatureType>} Feature.
   * @api
   * @override
   */
  readFeature(source, options) {
    return this.readFeatureFromObject(
      getObject(source),
      this.getReadOptions(source, options),
    );
  }

  /**
   * Read all features.  Works with both a single feature and a feature
   * collection.
   *
   * @param {ArrayBuffer|Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {Array<FeatureType>} Features.
   * @api
   * @override
   */
  readFeatures(source, options) {
    return this.readFeaturesFromObject(
      getObject(source),
      this.getReadOptions(source, options),
    );
  }

  /**
   * @abstract
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {FeatureType|Array<FeatureType>} Feature.
   */
  readFeatureFromObject(object, options) {
    return abstract();
  }

  /**
   * @abstract
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<FeatureType>} Features.
   */
  readFeaturesFromObject(object, options) {
    return abstract();
  }

  /**
   * Read a geometry.
   *
   * @param {ArrayBuffer|Document|Element|Object|string} source Source.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../geom/Geometry.js").default} Geometry.
   * @api
   * @override
   */
  readGeometry(source, options) {
    return this.readGeometryFromObject(
      getObject(source),
      this.getReadOptions(source, options),
    );
  }

  /**
   * @abstract
   * @param {Object} object Object.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromObject(object, options) {
    return abstract();
  }

  /**
   * Read the projection.
   *
   * @param {ArrayBuffer|Document|Element|Object|string} source Source.
   * @return {import("../proj/Projection.js").default} Projection.
   * @api
   * @override
   */
  readProjection(source) {
    return this.readProjectionFromObject(getObject(source));
  }

  /**
   * @abstract
   * @param {Object} object Object.
   * @protected
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromObject(object) {
    return abstract();
  }

  /**
   * Encode a feature as string.
   *
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string} Encoded feature.
   * @api
   * @override
   */
  writeFeature(feature, options) {
    return JSON.stringify(this.writeFeatureObject(feature, options));
  }

  /**
   * @abstract
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {Object} Object.
   */
  writeFeatureObject(feature, options) {
    return abstract();
  }

  /**
   * Encode an array of features as string.
   *
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string} Encoded features.
   * @api
   * @override
   */
  writeFeatures(features, options) {
    return JSON.stringify(this.writeFeaturesObject(features, options));
  }

  /**
   * @abstract
   * @param {Array<import("../Feature.js").default>} features Features.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {Object} Object.
   */
  writeFeaturesObject(features, options) {
    return abstract();
  }

  /**
   * Encode a geometry as string.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {string} Encoded geometry.
   * @api
   * @override
   */
  writeGeometry(geometry, options) {
    return JSON.stringify(this.writeGeometryObject(geometry, options));
  }

  /**
   * @abstract
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {Object} Object.
   */
  writeGeometryObject(geometry, options) {
    return abstract();
  }
}

/**
 * @param {Document|Element|Object|string} source Source.
 * @return {Object} Object.
 */
function getObject(source) {
  if (typeof source === 'string') {
    const object = JSON.parse(source);
    return object ? /** @type {Object} */ (object) : null;
  }
  if (source !== null) {
    return source;
  }
  return null;
}

export default JSONFeature;
