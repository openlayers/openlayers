goog.provide('ol.format.Format');
goog.provide('ol.format.FormatType');

goog.require('goog.functions');


/**
 * @enum {string}
 */
ol.format.FormatType = {
  BINARY: 'binary',
  JSON: 'json',
  TEXT: 'text',
  XML: 'xml'
};



/**
 * @constructor
 */
ol.format.Format = function() {
};


/**
 * @return {Array.<string>} Extensions.
 */
ol.format.Format.prototype.getExtensions = goog.abstractMethod;


/**
 * @return {ol.format.FormatType} Format.
 */
ol.format.Format.prototype.getType = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.Feature} Feature.
 */
ol.format.Format.prototype.readFeature = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.Format.prototype.readFeatures = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @param {function(this: S, ol.Feature, (Document|Node|Object|undefined)): T}
 *     callback Callback.
 * @param {S=} opt_obj Scope.
 * @template S,T
 */
ol.format.Format.prototype.readFeaturesAsync = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Format.prototype.readGeometry = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Format.prototype.readProjection = goog.abstractMethod;


/**
 * @param {ol.Feature} feature Feature.
 * @return {Node|Object|string} Result.
 */
ol.format.Format.prototype.writeFeature = goog.abstractMethod;


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {Node|Object|string} Result.
 */
ol.format.Format.prototype.writeFeatures = goog.abstractMethod;


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {Node|Object|string} Node.
 */
ol.format.Format.prototype.writeGeometry = goog.abstractMethod;
