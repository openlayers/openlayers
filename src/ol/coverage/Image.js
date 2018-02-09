/**
 * @module ol/coverage/Image
 */
import {inherits} from '../index.js';
import _ol_ImageBase_ from '../ImageBase.js';
import ImageState from '../ImageState.js';
import {getHeight} from '../extent.js';
import {createCanvasContext2D} from '../dom.js';

/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.Extent} extent Extent.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 * @param {ol.coverage.Band} band Styled band.
 * @param {?ol.CoverageDrawFunctionType} coverageDrawFunc Drawing function.
 */
const CoverageImage = function(extent, pixelRatio, attributions, band, coverageDrawFunc) {

  _ol_ImageBase_.call(this, extent, undefined, pixelRatio, ImageState.IDLE,
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
  this.state = ImageState.IDLE;

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

inherits(CoverageImage, _ol_ImageBase_);


/**
 * @inheritDoc
 */
CoverageImage.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
CoverageImage.prototype.load = function() {
  if (this.state !== ImageState.LOADED) {
    this.state = ImageState.LOADING;
    this.changed();

    try {
      const styledMatrix = /** @type {Array.<number>} */ (this.band_.getCoverageData());
      this.canvas_ = this.coverageDrawFunction_(styledMatrix, this.band_.getStride(),
        this.band_.getResolution(), this.getPixelRatio());
      this.resolution = getHeight(this.extent) / this.canvas_.height;
      this.state = ImageState.LOADED;
      this.changed();
    } catch (err) {
      this.state = ImageState.ERROR;
      this.changed();
    }

    this.band_ = undefined;
  }
};


/**
 * @return {ol.CoverageDrawFunctionType} Raster draw function.
 */
CoverageImage.prototype.getDefaultDrawFunction_ = function() {
  return function(matrix, stride, resolution, pixelRatio) {
    const mpPix = Math.ceil(pixelRatio);
    const mpY = resolution[1] / resolution[0];

    let height = matrix.length / (stride * 4);
    const rawImg = this.createContext_(stride, height);
    const imgData = rawImg.createImageData(stride, height);
    const rasterImg = new Uint8ClampedArray(matrix);
    imgData.data.set(rasterImg);
    rawImg.putImageData(imgData, 0, 0);

    height = height * mpPix * mpY;
    const width = stride * mpPix;
    const ctx = this.createContext_(width, height);
    ctx.drawImage(rawImg.canvas, 0, 0, width, height);
    return ctx.canvas;
  };
};


/**
 * @param {ol.Extent} extent Extent.
 */
CoverageImage.prototype.updateResolution = function(extent) {
  if (this.state === ImageState.LOADED) {
    this.resolution = getHeight(this.extent) / this.canvas_.height;
  }
};


/**
 * @private
 * @param {number} width Width.
 * @param {number} height Height.
 * @return {CanvasRenderingContext2D} Context.
 */
CoverageImage.prototype.createContext_ = function(width, height) {
  const ctx = createCanvasContext2D(width, height);
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  return ctx;
};
export default CoverageImage;
