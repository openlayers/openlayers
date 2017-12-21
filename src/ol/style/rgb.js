goog.provide('ol.style.RGB');

goog.require('ol');
goog.require('ol.math');
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
   * Returns the component band indices in RGB order.
   * @return {Array.<number>} Band indices.
   * @api
   */
  ol.style.RGB.prototype.getBandIndex = function() {
    return [this.getRed().getBandIndex(), this.getGreen().getBandIndex(),
      this.getBlue().getBandIndex()];
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


  /**
   * Fill missing values from band statistics.
   * @param {Array.<ol.coverage.Band>} bands Coverage bands.
   */
  ol.style.RGB.prototype.fillMissingValues = function(bands) {
    this.getRed().fillMissingValues(bands);
    this.getGreen().fillMissingValues(bands);
    this.getBlue().fillMissingValues(bands);
  };


  /**
   * Apply this style to the specified matrices.
   * @param {Array.<Array.<number>|ol.TypedArray>} matrices Aligned matrices in
   * RGB order. If a channel is missing, the order still needs to be kept (e.g. RB).
   * @param {Array.<number>} nodata NoData values.
   * @return {Array.<number>} Styled interleaved matrix.
   */
  ol.style.RGB.prototype.apply = function(matrices, nodata) {
    var bandIndices = this.getBandIndex();
    var i, ii;
    for (i = 0; i < 3; ++i) {
      if (bandIndices[i] === undefined) {
        matrices.splice(i, 0, undefined);
        nodata.splice(i, 0, undefined);
      }
    }

    var refMatrix = matrices[0] ? matrices[0] : matrices[1] ? matrices[1] : matrices[2]
      ? matrices[2] : [];

    var interleaved = [];
    var k = 0;
    var redMin = this.getRed().getMin();
    var redMax = this.getRed().getMax();
    var greenMin = this.getGreen().getMin();
    var greenMax = this.getGreen().getMax();
    var blueMin = this.getBlue().getMin();
    var blueMax = this.getBlue().getMax();

    for (i = 0, ii = refMatrix.length; i < ii; ++i) {
      var redLerp = matrices[0] ? (matrices[0][i] - redMin) / (redMax - redMin) : 0;
      var greenLerp = matrices[1] ? (matrices[1][i] - greenMin) / (greenMax - greenMin) : 0;
      var blueLerp = matrices[2] ? (matrices[2][i] - blueMin) / (blueMax - blueMin) : 0;

      var redNodata = matrices[0] ? matrices[0][i] === nodata[0] : true;
      var greenNodata = matrices[1] ? matrices[1][i] === nodata[1] : true;
      var blueNodata = matrices[2] ? matrices[2][i] === nodata[2] : true;

      interleaved[k++] = ol.math.clamp(Math.round(255 * redLerp), 0, 255);
      interleaved[k++] = ol.math.clamp(Math.round(255 * greenLerp), 0, 255);
      interleaved[k++] = ol.math.clamp(Math.round(255 * blueLerp), 0, 255);
      interleaved[k++] = redNodata && greenNodata && blueNodata ? 1 : 0;
    }
    return interleaved;
  };


  /**
   * @return {string} The checksum.
   */
  ol.style.RGB.prototype.getChecksum = function() {
    return 'r' + this.getRed().getChecksum() + 'g' +
      this.getGreen().getChecksum() + 'b' + this.getBlue().getChecksum();
  };

}
