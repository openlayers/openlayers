goog.provide('ol.style.Monochrome');

goog.require('ol');

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
  };


  /**
   * @return {ol.style.Monochrome} Default raster style.
   */
  ol.style.Monochrome.defaultStyle = function() {
    return new ol.style.Monochrome();
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
  };


  /**
   * Set the maximum value.
   * @param {number} max New maximum value.
   * @api
   */
  ol.style.Monochrome.prototype.setMax = function(max) {
    this.max_ = max;
  };


  /**
   * Set the styled band's index.
   * @param {number} band New band index.
   * @api
   */
  ol.style.Monochrome.prototype.setBandIndex = function(band) {
    this.band_ = band;
  };

}
