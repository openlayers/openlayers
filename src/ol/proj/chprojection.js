goog.provide('ol.proj.CH');
goog.provide('ol.proj.EPSG2056');
goog.provide('ol.proj.EPSG21781');

goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.ellipsoid.BESSEL1841');
goog.require('ol.proj');
goog.require('ol.proj.EPSG4326');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');



/**
 * Internal base class for Swiss grid projections.
 * @constructor
 * @extends {ol.proj.Projection}
 * @param {{code: string, extent: ol.Extent}} options Options.
 * @todo api
 */
ol.proj.CH = function(options) {
  goog.base(this, {
    code: options.code,
    extent: options.extent,
    global: false,
    units: ol.proj.Units.METERS
  });
};
goog.inherits(ol.proj.CH, ol.proj.Projection);


/**
 * @const
 * @type {number}
 */
ol.proj.CH.PHI0 = goog.math.toRadians((3600 * 46 + 60 * 57 + 8.66) / 3600);


/**
 * @const
 * @type {number}
 */
ol.proj.CH.LAMBDA0 = goog.math.toRadians((3600 * 7 + 60 * 26 + 22.5) / 3600);


/**
 * @const
 * @type {ol.Ellipsoid}
 */
ol.proj.CH.ELLIPSOID = ol.ellipsoid.BESSEL1841;


/**
 * @const
 * @type {number}
 */
ol.proj.CH.COS_PHI0 = Math.cos(ol.proj.CH.PHI0);


/**
 * @const
 * @type {number}
 */
ol.proj.CH.SIN_PHI0 = Math.sin(ol.proj.CH.PHI0);


/**
 * @const
 * @type {number}
 */
ol.proj.CH.R = ol.proj.CH.ELLIPSOID.a * Math.sqrt(1 -
    ol.proj.CH.ELLIPSOID.eSquared) / (1 - ol.proj.CH.ELLIPSOID.eSquared *
    ol.proj.CH.SIN_PHI0 * ol.proj.CH.SIN_PHI0);


/**
 * @const
 * @type {number}
 */
ol.proj.CH.ALPHA = Math.sqrt(1 +
    ol.proj.CH.ELLIPSOID.eSquared * Math.pow(ol.proj.CH.COS_PHI0, 4) /
    (1 - ol.proj.CH.ELLIPSOID.eSquared));


/**
 * @const
 * @type {number}
 */
ol.proj.CH.SIN_B0 = ol.proj.CH.SIN_PHI0 / ol.proj.CH.ALPHA;


/**
 * @const
 * @type {number}
 */
ol.proj.CH.B0 = Math.asin(ol.proj.CH.SIN_B0);


/**
 * @const
 * @type {number}
 */
ol.proj.CH.COS_B0 = Math.cos(ol.proj.CH.B0);
// FIXME should we use Math.sqrt(1 - ol.proj.CH.SIN_B0 * ol.proj.CH.SIN_B0) ?


/**
 * @const
 * @type {number}
 */
