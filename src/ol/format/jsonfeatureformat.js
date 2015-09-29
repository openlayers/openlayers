goog.provide('ol.format.JSONFeature');

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for JSON feature formats.
 *
 * @constructor
 * @extends {ol.format.Feature}
 */
ol.format.JSONFeature = function() {
  goog.base(this);
};
goog.inherits(ol.format.JSONFeature, ol.format.Feature);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.getObject_ = function(source) {
  if (goog.isObject(source)) {
    return source;
  } else if (goog.isString(source)) {
    var object = goog.json.parse(source);
    return object ? object : null;
  } else {
    goog.asserts.fail();
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
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.JSONFeature.prototype.readFeatureFromObject = goog.abstractMethod;


/**
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.JSONFeature.prototype.readFeaturesFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromObject(
      this.getObject_(source), this.getReadOptions(source, opt_options));
};


/**
 * @param {Object} object Object.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.JSONFeature.prototype.readGeometryFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readProjection = function(source) {
  return this.readProjectionFromObject(this.getObject_(source));
};


/**
 * @param {Object} object Object.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.JSONFeature.prototype.readProjectionFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeFeature = function(feature, opt_options) {
  return goog.json.serialize(this.writeFeatureObject(feature, opt_options));
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeFeatureObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeFeatures = function(
    features, opt_options) {
  return goog.json.serialize(this.writeFeaturesObject(features, opt_options));
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeFeaturesObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeGeometry = function(
    geometry, opt_options) {
  return goog.json.serialize(this.writeGeometryObject(geometry, opt_options));
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeGeometryObject = goog.abstractMethod;
