goog.provide('ol.format.BinaryFeature');

goog.require('goog.asserts');
goog.require('ol.binary.Buffer');
goog.require('ol.format.Feature');
goog.require('ol.format.FormatType');
goog.require('ol.has');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.format.Feature}
 */
ol.format.BinaryFeature = function() {
  goog.base(this);
};
goog.inherits(ol.format.BinaryFeature, ol.format.Feature);


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @private
 * @return {ol.binary.Buffer} Buffer.
 */
ol.format.BinaryFeature.getBuffer_ = function(source) {
  if (ol.has.ARRAY_BUFFER && source instanceof ArrayBuffer) {
    return new ol.binary.Buffer(source);
  } else if (goog.isString(source)) {
    return new ol.binary.Buffer(source);
  } else {
    goog.asserts.fail();
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.format.BinaryFeature.prototype.getType = function() {
  return ol.format.FormatType.BINARY;
};


/**
 * @inheritDoc
 */
ol.format.BinaryFeature.prototype.readFeature = function(source) {
  return this.readFeatureFromBuffer(ol.format.BinaryFeature.getBuffer_(source));
};


/**
 * @inheritDoc
 */
ol.format.BinaryFeature.prototype.readFeatures = function(source) {
  return this.readFeaturesFromBuffer(
      ol.format.BinaryFeature.getBuffer_(source));
};


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.BinaryFeature.prototype.readFeatureFromBuffer = goog.abstractMethod;


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @protected
 * @return {Array.<ol.Feature>} Feature.
 */
ol.format.BinaryFeature.prototype.readFeaturesFromBuffer = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.BinaryFeature.prototype.readGeometry = function(source) {
  return this.readGeometryFromBuffer(
      ol.format.BinaryFeature.getBuffer_(source));
};


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.BinaryFeature.prototype.readGeometryFromBuffer = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.BinaryFeature.prototype.readProjection = function(source) {
  return this.readProjectionFromBuffer(
      ol.format.BinaryFeature.getBuffer_(source));
};


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.BinaryFeature.prototype.readProjectionFromBuffer =
    goog.abstractMethod;
