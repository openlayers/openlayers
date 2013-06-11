goog.provide('ol.proj.EPSG21781');

goog.require('goog.asserts');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
goog.require('ol.proj');
goog.require('ol.proj.EPSG4326');



/**
 * @constructor
 * @extends {ol.Projection}
 */
ol.proj.EPSG21781 = function() {
  goog.base(this, {
    code: 'EPSG:21781',
    units: ol.ProjectionUnits.METERS,
    extent: ol.proj.EPSG21781.EXTENT,
    global: false
  });
};
goog.inherits(ol.proj.EPSG21781, ol.Projection);


/**
 * @const
 * @type {ol.Extent}
 */
ol.proj.EPSG21781.EXTENT = [485869.5728, 837076.5648, 76443.1884, 299941.7864];


/**
 * FIXME empty description for jsdoc
 */
ol.proj.EPSG21781.add = function() {
  ol.proj.addEquivalentProjections(ol.proj.EPSG4326.PROJECTIONS);
  var epsg21781 = new ol.proj.EPSG21781();
  ol.proj.addProjection(epsg21781);
  ol.proj.addEquivalentTransforms(
      ol.proj.EPSG4326.PROJECTIONS,
      [epsg21781],
      ol.proj.EPSG21781.fromEPSG4326,
      ol.proj.EPSG21781.toEPSG4326);
};


/**
 * Transformation from EPSG:4326 to EPSG:21781.
 *
 * @see http://www.swisstopo.admin.ch/internet/swisstopo/en/home/products/software/products/skripts.html
 *
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.EPSG21781.fromEPSG4326 = function(input, opt_output, opt_dimension) {
  var n = input.length;
  var dimension = goog.isDef(opt_dimension) ? opt_dimension : 2;
  var output;
  if (goog.isDef(opt_output)) {
    output = opt_output;
  } else {
    if (dimension > 2) {
      output = input.slice();
    } else {
      output = new Array(n);
    }
  }
  goog.asserts.assert(dimension >= 2);
  goog.asserts.assert(output.length % dimension === 0);
  var auxLat, auxLon, i;
  for (i = 0; i < n; i += dimension) {
    auxLat = 36 * input[i + 1] / 100 - 16.902866;
    auxLon = 36 * input[i] / 100 - 2.67825;
    output[i] = 600072.37 +
        211455.93 * auxLon -
        10938.51 * auxLon * auxLat -
        0.36 * auxLon * auxLat * auxLat -
        44.54 * auxLon * auxLon * auxLon;
    output[i + 1] = 200147.07 +
        308807.95 * auxLat +
        3745.25 * auxLon * auxLon +
        76.63 * auxLat * auxLat -
        194.56 * auxLon * auxLon * auxLat +
        119.79 * auxLat * auxLat * auxLat;
  }
  return output;
};


/**
 * Transformation from EPSG:21781 to EPSG:4326.
 *
 * @see http://www.swisstopo.admin.ch/internet/swisstopo/en/home/products/software/products/skripts.html
 *
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.EPSG21781.toEPSG4326 = function(input, opt_output, opt_dimension) {
  var n = input.length;
  var dimension = goog.isDef(opt_dimension) ? opt_dimension : 2;
  var output;
  if (goog.isDef(opt_output)) {
    output = opt_output;
  } else {
    if (dimension > 2) {
      output = input.slice();
    } else {
      output = new Array(n);
    }
  }
  goog.asserts.assert(dimension >= 2);
  goog.asserts.assert(output.length % dimension === 0);
  var auxX, auxY, i;
  for (i = 0; i < n; i += dimension) {
    auxY = (input[i] - 600000) / 1000000;
    auxX = (input[i + 1] - 200000) / 1000000;
    output[i] = 100 * (2.6779094 +
        4.728982 * auxY +
        0.791484 * auxY * auxX +
        0.1306 * auxY * auxX * auxX -
        0.0436 * auxY * auxY * auxY) / 36;
    output[i + 1] = 100 * (16.9023892 +
        3.238272 * auxX -
        0.270978 * auxY * auxY -
        0.002528 * auxX * auxX -
        0.0447 * auxY * auxY * auxX -
        0.014 * auxX * auxX * auxX) / 36;
  }
  return output;
};


/**
 * @inheritDoc
 */
ol.proj.EPSG21781.prototype.getPointResolution = function(resolution, point) {
  return resolution;
};
