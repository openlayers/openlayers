/**
 * @module ol/format/JSONFeature
 */
import {inherits} from '../util.js';
import FeatureFormat from '../format/Feature.js';
import FormatType from '../format/FormatType.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for JSON feature formats.
 *
 * @constructor
 * @abstract
 * @extends {module:ol/format/Feature}
 */
const JSONFeature = function() {
  FeatureFormat.call(this);
};

inherits(JSONFeature, FeatureFormat);


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {Object} Object.
 */
function getObject(source) {
  if (typeof source === 'string') {
    const object = JSON.parse(source);
    return object ? /** @type {Object} */ (object) : null;
  } else if (source !== null) {
    return source;
  } else {
    return null;
  }
}


/**
 * @inheritDoc
 */
JSONFeature.prototype.getType = function() {
  return FormatType.JSON;
};


/**
 * @inheritDoc
 */
JSONFeature.prototype.readFeature = function(source, opt_options) {
  return this.readFeatureFromObject(
    getObject(source), this.getReadOptions(source, opt_options));
};


/**
 * @inheritDoc
 */
JSONFeature.prototype.readFeatures = function(source, opt_options) {
  return this.readFeaturesFromObject(
    getObject(source), this.getReadOptions(source, opt_options));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @protected
 * @return {module:ol/Feature} Feature.
 */
JSONFeature.prototype.readFeatureFromObject = function(object, opt_options) {};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<module:ol/Feature>} Features.
 */
JSONFeature.prototype.readFeaturesFromObject = function(object, opt_options) {};


/**
 * @inheritDoc
 */
JSONFeature.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromObject(
    getObject(source), this.getReadOptions(source, opt_options));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Read options.
 * @protected
 * @return {module:ol/geom/Geometry} Geometry.
 */
JSONFeature.prototype.readGeometryFromObject = function(object, opt_options) {};


/**
 * @inheritDoc
 */
JSONFeature.prototype.readProjection = function(source) {
  return this.readProjectionFromObject(getObject(source));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @protected
 * @return {module:ol/proj/Projection} Projection.
 */
JSONFeature.prototype.readProjectionFromObject = function(object) {};


/**
 * @inheritDoc
 */
JSONFeature.prototype.writeFeature = function(feature, opt_options) {
  return JSON.stringify(this.writeFeatureObject(feature, opt_options));
};


/**
 * @abstract
 * @param {module:ol/Feature} feature Feature.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
JSONFeature.prototype.writeFeatureObject = function(feature, opt_options) {};


/**
 * @inheritDoc
 */
JSONFeature.prototype.writeFeatures = function(features, opt_options) {
  return JSON.stringify(this.writeFeaturesObject(features, opt_options));
};


/**
 * @abstract
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
JSONFeature.prototype.writeFeaturesObject = function(features, opt_options) {};


/**
 * @inheritDoc
 */
JSONFeature.prototype.writeGeometry = function(geometry, opt_options) {
  return JSON.stringify(this.writeGeometryObject(geometry, opt_options));
};


/**
 * @abstract
 * @param {module:ol/geom/Geometry} geometry Geometry.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
JSONFeature.prototype.writeGeometryObject = function(geometry, opt_options) {};
export default JSONFeature;
