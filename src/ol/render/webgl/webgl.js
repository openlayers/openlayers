goog.provide('ol.render.webgl');

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
ol.render.webgl.defaultLineWidth = 1;

/**
 * @enum {number}
 */
ol.render.webgl.lineStringInstruction = {
  ROUND: 2,
  BEGIN_LINE: 3,
  END_LINE: 5,
  BEGIN_LINE_CAP: 7,
  END_LINE_CAP : 11,
  BEVEL_FIRST: 13,
  BEVEL_SECOND: 17,
  MITER_BOTTOM: 19,
  MITER_TOP: 23
};
