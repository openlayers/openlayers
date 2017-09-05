import _ol_ from '../index';
import _ol_ImageCanvas_ from '../imagecanvas';
import _ol_extent_ from '../extent';
import _ol_source_Image_ from '../source/image';

/**
 * @classdesc
 * Base class for image sources where a canvas element is the image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageCanvasOptions} options Constructor options.
 * @api
 */
var _ol_source_ImageCanvas_ = function(options) {

  _ol_source_Image_.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection,
    resolutions: options.resolutions,
    state: options.state
  });

  /**
   * @private
   * @type {ol.CanvasFunctionType}
   */
  this.canvasFunction_ = options.canvasFunction;

  /**
   * @private
   * @type {ol.ImageCanvas}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = options.ratio !== undefined ?
    options.ratio : 1.5;

};

_ol_.inherits(_ol_source_ImageCanvas_, _ol_source_Image_);


/**
 * @inheritDoc
 */
_ol_source_ImageCanvas_.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  resolution = this.findNearestResolution(resolution);

  var canvas = this.canvas_;
  if (canvas &&
      this.renderedRevision_ == this.getRevision() &&
      canvas.getResolution() == resolution &&
      canvas.getPixelRatio() == pixelRatio &&
      _ol_extent_.containsExtent(canvas.getExtent(), extent)) {
    return canvas;
  }

  extent = extent.slice();
  _ol_extent_.scaleFromCenter(extent, this.ratio_);
  var width = _ol_extent_.getWidth(extent) / resolution;
  var height = _ol_extent_.getHeight(extent) / resolution;
  var size = [width * pixelRatio, height * pixelRatio];

  var canvasElement = this.canvasFunction_(
      extent, resolution, pixelRatio, size, projection);
  if (canvasElement) {
    canvas = new _ol_ImageCanvas_(extent, resolution, pixelRatio,
        this.getAttributions(), canvasElement);
  }
  this.canvas_ = canvas;
  this.renderedRevision_ = this.getRevision();

  return canvas;
};
export default _ol_source_ImageCanvas_;
