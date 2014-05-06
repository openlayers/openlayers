goog.provide('ol.format.JSONFeature');

goog.require('goog.asserts');
goog.require('goog.json');
goog.require('ol.BrowserFeature');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');



/**
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
    var object;
    if (ol.BrowserFeature.HAS_JSON_PARSE) {
      object = /** @type {Object} */ (JSON.parse(source));
    } else {
      object = goog.json.parse(source);
    }
    return goog.isDef(object) ? object : null;
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
ol.format.JSONFeature.prototype.readFeature = function(source) {
  return this.readFeatureFromObject(this.getObject_(source));
};


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readFeatures = function(source) {
  return this.readFeaturesFromObject(this.getObject_(source));
};


/**
 * @param {Object} object Object.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.JSONFeature.prototype.readFeatureFromObject = goog.abstractMethod;


/**
 * @param {Object} object Object.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.JSONFeature.prototype.readFeaturesFromObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.readGeometry = function(source) {
  return this.readGeometryFromObject(this.getObject_(source));
};


/**
 * @param {Object} object Object.
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
ol.format.JSONFeature.prototype.writeFeature = function(feature) {
  return this.writeFeatureObject(feature);
};


/**
 * @param {ol.Feature} feature Feature.
 * @protected
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeFeatureObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeFeatures = function(features) {
  return this.writeFeaturesObject(features);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @protected
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeFeaturesObject = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.JSONFeature.prototype.writeGeometry = function(geometry) {
  return this.writeGeometryObject(geometry);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {Object} Object.
 */
ol.format.JSONFeature.prototype.writeGeometryObject = goog.abstractMethod;
