goog.provide('ol.style.LiteralPolygon');

goog.require('ol.style.LiteralSymbolizer');


/**
 * @typedef {{fillStyle: (string),
 *            strokeStyle: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.LiteralPolygonConfig;



/**
 * @constructor
 * @implements {ol.style.LiteralSymbolizer}
 * @param {ol.style.LiteralPolygonConfig} config Symbolizer properties.
 */
ol.style.LiteralPolygon = function(config) {

  /** @type {string} */
  this.fillStyle = config.fillStyle;

  /** @type {string} */
  this.strokeStyle = config.strokeStyle;

  /** @type {number} */
  this.strokeWidth = config.strokeWidth;

  /** @type {number} */
  this.opacity = config.opacity;

};
