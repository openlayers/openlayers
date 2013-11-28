goog.provide('ol.render.canvas');

goog.require('ol.color');


/**
 * @const {ol.Color}
 */
ol.render.canvas.defaultFillStyle = ol.color.fromString('black');


/**
 * @const {string}
 */
ol.render.canvas.defaultLineCap = 'butt';


/**
 * @const {Array.<number>}
 */
ol.render.canvas.defaultLineDash = [];


/**
 * @const {string}
 */
ol.render.canvas.defaultLineJoin = 'miter';


/**
 * @const {number}
 */
ol.render.canvas.defaultMiterLimit = 10;


/**
 * @const {ol.Color}
 */
ol.render.canvas.defaultStrokeStyle = ol.color.fromString('black');


/**
 * @const {number}
 */
ol.render.canvas.defaultLineWidth = 1;
