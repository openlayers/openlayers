/**
 * @externs
 * @see https://github.com/constantinius/geotiff.js
 */


/**
 * @constructor
 */
var GeoTIFF = function() {};


/**
 * @param {ArrayBuffer} tiff
 * @return {GeoTIFFFile}
 */
GeoTIFF.prototype.parse = function(tiff) {};


/**
 * @type {GeoTIFF}
 */
var geotiff;


/**
 * @constructor
 */
var GeoTIFFFile = function() {};


/**
 * @return {number}
 */
GeoTIFFFile.prototype.getImageCount = function() {};


/**
 * @param {number} index
 * @return {GeoTIFFCoverage}
 */
GeoTIFFFile.prototype.getImage = function(index) {};


/**
 * @constructor
 */
var GeoTIFFCoverage = function() {};


/**
 * @return {number}
 */
GeoTIFFCoverage.prototype.getHeight = function() {};


/**
 * @return {number}
 */
GeoTIFFCoverage.prototype.getWidth = function() {};


/**
 * @return {Array.<ol.TypedArray>}
 */
GeoTIFFCoverage.prototype.readRasters = function() {};


/**
 * @return {Object|undefined}
 */
GeoTIFFCoverage.prototype.getFileDirectory = function() {};


/**
 * @return {Array.<number>}
 */
GeoTIFFCoverage.prototype.getResolution = function() {};


/**
 * @return {ol.Coordinate}
 */
GeoTIFFCoverage.prototype.getOrigin = function() {};
