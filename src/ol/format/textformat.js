goog.provide('ol.format.Text');

goog.require('goog.asserts');
goog.require('ol.format.Format');
goog.require('ol.format.FormatType');



/**
 * @constructor
 * @extends {ol.format.Format}
 */
ol.format.Text = function() {
  goog.base(this);
};
goog.inherits(ol.format.Text, ol.format.Format);


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 * @return {string} Text.
 */
ol.format.Text.prototype.getText_ = function(source) {
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
ol.format.Text.prototype.getType = function() {
  return ol.format.FormatType.TEXT;
};


/**
 * @inheritDoc
 */
ol.format.Text.prototype.readFeature = function(source) {
  return this.readFeatureFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.Text.prototype.readFeatureFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Text.prototype.readFeatures = function(source) {
  return this.readFeaturesFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.Text.prototype.readFeaturesFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Text.prototype.readGeometry = function(source) {
  return this.readGeometryFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Text.prototype.readGeometryFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Text.prototype.readProjection = function(source) {
  return this.readProjectionFromText(this.getText_(source));
};


/**
 * @param {string} text Text.
 * @protected
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Text.prototype.readProjectionFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Text.prototype.writeFeature = function(feature) {
  return this.writeFeatureText(feature);
};


/**
 * @param {ol.Feature} feature Features.
 * @protected
 * @return {string} Text.
 */
ol.format.Text.prototype.writeFeatureText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Text.prototype.writeFeatures = function(features) {
  return this.writeFeaturesText(features);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @protected
 * @return {string} Text.
 */
ol.format.Text.prototype.writeFeaturesText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Text.prototype.writeGeometry = function(geometry) {
  return this.writeGeometryText(geometry);
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @protected
 * @return {string} Text.
 */
ol.format.Text.prototype.writeGeometryText = goog.abstractMethod;
