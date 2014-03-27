goog.provide('ol.format.Feature');

goog.require('goog.functions');



/**
 * ol.format.Feature subclasses provide the ability to decode and encode
 * {@link ol.Feature} objects from a variety of commonly used geospatial
 * file formats.  See the documentation for each format for more details.
 *
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
 * Read a single feature from a source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.Feature} Feature.
 */
ol.format.Feature.prototype.readFeature = goog.abstractMethod;


/**
 * Read all features from a source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.Feature.prototype.readFeatures = goog.abstractMethod;


/**
 * Read a single geometry from a source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Feature.prototype.readGeometry = goog.abstractMethod;


/**
 * Read the projection from a source.
 *
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Feature.prototype.readProjection = goog.abstractMethod;


/**
 * Encode a feature in this format.
 *
 * @param {ol.Feature} feature Feature.
 * @return {ArrayBuffer|Node|Object|string} Result.
 */
ol.format.Feature.prototype.writeFeature = goog.abstractMethod;


/**
 * Encode an array of features in this format.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @return {ArrayBuffer|Node|Object|string} Result.
 */
ol.format.Feature.prototype.writeFeatures = goog.abstractMethod;


/**
 * Write a single geometry in this format.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {ArrayBuffer|Node|Object|string} Node.
 */
ol.format.Feature.prototype.writeGeometry = goog.abstractMethod;
