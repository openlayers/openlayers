goog.provide('ol.style.Monochrome');

goog.require('ol');
goog.require('ol.math');

if (ol.ENABLE_COVERAGE) {

  /**
   * @classdesc
   * Single band greyscale raster style. Cell values are transformed to byte
   * range (0-255) according to the supplied or calculated minimum and maximum
   * cell values.
   *
   * @constructor
   * @struct
   * @param {olx.style.MonochromeOptions=} opt_options Options.
   * @api
   */
  ol.style.Monochrome = function(opt_options) {

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
     * @type {string|undefined}
     */
    this.checksum_ = undefined;
  };


  /**
   * @param {number=} opt_index Band index.
   * @return {ol.style.Monochrome} Default raster style.
   */
  ol.style.Monochrome.defaultStyle = function(opt_index) {
    return new ol.style.Monochrome({band: opt_index ? opt_index : 0});
  };


  /**
   * Clones the style.
   * @return {ol.style.Monochrome} The cloned style.
   * @api
   */
  ol.style.Monochrome.prototype.clone = function() {
    return new ol.style.Monochrome({
      min: this.getMin(),
      max: this.getMax(),
      band: this.getBandIndex()
    });
  };


  /**
   * Get the minimum value.
   * @return {number|undefined} Minimum value.
   * @api
   */
  ol.style.Monochrome.prototype.getMin = function() {
    return this.min_;
  };


  /**
   * Get the maximum value.
   * @return {number|undefined} Maximum value.
   * @api
   */
  ol.style.Monochrome.prototype.getMax = function() {
    return this.max_;
  };


  /**
   * Get the styled band's index.
   * @return {number|undefined} Band index.
   * @api
   */
  ol.style.Monochrome.prototype.getBandIndex = function() {
    return this.band_;
  };


  /**
   * Set the minimum value.
   * @param {number} min New minimum value.
   * @api
   */
  ol.style.Monochrome.prototype.setMin = function(min) {
    this.min_ = min;
    this.checksum_ = undefined;
  };


  /**
   * Set the maximum value.
   * @param {number} max New maximum value.
   * @api
   */
  ol.style.Monochrome.prototype.setMax = function(max) {
    this.max_ = max;
    this.checksum_ = undefined;
  };


  /**
   * Set the styled band's index.
   * @param {number} band New band index.
   * @api
   */
  ol.style.Monochrome.prototype.setBandIndex = function(band) {
    this.band_ = band;
    this.checksum_ = undefined;
  };


  /**
   * Fill missing values from band statistics.
   * @param {Array.<ol.coverage.Band>} bands Coverage bands.
   */
  ol.style.Monochrome.prototype.fillMissingValues = function(bands) {
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
  ol.style.Monochrome.prototype.apply = function(matrix, nodata) {
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

    for (i = 0, ii = matrix.length; i < ii; ++i) {
      var lerp = (matrix[i] - min) / range;
      var value = ol.math.clamp(Math.round(255 * lerp), 0, 255);

      interleaved[k++] = value;
      interleaved[k++] = value;
      interleaved[k++] = value;
      interleaved[k++] = matrix[i] === nodata ? 0 : 255;
    }
    return interleaved;
  };


  /**
   * @return {string} The checksum.
   */
  ol.style.Monochrome.prototype.getChecksum = function() {
    if (this.checksum_ === undefined) {
      this.checksum_ = 'm';
      if (this.getBandIndex() !== undefined) {
        this.checksum_ += this.getBandIndex().toString() + ',' +
        (this.getMin() !== undefined ? this.getMin().toString() : '-') + ',' +
        (this.getMax() !== undefined ? this.getMax().toString() : '-');
      } else {
        this.checksum_ += '-';
      }
    }

    return this.checksum_;
  };

}
