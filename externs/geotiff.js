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
 * @return {GeoTIFFCoverage}
 */
GeoTIFF.prototype.parse = function(tiff) {};


/**
 * @type {GeoTIFF}
 */
var geotiff;


/**
 * @constructor
 */
var GeoTIFFCoverage = function() {};


/**
 * @return {number}
 */
GeoTIFFCoverage.prototype.getImageCount = function() {};


/**
 * @param {number} index
 * @return {GeoTIFFBand}
 */
GeoTIFFCoverage.prototype.getImage = function(index) {};


/**
 * @constructor
 */
var GeoTIFFBand = function() {};


/**
 * @return {number}
 */
GeoTIFFBand.prototype.getHeight = function() {};


/**
 * @return {number}
 */
GeoTIFFBand.prototype.getWidth = function() {};


/**
 * @return {Array.<ol.TypedArray>}
 */
GeoTIFFBand.prototype.readRasters = function() {};


/**
 * @return {Object|undefined}
 */
GeoTIFFBand.prototype.getFileDirectory = function() {};


/**
 * @return {Array.<number>}
 */
GeoTIFFBand.prototype.getResolution = function() {};


/**
 * @return {ol.Extent}
 */
GeoTIFFBand.prototype.getBoundingBox = function() {};
