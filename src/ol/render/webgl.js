var _ol_render_webgl_ = {};


/**
 * @const
 * @type {string}
 */
_ol_render_webgl_.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
_ol_render_webgl_.defaultFillStyle = [0.0, 0.0, 0.0, 1.0];


/**
 * @const
 * @type {string}
 */
_ol_render_webgl_.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
_ol_render_webgl_.defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
_ol_render_webgl_.defaultLineDashOffset = 0;


/**
 * @const
 * @type {string}
 */
_ol_render_webgl_.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
_ol_render_webgl_.defaultMiterLimit = 10;

/**
 * @const
 * @type {ol.Color}
 */
_ol_render_webgl_.defaultStrokeStyle = [0.0, 0.0, 0.0, 1.0];


/**
 * @const
 * @type {number}
 */
_ol_render_webgl_.defaultTextAlign = 0.5;


/**
 * @const
 * @type {number}
 */
_ol_render_webgl_.defaultTextBaseline = 0.5;


/**
 * @const
 * @type {number}
 */
_ol_render_webgl_.defaultLineWidth = 1;

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
_ol_render_webgl_.triangleIsCounterClockwise = function(x1, y1, x2, y2, x3, y3) {
  var area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
  return (area <= _ol_render_webgl_.EPSILON && area >= -_ol_render_webgl_.EPSILON) ?
    undefined : area > 0;
};

/**
 * @const
 * @type {number}
 */
_ol_render_webgl_.EPSILON = Number.EPSILON || 2.220446049250313e-16;
export default _ol_render_webgl_;
