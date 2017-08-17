goog.provide('ol.render.webgl');


/**
 * @const
 * @type {string}
 */
ol.render.webgl.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
ol.render.webgl.defaultFillStyle = [0.0, 0.0, 0.0, 1.0];


/**
 * @const
 * @type {string}
 */
ol.render.webgl.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
ol.render.webgl.defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
ol.render.webgl.defaultLineDashOffset = 0;


/**
 * @const
 * @type {string}
 */
ol.render.webgl.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
ol.render.webgl.defaultMiterLimit = 10;

/**
 * @const
 * @type {ol.Color}
 */
ol.render.webgl.defaultStrokeStyle = [0.0, 0.0, 0.0, 1.0];


/**
 * @const
 * @type {number}
 */
ol.render.webgl.defaultTextAlign = 0.5;


/**
 * @const
 * @type {number}
 */
ol.render.webgl.defaultTextBaseline = 0.5;


/**
 * @const
 * @type {number}
 */
ol.render.webgl.defaultLineWidth = 1;

/**
 * Calculates the orientation of a triangle based on the determinant method.
 * @param {number} x1 First X coordinate.
 * @param {number} y1 First Y coordinate.
 * @param {number} x2 Second X coordinate.
 * @param {number} y2 Second Y coordinate.
 * @param {number} x3 Third X coordinate.
 * @param {number} y3 Third Y coordinate.
 * @return {boolean|undefined} Triangle is clockwise.
 */
ol.render.webgl.triangleIsCounterClockwise = function(x1, y1, x2, y2, x3, y3) {
  var area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
  return (area <= ol.render.webgl.EPSILON && area >= -ol.render.webgl.EPSILON) ?
    undefined : area > 0;
};

/**
 * @const
 * @type {number}
 */
ol.render.webgl.EPSILON = Number.EPSILON || 2.220446049250313e-16;
