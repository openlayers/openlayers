goog.provide('ol.parser.AsyncObjectFeatureParser');
goog.provide('ol.parser.AsyncStringFeatureParser');
goog.provide('ol.parser.DomFeatureParser');
goog.provide('ol.parser.ObjectFeatureParser');
goog.provide('ol.parser.ReadFeaturesOptions');
goog.provide('ol.parser.StringFeatureParser');

goog.require('ol.Feature');


/**
 * @typedef {{projection: ol.Projection}}
 */
ol.parser.ReadFeaturesMetadata;


/**
 * @typedef {{features: Array.<ol.Feature>,
 *     metadata: ol.parser.ReadFeaturesMetadata}}
 */
ol.parser.ReadFeaturesResult;



/**
 * @interface
 */
ol.parser.DomFeatureParser = function() {};


/**
 * @param {Element|Document} node Document or element node.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.DomFeatureParser.prototype.readFeaturesWithMetadataFromNode =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.ObjectFeatureParser = function() {};


/**
 * @param {Object} obj Object representing features.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.ObjectFeatureParser.prototype.readFeaturesWithMetadataFromObject =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.StringFeatureParser = function() {};


/**
 * @param {string} data String data.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.StringFeatureParser.prototype.readFeaturesWithMetadataFromString =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.AsyncStringFeatureParser = function() {};


/**
 * @param {string} data String data.
 * @param {function(Array.<ol.Feature>, ol.parser.ReadFeaturesMetadata)}
 *        callback Callback which is called
 * after parsing.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 */
ol.parser.AsyncStringFeatureParser.prototype.readFeaturesFromStringAsync =
    goog.abstractMethod;



/**
 * @interface
 */
ol.parser.AsyncObjectFeatureParser = function() {};


/**
 * @param {Object} obj Object representing features.
 * @param {function(Array.<ol.Feature>, ol.parser.ReadFeaturesMetadata)}
 *     callback Callback which is called
 * after parsing.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 */
ol.parser.AsyncObjectFeatureParser.prototype.readFeaturesFromObjectAsync =
    goog.abstractMethod;


/**
 * @typedef {function(ol.Feature, ol.geom.GeometryType):ol.geom.SharedVertices}
 */
ol.parser.ReadFeaturesCallback;


/**
 * @typedef {{callback: ol.parser.ReadFeaturesCallback}}
 */
ol.parser.ReadFeaturesOptions;
