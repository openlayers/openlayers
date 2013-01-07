goog.provide('ol.style.LiteralFill');

goog.require('ol.style.LiteralSymbolizer');


/**
 * @typedef {{color: (string),
 *            opacity: (number)}}
 */
ol.style.LiteralFillConfig;



/**
 * @constructor
 * @implements {ol.style.LiteralSymbolizer}
 * @param {ol.style.LiteralFillConfig} config Symbolizer properties.
 */
ol.style.LiteralFill = function(config) {

  /** @type {string} */
  this.color = config.color;

  /** @type {number} */
  this.opacity = config.opacity;

};
