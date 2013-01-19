goog.provide('ol.style.LiteralLine');

goog.require('ol.style.LiteralSymbolizer');


/**
 * @typedef {{strokeStyle: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.LiteralLineConfig;



/**
 * @constructor
 * @implements {ol.style.LiteralSymbolizer}
 * @param {ol.style.LiteralLineConfig} config Symbolizer properties.
 */
ol.style.LiteralLine = function(config) {

  /** @type {string} */
  this.strokeStyle = config.strokeStyle;

  /** @type {number} */
  this.strokeWidth = config.strokeWidth;

  /** @type {number} */
  this.opacity = config.opacity;

};
