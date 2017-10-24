goog.provide('ol.style.Pseudocolor');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.color');
goog.require('ol.obj');
goog.require('ol.style.PseudocolorMode');

/**
 * @classdesc
 * Single band pseudocolor raster style. Cell values are transformed to colors
 * according to the style's or band's minimum and maximum values, the mode,
 * and the provided colors and intervals.
 *
 * @constructor
 * @struct
 * @param {olx.style.PseudocolorOptions=} opt_options Options.
 * @api
 */
ol.style.Pseudocolor = function(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {number|undefined}
   */
  this.min_ = options.min;

  /**
   * @private
   * @type {number|undefined}
   */
  this.max_ = options.max;

  /**
   * @private
   * @type {number|undefined}
   */
  this.band_ = options.band;

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.startColor_ = options.startColor !== undefined ? options.startColor :
    null;

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.endColor_ = options.endColor !== undefined ? options.endColor :
    null;

  /**
   * @private
   * @type {ol.style.PseudocolorMode}
   */
  this.mode_ = options.mode ? options.mode : ol.style.PseudocolorMode.INTERPOLATE;

  /**
   * @private
   * @type {Array.<ol.PseudocolorMap>}
   */
  this.breakpoints_ = options.breakpoints !== undefined ? options.breakpoints :
    null;
};


/**
 * Converts a breakpoint value and a color to a color map.
 * @param {number} value Breakpoint value.
 * @param {ol.Color|string} color Breakpoint color.
 * @return {ol.PseudocolorMap} Color map.
 */
ol.style.Pseudocolor.createColorMap = function(value, color) {
  return {
    value: value,
    color: color
  };
};


/**
 * Clones the style.
 * @return {ol.style.Pseudocolor} The cloned style.
 * @api
 */
ol.style.Pseudocolor.prototype.clone = function() {
  var breakpoints = this.getBreakpoints();
  var newBreakpoints = [];
  if (breakpoints && breakpoints.length) {
    for (var i = 0; i < breakpoints.length; ++i) {
      var breakpoint = breakpoints[i];
      var colorArr = ol.color.asArray(breakpoint.color).slice(0);
      newBreakpoints.push(ol.style.Pseudocolor.createColorMap(breakpoint.value,
          colorArr));
    }
  }
  var startCol = ol.color.asArray(this.startColor_).slice(0);
  var endCol = ol.color.asArray(this.endColor_).slice(0);
  return new ol.style.Pseudocolor({
    min: this.getMin(),
    max: this.getMax(),
    band: this.getBandIndex(),
    startColor: startCol,
    endColor: endCol,
    mode: this.getMode(),
    breakpoints: breakpoints || newBreakpoints
  });
};


/**
 * Get the minimum value.
 * @return {number|undefined} Minimum value.
 * @api
 */
ol.style.Pseudocolor.prototype.getMin = function() {
  return this.min_;
};


/**
 * Get the maximum value.
 * @return {number|undefined} Maximum value.
 * @api
 */
ol.style.Pseudocolor.prototype.getMax = function() {
  return this.max_;
};


/**
 * Get the styled band's index.
 * @return {number|undefined} Band index.
 * @api
 */
ol.style.Pseudocolor.prototype.getBandIndex = function() {
  return this.band_;
};


/**
 * Get the starting color.
 * @return {ol.Color|string} Start color.
 * @api
 */
ol.style.Pseudocolor.prototype.getStartColor = function() {
  return this.startColor_;
};


/**
 * Get the ending color.
 * @return {ol.Color|string} End color.
 * @api
 */
ol.style.Pseudocolor.prototype.getEndColor = function() {
  return this.endColor_;
};


/**
 * Get the coloring mode.
 * @return {ol.style.PseudocolorMode} Mode.
 * @api
 */
ol.style.Pseudocolor.prototype.getMode = function() {
  return this.mode_;
};


/**
 * Get the additional breakpoints.
 * @return {Array.<ol.PseudocolorMap>} Color map.
 * @api
 */
ol.style.Pseudocolor.prototype.getBreakpoints = function() {
  return this.breakpoints_;
};


/**
 * Set the minimum value.
 * @param {number} min New minimum value.
 * @api
 */
ol.style.Pseudocolor.prototype.setMin = function(min) {
  this.min_ = min;
};


/**
 * Set the maximum value.
 * @param {number} max New maximum value.
 * @api
 */
ol.style.Pseudocolor.prototype.setMax = function(max) {
  this.max_ = max;
};


/**
 * Set the styled band's index.
 * @param {number} band New band index.
 * @api
 */
ol.style.Pseudocolor.prototype.setBandIndex = function(band) {
  this.band_ = band;
};


/**
 * Set the starting color.
 * @param {ol.Color|string} color New start color.
 * @api
 */
ol.style.Pseudocolor.prototype.setStartColor = function(color) {
  this.startColor_ = color;
};


/**
 * Set the ending color.
 * @param {ol.Color|string} color New end color.
 * @api
 */
ol.style.Pseudocolor.prototype.setEndColor = function(color) {
  this.endColor_ = color;
};


/**
 * Set the coloring mode.
 * @param {ol.style.PseudocolorMode} mode Mode.
 * @api
 */
ol.style.Pseudocolor.prototype.setMode = function(mode) {
  var valid = ol.obj.getValues(ol.style.PseudocolorMode);
  ol.asserts.assert(valid.indexOf(mode) !== -1, 62);
  this.mode_ = mode;
};


/**
 * Set the additional breakpoints.
 * @param {Array.<ol.PseudocolorMap>} breakpoints Breakpoints.
 * @api
 */
ol.style.Pseudocolor.prototype.setBreakpoints = function(breakpoints) {
  this.breakpoints_ = breakpoints;
};
