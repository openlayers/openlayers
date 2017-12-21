goog.provide('ol.coverage.Image');

goog.require('ol');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');

if (ol.ENABLE_COVERAGE) {

  /**
   * @constructor
   * @extends {ol.ImageBase}
   * @param {ol.Extent} extent Extent.
   * @param {number} pixelRatio Pixel ratio.
   * @param {Array.<ol.Attribution>} attributions Attributions.
   * @param {ol.coverage.Band} band Styled band.
   * @param {?ol.CoverageDrawFunctionType} coverageDrawFunc Drawing function.
   */
  ol.coverage.Image = function(extent, pixelRatio, attributions, band,
      coverageDrawFunc) {

    ol.ImageBase.call(this, extent, undefined, pixelRatio, ol.ImageState.IDLE,
        attributions);

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = null;

    /**
     * @protected
     * @type {ol.ImageState}
     */
    this.state = ol.ImageState.IDLE;

    /**
     * @private
     * @type {ol.coverage.Band|undefined}
     */
    this.band_ = band;

    /**
     * @private
     * @type {ol.CoverageDrawFunctionType}
     */
    this.coverageDrawFunction_ = coverageDrawFunc || this.getDefaultDrawFunction_();

  };
  ol.inherits(ol.coverage.Image, ol.ImageBase);


  /**
   * @inheritDoc
   */
  ol.coverage.Image.prototype.getImage = function() {
    return this.canvas_;
  };


  /**
   * @inheritDoc
   */
  ol.coverage.Image.prototype.load = function() {
    if (this.state !== ol.ImageState.LOADED) {
      this.state = ol.ImageState.LOADING;
      this.changed();

      try {
        var styledMatrix = /** @type {Array.<number>} */ (this.band_.getCoverageData());
        this.canvas_ = this.coverageDrawFunction_(styledMatrix, this.band_.getStride(),
            this.band_.getResolution(), this.getPixelRatio());
        this.resolution = ol.extent.getHeight(this.extent) / this.canvas_.height;
        this.state = ol.ImageState.LOADED;
        this.changed();
      } catch (err) {
        this.state = ol.ImageState.ERROR;
        this.changed();
      }

      this.band_ = undefined;
    }
  };


  /**
   * @return {ol.CoverageDrawFunctionType} Raster draw function.
   */
  ol.coverage.Image.prototype.getDefaultDrawFunction_ = function() {
    return function(matrix, stride, resolution, pixelRatio) {
      var mpPix = Math.ceil(pixelRatio);
      var mpY = resolution[1] / resolution[0];

      var height = matrix.length / (stride * 4);
      var rawImg = this.createContext_(stride, height);
      var imgData = rawImg.createImageData(stride, height);
      var rasterImg = new Uint8ClampedArray(matrix);
      imgData.data.set(rasterImg);
      rawImg.putImageData(imgData, 0, 0);

      height = height * mpPix * mpY;
      var width = stride * mpPix;
      var ctx = this.createContext_(width, height);
      ctx.drawImage(rawImg.canvas, 0, 0, width, height);
      return ctx.canvas;
    };
  };


  /**
   * @param {ol.Extent} extent Extent.
   */
  ol.coverage.Image.prototype.updateResolution = function(extent) {
    if (this.state === ol.ImageState.LOADED) {
      this.resolution = ol.extent.getHeight(this.extent) / this.canvas_.height;
    }
  };


  /**
   * @private
   * @param {number} width Width.
   * @param {number} height Height.
   * @return {CanvasRenderingContext2D} Context.
   */
  ol.coverage.Image.prototype.createContext_ = function(width, height) {
    var ctx = ol.dom.createCanvasContext2D(width, height);
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    return ctx;
  };

}
