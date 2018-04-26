/**
 * @module ol/format/GML
 */
import GML3 from '../format/GML3.js';

/**
 * @classdesc
 * Feature format for reading and writing data in the GML format
 * version 3.1.1.
 * Currently only supports GML 3.1.1 Simple Features profile.
 *
 * @constructor
 * @param {module:ol/format/GMLBase~Options=} opt_options
 *     Optional configuration object.
 * @extends {module:ol/format/GMLBase}
 * @api
 */
const GML = GML3;


/**
 * Encode an array of features in GML 3.1.1 Simple Features.
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {string} Result.
 * @api
 */
GML.prototype.writeFeatures;


/**
 * Encode an array of features in the GML 3.1.1 format as an XML node.
 *
 * @function
 * @param {Array.<module:ol/Feature>} features Features.
 * @param {module:ol/format/Feature~WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @api
 */
GML.prototype.writeFeaturesNode;

export default GML;
