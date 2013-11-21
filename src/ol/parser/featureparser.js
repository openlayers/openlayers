goog.provide('ol.parser.AsyncObjectFeatureParser');
goog.provide('ol.parser.AsyncStringFeatureParser');
goog.provide('ol.parser.DomFeatureParser');
goog.provide('ol.parser.ObjectFeatureParser');
goog.provide('ol.parser.ReadFeaturesResult');
goog.provide('ol.parser.StringFeatureParser');

goog.require('ol.Feature');



/**
 * @interface
 */
ol.parser.DomFeatureParser = function() {};


/**
 * @param {Element|Document} node Document or element node.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.DomFeatureParser.prototype.readFeaturesFromNode =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.ObjectFeatureParser = function() {};


/**
 * @param {Object} obj Object representing features.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.ObjectFeatureParser.prototype.readFeaturesFromObject =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.StringFeatureParser = function() {};


/**
 * @param {string} data String data.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.StringFeatureParser.prototype.readFeaturesFromString =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.AsyncStringFeatureParser = function() {};


/**
 * @param {string} data String data.
 * @param {function(ol.parser.ReadFeaturesResult)} callback Callback which is
 *     called after parsing.
 */
ol.parser.AsyncStringFeatureParser.prototype.readFeaturesFromStringAsync =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.AsyncObjectFeatureParser = function() {};


/**
 * @param {Object} obj Object representing features.
 * @param {function(ol.parser.ReadFeaturesResult)} callback Callback which is
 *     called after parsing.
 */
ol.parser.AsyncObjectFeatureParser.prototype.readFeaturesFromObjectAsync =
    goog.abstractMethod;


/**
 * @typedef {{projection: ol.proj.ProjectionLike}}
 */
ol.parser.ReadFeaturesMetadata;


/**
 * @typedef {{features: Array.<ol.Feature>,
 *     metadata: ol.parser.ReadFeaturesMetadata}}
 */
ol.parser.ReadFeaturesResult;
