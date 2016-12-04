goog.provide('ol.proj.EPSG3857');

goog.require('ol');
goog.require('ol.math');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');


/**
 * @classdesc
 * Projection object for web/spherical Mercator (EPSG:3857).
 *
 * @constructor
 * @extends {ol.proj.Projection}
 * @param {string} code Code.
 * @private
 */
ol.proj.EPSG3857_ = function(code) {
  ol.proj.Projection.call(this, {
    code: code,
    units: ol.proj.Units.METERS,
    extent: ol.proj.EPSG3857.EXTENT,
    global: true,
    worldExtent: ol.proj.EPSG3857.WORLD_EXTENT,
    getPointResolution: function(resolution, point) {
      return resolution / ol.math.cosh(point[1] / ol.proj.EPSG3857.RADIUS);
    }
  });
};
ol.inherits(ol.proj.EPSG3857_, ol.proj.Projection);


/**
 * @const
 * @type {number}
 */
ol.proj.EPSG3857.RADIUS = 6378137;


/**
 * @const
 * @type {number}
 */
ol.proj.EPSG3857.HALF_SIZE = Math.PI * ol.proj.EPSG3857.RADIUS;


/**
 * @const
 * @type {ol.Extent}
 */
ol.proj.EPSG3857.EXTENT = [
  -ol.proj.EPSG3857.HALF_SIZE, -ol.proj.EPSG3857.HALF_SIZE,
  ol.proj.EPSG3857.HALF_SIZE, ol.proj.EPSG3857.HALF_SIZE
];


/**
 * @const
 * @type {ol.Extent}
 */
ol.proj.EPSG3857.WORLD_EXTENT = [-180, -85, 180, 85];


/**
 * Lists several projection codes with the same meaning as EPSG:3857.
 *
 * @type {Array.<string>}
 */
ol.proj.EPSG3857.CODES = [
  'EPSG:3857',
  'EPSG:102100',
  'EPSG:102113',
  'EPSG:900913',
  'urn:ogc:def:crs:EPSG:6.18:3:3857',
  'urn:ogc:def:crs:EPSG::3857',
  'http://www.opengis.net/gml/srs/epsg.xml#3857'
];


/**
 * Projections equal to EPSG:3857.
 *
 * @const
 * @type {Array.<ol.proj.Projection>}
 */
ol.proj.EPSG3857.PROJECTIONS = ol.proj.EPSG3857.CODES.map(function(code) {
  return new ol.proj.EPSG3857_(code);
});


/**
 * Transformation from EPSG:4326 to EPSG:3857.
 *
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.EPSG3857.fromEPSG4326 = function(input, opt_output, opt_dimension) {
  var length = input.length,
      dimension = opt_dimension > 1 ? opt_dimension : 2,
      output = opt_output;
  if (output === undefined) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  ol.DEBUG && console.assert(output.length % dimension === 0,
      'modulus of output.length with dimension should be 0');
  var halfSize = ol.proj.EPSG3857.HALF_SIZE;
  for (var i = 0; i < length; i += dimension) {
    output[i] = halfSize * input[i] / 180;
    var y = ol.proj.EPSG3857.RADIUS *
        Math.log(Math.tan(Math.PI * (input[i + 1] + 90) / 360));
    if (y > halfSize) {
      y = halfSize;
    } else if (y < -halfSize) {
      y = -halfSize;
    }
    output[i + 1] = y;
  }
  return output;
};


/**
 * Transformation from EPSG:3857 to EPSG:4326.
 *
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.EPSG3857.toEPSG4326 = function(input, opt_output, opt_dimension) {
  var length = input.length,
      dimension = opt_dimension > 1 ? opt_dimension : 2,
      output = opt_output;
  if (output === undefined) {
    if (dimension > 2) {
      // preserve values beyond second dimension
      output = input.slice();
    } else {
      output = new Array(length);
    }
  }
  ol.DEBUG && console.assert(output.length % dimension === 0,
      'modulus of output.length with dimension should be 0');
  for (var i = 0; i < length; i += dimension) {
    output[i] = 180 * input[i] / ol.proj.EPSG3857.HALF_SIZE;
    output[i + 1] = 360 * Math.atan(
        Math.exp(input[i + 1] / ol.proj.EPSG3857.RADIUS)) / Math.PI - 90;
  }
  return output;
};
