goog.provide('ol.format.Binary');

goog.require('goog.asserts');
goog.require('ol.BrowserFeature');
goog.require('ol.binary.Buffer');
goog.require('ol.format.Format');
goog.require('ol.format.FormatType');
goog.require('ol.proj');



/**
 * @constructor
 * @extends {ol.format.Format}
 */
ol.format.Binary = function() {
  goog.base(this);
};
goog.inherits(ol.format.Binary, ol.format.Format);


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @private
 * @return {ol.binary.Buffer} Buffer.
 */
ol.format.Binary.getBuffer_ = function(source) {
  if (ol.BrowserFeature.HAS_ARRAY_BUFFER && source instanceof ArrayBuffer) {
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
ol.format.Binary.prototype.getType = function() {
  return ol.format.FormatType.BINARY;
};


/**
 * @inheritDoc
 */
ol.format.Binary.prototype.readFeature = function(source) {
  return this.readFeatureFromBuffer(ol.format.Binary.getBuffer_(source));
};


/**
 * @inheritDoc
 */
ol.format.Binary.prototype.readFeatures = function(source) {
  return this.readFeaturesFromBuffer(ol.format.Binary.getBuffer_(source));
};


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @protected
 * @return {ol.Feature} Feature.
 */
ol.format.Binary.prototype.readFeatureFromBuffer = goog.abstractMethod;


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @protected
 * @return {Array.<ol.Feature>} Feature.
 */
ol.format.Binary.prototype.readFeaturesFromBuffer = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Binary.prototype.readGeometry = function(source) {
  return this.readGeometryFromBuffer(ol.format.Binary.getBuffer_(source));
};


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @protected
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Binary.prototype.readGeometryFromBuffer = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.format.Binary.prototype.readProjection = function(source) {
  return this.readProjectionFromBuffer(ol.format.Binary.getBuffer_(source));
};


/**
 * @param {ol.binary.Buffer} buffer Buffer.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Binary.prototype.readProjectionFromBuffer = goog.abstractMethod;
