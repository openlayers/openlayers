goog.provide('ol.style.LiteralShape');
goog.provide('ol.style.ShapeType');

goog.require('ol.style.LiteralPoint');


/**
 * @enum {string}
 */
ol.style.ShapeType = {
  CIRCLE: 'circle'
};


/**
 * @typedef {{type: (ol.style.ShapeType),
 *            size: (number),
 *            fillStyle: (string),
 *            strokeStyle: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.LiteralShapeConfig;



/**
 * @constructor
 * @implements {ol.style.LiteralPoint}
 * @param {ol.style.LiteralShapeConfig} config Symbolizer properties.
 */
ol.style.LiteralShape = function(config) {

  /** @type {string} */
  this.type = config.type;

  /** @type {number} */
  this.size = config.size;

  /** @type {string} */
  this.fillStyle = config.fillStyle;

  /** @type {string} */
  this.strokeStyle = config.strokeStyle;

  /** @type {number} */
  this.strokeWidth = config.strokeWidth;

  /** @type {number} */
  this.opacity = config.opacity;

};
