goog.provide('ol.format.TextFeature');

goog.require('goog.asserts');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');



/**
 * @constructor
 * @extends {ol.format.Feature}
 */
ol.format.TextFeature = function() {
  goog.base(this);
};
goog.inherits(ol.format.TextFeature, ol.format.Feature);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.getText_ = function(source) {
  if (goog.isString(source)) {
    return source;
  } else {
    goog.asserts.fail();
    return '';
  }
};


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.getType = function() {
  return ol.format.FormatType.TEXT;
};


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.readFeature = function(source) {
  return this.readFeatureFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.TextFeature.prototype.readFeatureFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.readFeatures = function(source) {
  return this.readFeaturesFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.TextFeature.prototype.readFeaturesFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.readGeometry = function(source) {
  return this.readGeometryFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.TextFeature.prototype.readGeometryFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.readProjection = function(source) {
  return this.readProjectionFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.TextFeature.prototype.readProjectionFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.writeFeature = function(feature) {
  return this.writeFeatureText(feature);
};


/**
 * @param {ol.Feature} feature Features.
 * @protected
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.writeFeatureText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.writeFeatures = function(features) {
  return this.writeFeaturesText(features);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @protected
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.writeFeaturesText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.writeGeometry = function(geometry) {
  return this.writeGeometryText(geometry);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.writeGeometryText = goog.abstractMethod;
