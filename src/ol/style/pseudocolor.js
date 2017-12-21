//FIXME: Implement breakpoint logic with better breakpoint management.
goog.provide('ol.style.Pseudocolor');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.color');
goog.require('ol.math');
goog.require('ol.obj');
goog.require('ol.style.PseudocolorMode');

if (ol.ENABLE_COVERAGE) {

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

    /**
     * @private
     * @type {string|undefined}
     */
    this.checksum_ = undefined;
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
      breakpoints: breakpoints ? newBreakpoints : breakpoints
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
    this.checksum_ = undefined;
  };


  /**
   * Set the maximum value.
   * @param {number} max New maximum value.
   * @api
   */
  ol.style.Pseudocolor.prototype.setMax = function(max) {
    this.max_ = max;
    this.checksum_ = undefined;
  };


  /**
   * Set the styled band's index.
   * @param {number} band New band index.
   * @api
   */
  ol.style.Pseudocolor.prototype.setBandIndex = function(band) {
    this.band_ = band;
    this.checksum_ = undefined;
  };


  /**
   * Set the starting color.
   * @param {ol.Color|string} color New start color.
   * @api
   */
  ol.style.Pseudocolor.prototype.setStartColor = function(color) {
    this.startColor_ = color;
    this.checksum_ = undefined;
  };


  /**
   * Set the ending color.
   * @param {ol.Color|string} color New end color.
   * @api
   */
  ol.style.Pseudocolor.prototype.setEndColor = function(color) {
    this.endColor_ = color;
    this.checksum_ = undefined;
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
    this.checksum_ = undefined;
  };


  /**
   * Set the additional breakpoints.
   * @param {Array.<ol.PseudocolorMap>} breakpoints Breakpoints.
   * @api
   */
  ol.style.Pseudocolor.prototype.setBreakpoints = function(breakpoints) {
    this.breakpoints_ = breakpoints;
    this.checksum_ = undefined;
  };


  /**
   * Fill missing values from band statistics.
   * @param {Array.<ol.coverage.Band>} bands Coverage bands.
   */
  ol.style.Pseudocolor.prototype.fillMissingValues = function(bands) {
    var bandIndex = this.getBandIndex();
    if (bandIndex !== undefined && bands[bandIndex]) {
      var bandStat = bands[bandIndex].getStatistics();
      if (!this.getMin() && bandStat.min) {
        this.setMin(bandStat.min);
      }
      if (!this.getMax() && bandStat.max) {
        this.setMax(bandStat.max);
      }
    }
  };


  /**
   * Apply this style to the specified matrix.
   * @param {Array.<number>|ol.TypedArray} matrix Input matrix.
   * @param {number} nodata NoData value.
   * @return {Array.<number>} Styled interleaved matrix.
   */
  ol.style.Pseudocolor.prototype.apply = function(matrix, nodata) {
    var interleaved = [];
    var k = 0;
    var i, ii;
    var min = this.getMin();
    if (typeof min !== 'number') {
      min = Math.min.apply(matrix);
    }
    var max = this.getMax();
    if (typeof max !== 'number') {
      max = Math.max.apply(matrix);
    }
    var range = max - min;
    var sColor = ol.color.asArray(this.getStartColor());
    var eColor = ol.color.asArray(this.getEndColor());

    for (i = 0, ii = matrix.length; i < ii; ++i) {
      var lerp = (matrix[i] - min) / (range);

      interleaved[k++] = ol.math.lerp(sColor[0], eColor[0], lerp);
      interleaved[k++] = ol.math.lerp(sColor[1], eColor[1], lerp);
      interleaved[k++] = ol.math.lerp(sColor[2], eColor[2], lerp);
      interleaved[k++] = matrix[i] === nodata ? 0 : 255;
    }
    return interleaved;
  };


  /**
   * @return {string} The checksum.
   */
  ol.style.Pseudocolor.prototype.getChecksum = function() {
    if (this.checksum_ === undefined) {
      this.checksum_ = 'p';
      if (this.getBandIndex() !== undefined) {
        this.checksum_ += this.getBandIndex().toString() + ',' +
        this.getMode() + ',' +
        this.getMin() !== undefined ? this.getMin().toString() : '-' + ',' +
        this.getStartColor() ? ol.color.asString(this.getStartColor()) : '-' + ',' +
        this.getMax() !== undefined ? this.getMax().toString() : '-' +
        this.getEndColor() ? ol.color.asString(this.getEndColor()) : '-' + ',';
        if (this.getBreakpoints()) {
          var i, ii;
          var breakpoints = this.getBreakpoints();
          this.checksum_ += '(';
          for (i = 0, ii = breakpoints.length; i < ii; ++i) {
            this.checksum_ += breakpoints[i].value.toString() + ',' +
            ol.color.asString(breakpoints[i].color) + ',';
          }
          this.checksum_ = this.checksum_.slice(0, -1);
          this.checksum_ += ')';
        } else {
          this.checksum_ += '-';
        }
      } else {
        this.checksum_ += '-';
      }
    }

    return this.checksum_;
  };

}
