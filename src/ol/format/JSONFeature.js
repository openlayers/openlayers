goog.provide('ol.format.JSONFeature');

goog.require('ol');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for JSON feature formats.
 *
 * @constructor
 * @abstract
 * @extends {ol.format.Feature}
 */
ol.format.JSONFeature = function() {
  ol.format.Feature.call(this);
};
ol.inherits(ol.format.JSONFeature, ol.format.Feature);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.getObject_ = function(source) {
  if (typeof source === 'string') {
    var object = JSON.parse(source);
    return object ? /** @type {Object} */ (object) : null;
  } else if (source !== null) {
    return source;
  } else {
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.getType = function() {
  return ol.format.FormatType.JSON;
};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readFeature = function(source, opt_options) {
  return this.readFeatureFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readFeatures = function(source, opt_options) {
  return this.readFeaturesFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.JSONFeature.prototype.readFeatureFromObject = function(object, opt_options) {};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.JSONFeature.prototype.readFeaturesFromObject = function(object, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.JSONFeature.prototype.readGeometryFromObject = function(object, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readProjection = function(source) {
  return this.readProjectionFromObject(this.getObject_(source));
};


/**
 * @abstract
 * @param {Object} object Object.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.JSONFeature.prototype.readProjectionFromObject = function(object) {};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeFeature = function(feature, opt_options) {
  return JSON.stringify(this.writeFeatureObject(feature, opt_options));
};


/**
 * @abstract
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeFeatureObject = function(feature, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeFeatures = function(features, opt_options) {
  return JSON.stringify(this.writeFeaturesObject(features, opt_options));
};


/**
 * @abstract
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeFeaturesObject = function(features, opt_options) {};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeGeometry = function(geometry, opt_options) {
  return JSON.stringify(this.writeGeometryObject(geometry, opt_options));
};


/**
 * @abstract
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeGeometryObject = function(geometry, opt_options) {};
