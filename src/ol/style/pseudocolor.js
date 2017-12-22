goog.provide('ol.style.Pseudocolor');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.asserts');
goog.require('ol.Collection');
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
     * @type {ol.Collection}
     */
    this.breakpoints_ = new ol.Collection();

    if (Array.isArray(options.breakpoints)) {
      var i, ii;
      for (i = 0, ii = options.breakpoints.length; i < ii; ++i) {
        this.addBreakpoint(options.breakpoints[i]);
      }
    }

    /**
     * @private
     * @type {string|undefined}
     */
    this.checksum_ = undefined;
  };


  /**
   * Adds a breakpoint to the breakpoint list.
   * @param {ol.PseudocolorMap} breakpoint Breakpoint.
   * @api
   */
  ol.style.Pseudocolor.prototype.addBreakpoint = function(breakpoint) {
    ol.asserts.assert(Array.isArray(breakpoint) && breakpoint.length === 2 &&
        typeof breakpoint[0] === 'number', 65);
    this.breakpoints_.push([breakpoint[0], ol.color.asArray(breakpoint[1])]);
    this.checksum_ = undefined;
  };


  /**
   * Removes a provided breakpoint or the breakpoint at the provided index.
   * @param {ol.PseudocolorMap|number} breakpoint Breakpoint element or index.
   * @api
   */
  ol.style.Pseudocolor.prototype.removeBreakpoint = function(breakpoint) {
    if (Array.isArray(breakpoint)) {
      this.breakpoints_.remove(breakpoint);
      this.checksum_ = undefined;
    } else if (breakpoint) {
      this.breakpoints_.removeAt(breakpoint);
      this.checksum_ = undefined;
    }
  };


  /**
   * Clears the breakpoint list associated with this style.
   * @api
   */
  ol.style.Pseudocolor.prototype.clearBreakpoints = function() {
    this.breakpoints_.clear();
    this.checksum_ = undefined;
  };


  /**
   * Clones the style.
   * @return {ol.style.Pseudocolor} The cloned style.
   * @api
   */
  ol.style.Pseudocolor.prototype.clone = function() {
    var breakpoints = this.getBreakpoints();
    var newBreakpoints = [];
    if (breakpoints.length) {
      for (var i = 0; i < breakpoints.length; ++i) {
        var breakpoint = breakpoints[i];
        var colorArr = breakpoint.color.slice();
        newBreakpoints.push([breakpoint[0], colorArr]);
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
      breakpoints: newBreakpoints
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
    return this.breakpoints_.getArray().slice();
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
    var i, ii, j, jj;
    var min = this.getMin();
    if (typeof min !== 'number') {
      min = Math.min.apply(matrix);
    }
    var max = this.getMax();
    if (typeof max !== 'number') {
      max = Math.max.apply(matrix);
    }
    var intervals = this.createIntervals_(min, max);
    jj = intervals.length;
    var categorized = this.getMode() === ol.style.PseudocolorMode.CATEGORIZED;

    for (i = 0, ii = matrix.length; i < ii; ++i) {
      if (matrix[i] < min || matrix[i] > max) {
        interleaved[k++] = 0;
        interleaved[k++] = 0;
        interleaved[k++] = 0;
        interleaved[k++] = 0;
      } else {
        for (j = 0; j < jj; ++j) {
          if (matrix[i] <= intervals[j].higher[0]) {
            if (categorized) {
              interleaved[k++] = intervals[j].lower[1][0];
              interleaved[k++] = intervals[j].lower[1][1];
              interleaved[k++] = intervals[j].lower[1][2];
            } else {
              var lerp = (matrix[i] - intervals[j].lower[0]) / intervals[j].range;
              interleaved[k++] = ol.math.lerp(intervals[j].lower[1][0],
                  intervals[j].higher[1][0], lerp);
              interleaved[k++] = ol.math.lerp(intervals[j].lower[1][1],
                  intervals[j].higher[1][1], lerp);
              interleaved[k++] = ol.math.lerp(intervals[j].lower[1][2],
                  intervals[j].higher[1][2], lerp);
            }
            interleaved[k++] = matrix[i] === nodata ? 0 : 255;
            break;
          }
        }
      }
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
        if (this.getBreakpoints().length) {
          var i, ii;
          var breakpoints = this.getBreakpoints();
          this.checksum_ += '(';
          for (i = 0, ii = breakpoints.length; i < ii; ++i) {
            this.checksum_ += breakpoints[i][0].toString() + ',' +
            ol.color.asString(breakpoints[i][1]) + ',';
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


  /**
   * @private
   * @param {number} min Min.
   * @param {number} max Max.
   * @return {Array.<ol.PseudocolorInterval>} Intervals.
   */
  ol.style.Pseudocolor.prototype.createIntervals_ = function(min, max) {
    var intervals = [];
    var sColor = ol.color.asArray(this.getStartColor());
    var eColor = ol.color.asArray(this.getEndColor());
    var prev = [min, sColor];
    var i, ii;
    var breakpoints = this.getBreakpoints();
    if (breakpoints.length) {
      ol.array.stableSort(breakpoints, function(a, b) {
        return a[0] - b[0];
      });
      for (i = 0, ii = breakpoints.length; i < ii; ++i) {
        var p = breakpoints[i];
        // Start and end colors take precedence.
        if (p[0] > min && p[0] < max) {
          intervals.push({
            lower: prev,
            higher: p,
            range: p[0] - prev[0]
          });
          prev = p;
        }
      }
    }
    intervals.push({
      lower: prev,
      higher: [max, eColor],
      range: max - prev[0]
    });
    return intervals;
  };

}
