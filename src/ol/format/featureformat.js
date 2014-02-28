goog.provide('ol.format.Feature');

goog.require('goog.functions');



/**
 * @constructor
 */
ol.format.Feature = function() {
};


/**
 * @return {Array.<string>} Extensions.
 */
ol.format.Feature.prototype.getExtensions = goog.abstractMethod;


/**
 * @return {ol.format.FormatType} Format.
 */
ol.format.Feature.prototype.getType = goog.abstractMethod;


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.Feature} Feature.
 */
ol.format.Feature.prototype.readFeature = goog.abstractMethod;


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.Feature.prototype.readFeatures = goog.abstractMethod;


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Feature.prototype.readGeometry = goog.abstractMethod;


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Feature.prototype.readProjection = goog.abstractMethod;


/**
 * @param {ol.Feature} feature Feature.
 * @return {ArrayBuffer|Node|Object|string} Result.
 */
ol.format.Feature.prototype.writeFeature = goog.abstractMethod;


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {ArrayBuffer|Node|Object|string} Result.
 */
ol.format.Feature.prototype.writeFeatures = goog.abstractMethod;


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {ArrayBuffer|Node|Object|string} Node.
 */
ol.format.Feature.prototype.writeGeometry = goog.abstractMethod;
