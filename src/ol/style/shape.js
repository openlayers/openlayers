goog.provide('ol.style.LiteralShape');

goog.require('ol.style.LiteralFill');
goog.require('ol.style.LiteralStroke');
goog.require('ol.style.LiteralSymbolizer');


/**
 * @enum {string}
 */
ol.style.ShapeType = {
  CIRCLE: 'circle'
};


/**
 * @typedef {{type: (ol.style.ShapeType),
 *            size: (number),
 *            fill: (ol.style.LiteralFill),
 *            stroke: (ol.style.LiteralStroke)}}
 */
ol.style.LiteralShapeConfig;



/**
 * @constructor
 * @implements {ol.style.LiteralSymbolizer}
 * @param {ol.style.LiteralShapeConfig} config Symbolizer properties.
 */
ol.style.LiteralShape = function(config) {

  /** @type {string} */
  this.type = config.type;

  /** @type {number} */
  this.size = config.size;

  /** @type {ol.style.LiteralFill} */
  this.fill = config.fill;

  /** @type {ol.style.LiteralStroke} */
  this.stroke = config.stroke;

};