ol.proj.CH.K = Math.log(Math.tan(Math.PI / 4 + ol.proj.CH.B0 / 2)) -
    ol.proj.CH.ALPHA * Math.log(Math.tan(Math.PI / 4 + ol.proj.CH.PHI0 / 2)) +
    ol.proj.CH.ALPHA * ol.proj.CH.ELLIPSOID.e * Math.log(
        (1 + ol.proj.CH.ELLIPSOID.e * ol.proj.CH.SIN_PHI0) /
        (1 - ol.proj.CH.ELLIPSOID.e * ol.proj.CH.SIN_PHI0)) / 2;


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
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.fromEPSG4326Approximate_ =
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
 * Transformation from EPSG:4326 to EPSG:2056/EPSG:21781.
 *
 * @see http://www.swisstopo.admin.ch/internet/swisstopo/en/home/topics/survey/sys/refsys/projections.html
 *
 * @param {number} offsetY Y offset.
 * @param {number} offsetX X offset.
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.fromEPSG4326Rigorous_ =
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
  var b, bBar, eSinPhi, i, l, lambda, lBar, phi, s;
  for (i = 0; i < n; i += dimension) {
    lambda = goog.math.toRadians(input[i]);
    phi = goog.math.toRadians(input[i + 1]);
    eSinPhi = ol.proj.CH.ELLIPSOID.e * Math.sin(phi);
    s = ol.proj.CH.ALPHA * Math.log(Math.tan(Math.PI / 4 + phi / 2)) -
        ol.proj.CH.ALPHA * ol.proj.CH.ELLIPSOID.e * Math.log(
            (1 + eSinPhi) / (1 - eSinPhi)) / 2 + ol.proj.CH.K;
    b = 2 * (Math.atan(Math.exp(s)) - Math.PI / 4);
    l = ol.proj.CH.ALPHA * (lambda - ol.proj.CH.LAMBDA0);
    lBar = Math.atan2(Math.sin(l),
        ol.proj.CH.SIN_B0 * Math.tan(b) + ol.proj.CH.COS_B0 * Math.cos(l));
    bBar = Math.asin(ol.proj.CH.COS_B0 * Math.sin(b) -
        ol.proj.CH.SIN_B0 * Math.cos(b) * Math.cos(l));
    output[i] = offsetY + ol.proj.CH.R * lBar;
    output[i + 1] = offsetX + ol.proj.CH.R *
        Math.log((1 + Math.sin(bBar)) / (1 - Math.sin(bBar))) / 2;
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
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.toEPSG4326Approximate_ =
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
 * Transformation from EPSG:2056/EPSG:21781 to EPSG:4326.
 *
 * @see http://www.swisstopo.admin.ch/internet/swisstopo/en/home/topics/survey/sys/refsys/projections.html
 *
 * @param {number} offsetY Y offset.
 * @param {number} offsetX X offset.
 * @param {Array.<number>} input Input array of coordinate values.
 * @param {Array.<number>=} opt_output Output array of coordinate values.
 * @param {number=} opt_dimension Dimension (default is `2`).
 * @private
 * @return {Array.<number>} Output array of coordinate values.
 */
ol.proj.CH.toEPSG4326Rigorous_ =
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
  var b, bBar, eSinPhi, i, iterations, l, lambda, lastPhi, lBar, phi, s, x, y;
  for (i = 0; i < n; i += dimension) {
    y = input[i] - offsetY;
    x = input[i + 1] - offsetX;
    lBar = y / ol.proj.CH.R;
    bBar = 2 * (Math.atan(Math.exp(x / ol.proj.CH.R)) - Math.PI / 4);
    b = Math.asin(ol.proj.CH.COS_B0 * Math.sin(bBar) +
        ol.proj.CH.SIN_B0 * Math.cos(bBar) * Math.cos(lBar));
    l = Math.atan2(Math.sin(lBar), ol.proj.CH.COS_B0 * Math.cos(lBar) -
        ol.proj.CH.SIN_B0 * Math.tan(bBar));
    lambda = ol.proj.CH.LAMBDA0 + l / ol.proj.CH.ALPHA;
    lastPhi = phi = b;
    // Empirically, about 18 iterations are required for 1e-7 radian accuracy
    for (iterations = 20; iterations > 0; --iterations) {
      s = (Math.log(Math.tan(Math.PI / 4 + b / 2)) -
          ol.proj.CH.K) / ol.proj.CH.ALPHA +
          ol.proj.CH.ELLIPSOID.e * Math.log(Math.tan(Math.PI / 4 +
              Math.asin(ol.proj.CH.ELLIPSOID.e * Math.sin(phi)) / 2));
      phi = 2 * Math.atan(Math.exp(s)) - Math.PI / 2;
      if (Math.abs(phi - lastPhi) < 1e-7) {
        break;
      }
      lastPhi = phi;
    }
    goog.asserts.assert(iterations !== 0);
    output[i] = goog.math.toDegrees(lambda);
    output[i + 1] = goog.math.toDegrees(phi);
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
 * @param {number=} opt_dimension Dimension (default is `2`).
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
 * @todo api
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
    [2485869.5728, 1076443.1884, 2837076.5648, 1299941.7864];


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
      goog.partial(ol.proj.CH.fromEPSG4326Rigorous_, 2600000, 1200000),
      goog.partial(ol.proj.CH.toEPSG4326Rigorous_, 2600000, 1200000));
};



/**
 * The EPSG:21781 projection, also known as LV03 (CH1903).
 * @constructor
 * @extends {ol.proj.CH}
 * @todo api
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
ol.proj.EPSG21781.EXTENT = [
  485869.5728, 76443.1884,
  837076.5648, 299941.7864
];


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
      goog.partial(ol.proj.CH.fromEPSG4326Rigorous_, 600000, 200000),
      goog.partial(ol.proj.CH.toEPSG4326Rigorous_, 600000, 200000));
};
