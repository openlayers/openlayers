goog.provide('ol.style.RGB');

goog.require('ol');
goog.require('ol.style.Monochrome');

if (ol.ENABLE_COVERAGE) {

  /**
   * @classdesc
   * Composite RGB raster style. Different bands are associated to every color
   * channel creating an RGB composite as a result.
   *
   * @constructor
   * @struct
   * @param {olx.style.RGBOptions=} opt_options Options.
   * @api
   */
  ol.style.RGB = function(opt_options) {

    var options = opt_options || {};

    /**
     * @private
     * @type {ol.style.Monochrome}
     */
    this.red_ = options.red ? options.red : ol.style.Monochrome.defaultStyle();

    /**
     * @private
     * @type {ol.style.Monochrome}
     */
    this.green_ = options.green ? options.green : ol.style.Monochrome.defaultStyle();

    /**
     * @private
     * @type {ol.style.Monochrome}
     */
    this.blue_ = options.blue ? options.blue : ol.style.Monochrome.defaultStyle();
  };


  /**
   * Clones the style.
   * @return {ol.style.RGB} The cloned style.
   * @api
   */
  ol.style.RGB.prototype.clone = function() {
    return new ol.style.RGB({
      red: this.red_,
      green: this.green_,
      blue: this.blue_
    });
  };


  /**
   * Get the red channel's style.
   * @return {ol.style.Monochrome} Red channel's style.
   * @api
   */
  ol.style.RGB.prototype.getRed = function() {
    return this.red_;
  };


  /**
   * Get the green channel's style.
   * @return {ol.style.Monochrome} Green channel's style.
   * @api
   */
  ol.style.RGB.prototype.getGreen = function() {
    return this.green_;
  };


  /**
   * Get the blue channel's style.
   * @return {ol.style.Monochrome} Blue channel's style.
   * @api
   */
  ol.style.RGB.prototype.getBlue = function() {
    return this.blue_;
  };


  /**
   * Set the red channel's style.
   * @param {ol.style.Monochrome} red Red channel's new style.
   * @api
   */
  ol.style.RGB.prototype.setRed = function(red) {
    this.red_ = red;
  };


  /**
   * Set the green channel's style.
   * @param {ol.style.Monochrome} green Green channel's new style.
   * @api
   */
  ol.style.RGB.prototype.setGreen = function(green) {
    this.green_ = green;
  };


  /**
   * Set the blue channel's style.
   * @param {ol.style.Monochrome} blue Blue channel's new style.
   * @api
   */
  ol.style.RGB.prototype.setBlue = function(blue) {
    this.blue_ = blue;
  };

}
