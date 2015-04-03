/**
 * @fileoverview Externs for FastClick 1.0.3
 * @see https://github.com/ftlabs/fastclick
 * @externs
 */

/**
 * @type {Object}
 * @const
 */
var FastClick = {};

/**
 * @typedef {{
 *   touchBoundary: (number|undefined),
 *   tapDelay: (number|undefined)
 * }}
 */
FastClick.AttachOptions;

/**
 * @param {Element} layer
 * @param {FastClick.AttachOptions=} opt_options
 */
FastClick.attach = function(layer, opt_options) {};
