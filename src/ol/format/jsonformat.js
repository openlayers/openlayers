goog.provide('ol.format.JSON');

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('ol.format.Format');
goog.require('ol.format.FormatType');



/**
 * @constructor
 * @extends {ol.format.Format}
 */
ol.format.JSON = function() {
  goog.base(this);
};
goog.inherits(ol.format.JSON, ol.format.Format);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {Object} Object.
 */
ol.format.JSON.prototype.getObject_ = function(source) {
  if (goog.isObject(source)) {
    return source;
  } else if (goog.isString(source)) {
    var object = goog.json.parse(source);
    return goog.isDef(object) ? object : null;
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.getType = function() {
  return ol.format.FormatType.JSON;
};


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.readFeature = function(source) {
  return this.readFeatureFromObject(this.getObject_(source));
};


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.readFeatures = function(source) {
  return this.readFeaturesFromObject(this.getObject_(source));
};


/**
 * @param {Object} object Object.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.JSON.prototype.readFeatureFromObject = goog.abstractMethod;


/**
 * @param {Object} object Object.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.JSON.prototype.readFeaturesFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.readGeometry = function(source) {
  return this.readGeometryFromObject(this.getObject_(source));
};


/**
 * @param {Object} object Object.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.JSON.prototype.readGeometryFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.readProjection = function(source) {
  return this.readProjectionFromObject(this.getObject_(source));
};


/**
 * @param {Object} object Object.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.JSON.prototype.readProjectionFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.writeFeature = function(feature) {
  return this.writeFeatureObject(feature);
};


/**
 * @param {ol.Feature} feature Feature.
 * @protected
 * @return {Object} Object.
 */
ol.format.JSON.prototype.writeFeatureObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.writeFeatures = function(features) {
  return this.writeFeaturesObject(features);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @protected
 * @return {Object} Object.
 */
ol.format.JSON.prototype.writeFeaturesObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSON.prototype.writeGeometry = function(geometry) {
  return this.writeGeometryObject(geometry);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {Object} Object.
 */
ol.format.JSON.prototype.writeGeometryObject = goog.abstractMethod;
