/**
 * @fileoverview jsPDF PDF generator.
 * @see https://github.com/MrRio/jsPDF
 */

/**
 * @constructor
 * @param {string=} orientation One of `portrait` or `landscape`
 *     (or shortcuts `p` (default), `l`).
 * @param {string=} unit Measurement unit to be used when coordinates are specified.
 *     One of `pt`, `mm` (default), `cm`, `in`.
 * @param {string=} format Default: `a4`.
 * @param {boolean=} compressPdf
 */
var jsPDF = function(orientation, unit, format, compressPdf) {};

/**
 * @param {string} imageData
 * @param {string} format
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string=} alias
 * @param {number=} compression
 * @return {jsPDF}
 */
jsPDF.prototype.addImage = function(imageData, format, x, y, w, h, alias, compression) {};

/**
 * @return {jsPDF}
 */
jsPDF.prototype.autoPrint = function() {};

/**
 * @param {string} type
 * @param {Object=} options
 * @return {jsPDF}
 */
jsPDF.prototype.output = function(type, options) {};

/**
 * @param {string} filename
 * @return {jsPDF}
 */
jsPDF.prototype.save = function(filename) {};
