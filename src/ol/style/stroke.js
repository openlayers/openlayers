goog.provide('ol.style.LiteralStroke');

goog.require('ol.style.LiteralSymbolizer');


/**
 * @typedef {{width: (number),
 *            color: (string),
 *            opacity: (number)}}
 */
ol.style.LiteralStrokeConfig;



/**
 * @constructor
 * @implements {ol.style.LiteralSymbolizer}
 * @param {ol.style.LiteralStrokeConfig} config Symbolizer properties.
 */
ol.style.LiteralStroke = function(config) {

  /** @type {string} */
  this.color = config.color;

  /** @type {number} */
  this.opacity = config.opacity;

  /** @type {number} */
  this.width = config.width;

};

