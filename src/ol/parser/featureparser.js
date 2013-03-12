goog.provide('ol.parser.DomFeatureParser');
goog.provide('ol.parser.ObjectFeatureParser');
goog.provide('ol.parser.ReadFeaturesOptions');
goog.provide('ol.parser.StringFeatureParser');

goog.require('ol.Feature');



/**
 * @interface
 */
ol.parser.DomFeatureParser = function() {};


/**
 * @param {Element|Document} node Document or element node.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.DomFeatureParser.prototype.readFeaturesFromNode =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.ObjectFeatureParser = function() {};


/**
 * @param {Object} obj Object representing features.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.ObjectFeatureParser.prototype.readFeaturesFromObject =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.StringFeatureParser = function() {};


/**
 * @param {string} data String data.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.parser.StringFeatureParser.prototype.readFeaturesFromString =
    goog.abstractMethod;


/**
 * @typedef {function(ol.Feature, ol.geom.GeometryType):ol.geom.SharedVertices}
 */
ol.parser.ReadFeaturesCallback;


/**
 * @typedef {{callback: ol.parser.ReadFeaturesCallback}}
 */
ol.parser.ReadFeaturesOptions;
