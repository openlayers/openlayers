goog.provide('ol.render.canvas');

goog.require('ol.color');


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
ol.render.canvas.defaultFillStyle = ol.color.fromString('black');


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
ol.render.canvas.defaultLineDash = [];


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultMiterLimit = 10;


/**
 * @const
 * @type {ol.Color}
 */
ol.render.canvas.defaultStrokeStyle = ol.color.fromString('black');


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultTextAlign = 'start';


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultTextBaseline = 'alphabetic';


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultLineWidth = 1;
