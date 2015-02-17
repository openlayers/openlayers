goog.provide('ol.format.TextFeature');

goog.require('goog.asserts');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for text feature formats.
 *
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
ol.format.TextFeature.prototype.readFeature = function(source, opt_options) {
  return this.readFeatureFromText(
      this.getText_(source), this.adaptOptions(opt_options));
};


/**
 * @param {string} text Text.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.TextFeature.prototype.readFeatureFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.readFeatures = function(source, opt_options) {
  return this.readFeaturesFromText(
      this.getText_(source), this.adaptOptions(opt_options));
};


/**
 * @param {string} text Text.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @protected
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.TextFeature.prototype.readFeaturesFromText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.readGeometry = function(source, opt_options) {
  return this.readGeometryFromText(
      this.getText_(source), this.adaptOptions(opt_options));
};


/**
 * @param {string} text Text.
 * @param {olx.format.ReadOptions=} opt_options Read options.
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
ol.format.TextFeature.prototype.readProjectionFromText = function(text) {
  return this.defaultDataProjection;
};


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.writeFeature = function(feature, opt_options) {
  return this.writeFeatureText(feature, this.adaptOptions(opt_options));
};


/**
 * @param {ol.Feature} feature Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.writeFeatureText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.writeFeatures = function(
    features, opt_options) {
  return this.writeFeaturesText(features, this.adaptOptions(opt_options));
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.writeFeaturesText = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.TextFeature.prototype.writeGeometry = function(
    geometry, opt_options) {
  return this.writeGeometryText(geometry, this.adaptOptions(opt_options));
};


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @protected
 * @return {string} Text.
 */
ol.format.TextFeature.prototype.writeGeometryText = goog.abstractMethod;
