goog.provide('ol.proj.CH');
goog.provide('ol.proj.EPSG2056');
goog.provide('ol.proj.EPSG21781');

goog.require('goog.asserts');
goog.require('ol.Projection');
goog.require('ol.ProjectionUnits');
goog.require('ol.proj');
goog.require('ol.proj.EPSG4326');



/**
 * Internal base class for Swiss grid projections.
 * @constructor
 * @extends {ol.Projection}
 * @param {{code: string, extent: ol.Extent}} options Options.
 */
ol.proj.CH = function(options) {
  goog.base(this, {
    code: options.code,
    extent: options.extent,
    global: false,
    units: ol.ProjectionUnits.METERS
  });
};
goog.inherits(ol.proj.CH, ol.Projection);


/**
 * Add EPSG:2056 and EPSG:21781 projections, and transformations between them.
 */
ol.proj.CH.add = function() {
  ol.proj.EPSG2056.add();
  ol.proj.EPSG21781.add();
  var epsg2056 = ol.proj.get('EPSG:2056');
  var epsg21781 = ol.proj.get('EPSG:21781');
  ol.proj.addTransform(epsg2056, epsg21781,
      goog.partial(ol.proj.CH.translate_, -2000000, -1000000));
  ol.proj.addTransform(epsg21781, epsg2056,
      goog.partial(ol.proj.CH.translate_, 2000000, 1000000));
};


/**
 * Transformation from EPSG:4326 to EPSG:2056/EPSG:21781.
 *
 * This uses an approximation that is accurate to about 1m.
 *
 * @see http://www.swisstopo.admin.ch/internet/swisstopo/en/home/products/software/products/skripts.html
 *
 * @param {number} offsetY Y offset.
 * @param {number} offsetX X offset.
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.fromEPSG4326_ =
    function(offsetY, offsetX, input, opt_output, opt_dimension) {
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
    output[i] = offsetY + 72.37 +
        211455.93 * auxLon -
        10938.51 * auxLon * auxLat -
        0.36 * auxLon * auxLat * auxLat -
        44.54 * auxLon * auxLon * auxLon;
    output[i + 1] = offsetX + 147.07 +
        308807.95 * auxLat +
        3745.25 * auxLon * auxLon +
        76.63 * auxLat * auxLat -
        194.56 * auxLon * auxLon * auxLat +
        119.79 * auxLat * auxLat * auxLat;
  }
  return output;
};


/**
 * Transformation from EPSG:2056/EPSG:21781 to EPSG:4326.
 *
 * This uses an approximation that is accurate to about 1m.
 *
 * @see http://www.swisstopo.admin.ch/internet/swisstopo/en/home/products/software/products/skripts.html
 *
 * @param {number} offsetY Y offset.
 * @param {number} offsetX X offset.
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.toEPSG4326_ =
    function(offsetY, offsetX, input, opt_output, opt_dimension) {
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
    auxY = (input[i] - offsetY) / 1000000;
    auxX = (input[i + 1] - offsetX) / 1000000;
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
 * Transformation between EPSG:2056 and EPSG:21781.
 *
 * Currently a simple offset is used. This is accurate to within 3m.
 *
 * @param {number} offsetY Y offset.
 * @param {number} offsetX X offset.
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is 2).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.translate_ =
    function(offsetY, offsetX, input, opt_output, opt_dimension) {
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
  var i;
  for (i = 0; i < n; i += dimension) {
    output[i] = input[i] + offsetY;
    output[i + 1] = input[i + 1] + offsetX;
  }
  return output;
};


/**
 * @inheritDoc
 */
ol.proj.CH.prototype.getPointResolution = function(resolution, point) {
  return resolution;
};



/**
 * The EPSG:2056 projection, also known as LV95 (CH1903+).
 * @constructor
 * @extends {ol.proj.CH}
 */
ol.proj.EPSG2056 = function() {
  goog.base(this, {
    code: 'EPSG:2056',
    extent: ol.proj.EPSG2056.EXTENT
  });
};
goog.inherits(ol.proj.EPSG2056, ol.proj.CH);


/**
 * @const
 * @type {ol.Extent}
 */
ol.proj.EPSG2056.EXTENT =
    [2485869.5728, 2837076.5648, 1076443.1884, 1299941.7864];


/**
 * Add the EPSG:2056 projection and transformations to and from EPSG:4326.
 */
ol.proj.EPSG2056.add = function() {
  ol.proj.addEquivalentProjections(ol.proj.EPSG4326.PROJECTIONS);
  var epsg2056 = new ol.proj.EPSG2056();
  ol.proj.addProjection(epsg2056);
  ol.proj.addEquivalentTransforms(
      ol.proj.EPSG4326.PROJECTIONS,
      [epsg2056],
      goog.partial(ol.proj.CH.fromEPSG4326_, 2600000, 1200000),
      goog.partial(ol.proj.CH.toEPSG4326_, 2600000, 1200000));
};



/**
 * The EPSG:21781 projection, also known as LV03 (CH1903).
 * @constructor
 * @extends {ol.proj.CH}
 */
ol.proj.EPSG21781 = function() {
  goog.base(this, {
    code: 'EPSG:21781',
    extent: ol.proj.EPSG21781.EXTENT
  });
};
goog.inherits(ol.proj.EPSG21781, ol.proj.CH);


/**
 * @const
 * @type {ol.Extent}
 */
ol.proj.EPSG21781.EXTENT = [485869.5728, 837076.5648, 76443.1884, 299941.7864];


/**
 * Add the EPSG:21781 projection and transformations to and from EPSG:4326.
 */
ol.proj.EPSG21781.add = function() {
  ol.proj.addEquivalentProjections(ol.proj.EPSG4326.PROJECTIONS);
  var epsg21781 = new ol.proj.EPSG21781();
  ol.proj.addProjection(epsg21781);
  ol.proj.addEquivalentTransforms(
      ol.proj.EPSG4326.PROJECTIONS,
      [epsg21781],
      goog.partial(ol.proj.CH.fromEPSG4326_, 600000, 200000),
      goog.partial(ol.proj.CH.toEPSG4326_, 600000, 200000));
};
