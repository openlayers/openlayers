goog.provide('ol.format.GML');

goog.require('ol.format.GML3');


/**
 * @classdesc
 * Feature format for reading and writing data in the GML format
 * version 3.1.1.
 * Currently only supports GML 3.1.1 Simple Features profile.
 *
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.GMLBase}
 * @api
 */
ol.format.GML = ol.format.GML3;


/**
 * Encode an array of features in GML 3.1.1 Simple Features.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {string} Result.
 * @api
 */
ol.format.GML.prototype.writeFeatures;


/**
 * Encode an array of features in the GML 3.1.1 format as an XML node.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @api
 */
ol.format.GML.prototype.writeFeaturesNode;
