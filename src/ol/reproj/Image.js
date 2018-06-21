/**
 * @module ol/reproj/Image
 */
import {ERROR_THRESHOLD} from './common.js';
import {inherits} from '../util.js';
import ImageBase from '../ImageBase.js';
import ImageState from '../ImageState.js';
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {getCenter, getIntersection, getHeight, getWidth} from '../extent.js';
import {calculateSourceResolution, render as renderReprojected} from '../reproj.js';
import Triangulation from '../reproj/Triangulation.js';


/**
 * @typedef {function(module:ol/extent~Extent, number, number) : module:ol/ImageBase} FunctionType
 */


/**
 * @classdesc
 * Class encapsulating single reprojected image.
 * See {@link module:ol/source/Image~ImageSource}.
 *
 * @constructor
 * @extends {module:ol/ImageBase}
 * @param {module:ol/proj/Projection} sourceProj Source projection (of the data).
 * @param {module:ol/proj/Projection} targetProj Target projection.
 * @param {module:ol/extent~Extent} targetExtent Target extent.
 * @param {number} targetResolution Target resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/reproj/Image~FunctionType} getImageFunction
 *     Function returning source images (extent, resolution, pixelRatio).
 */
const ReprojImage = function(sourceProj, targetProj,
  targetExtent, targetResolution, pixelRatio, getImageFunction) {

  /**
   * @private
   * @type {module:ol/proj/Projection}
   */
  this.targetProj_ = targetProj;

  /**
   * @private
   * @type {module:ol/extent~Extent}
   */
  this.maxSourceExtent_ = sourceProj.getExtent();
  const maxTargetExtent = targetProj.getExtent();

  const limitedTargetExtent = maxTargetExtent ?
    getIntersection(targetExtent, maxTargetExtent) : targetExtent;

  const targetCenter = getCenter(limitedTargetExtent);
  const sourceResolution = calculateSourceResolution(
    sourceProj, targetProj, targetCenter, targetResolution);

  const errorThresholdInPixels = ERROR_THRESHOLD;

  /**
   * @private
   * @type {!module:ol/reproj/Triangulation}
   */
  this.triangulation_ = new Triangulation(
    sourceProj, targetProj, limitedTargetExtent, this.maxSourceExtent_,
    sourceResolution * errorThresholdInPixels);

  /**
   * @private
   * @type {number}
   */
  this.targetResolution_ = targetResolution;

  /**
   * @private
   * @type {module:ol/extent~Extent}
   */
  this.targetExtent_ = targetExtent;

  const sourceExtent = this.triangulation_.calculateSourceExtent();

  /**
   * @private
   * @type {module:ol/ImageBase}
   */
  this.sourceImage_ =
      getImageFunction(sourceExtent, sourceResolution, pixelRatio);

  /**
   * @private
   * @type {number}
   */
  this.sourcePixelRatio_ =
      this.sourceImage_ ? this.sourceImage_.getPixelRatio() : 1;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {?module:ol/events~EventsKey}
   */
  this.sourceListenerKey_ = null;


  let state = ImageState.LOADED;

  if (this.sourceImage_) {
    state = ImageState.IDLE;
  }

  ImageBase.call(this, targetExtent, targetResolution, this.sourcePixelRatio_, state);
};

inherits(ReprojImage, ImageBase);


/**
 * @inheritDoc
 */
ReprojImage.prototype.disposeInternal = function() {
  if (this.state == ImageState.LOADING) {
    this.unlistenSource_();
  }
  ImageBase.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
ReprojImage.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @return {module:ol/proj/Projection} Projection.
 */
ReprojImage.prototype.getProjection = function() {
  return this.targetProj_;
};


/**
 * @private
 */
ReprojImage.prototype.reproject_ = function() {
  const sourceState = this.sourceImage_.getState();
  if (sourceState == ImageState.LOADED) {
    const width = getWidth(this.targetExtent_) / this.targetResolution_;
    const height = getHeight(this.targetExtent_) / this.targetResolution_;

    this.canvas_ = renderReprojected(width, height, this.sourcePixelRatio_,
      this.sourceImage_.getResolution(), this.maxSourceExtent_,
      this.targetResolution_, this.targetExtent_, this.triangulation_, [{
        extent: this.sourceImage_.getExtent(),
        image: this.sourceImage_.getImage()
      }], 0);
  }
  this.state = sourceState;
  this.changed();
};


/**
 * @inheritDoc
 */
ReprojImage.prototype.load = function() {
  if (this.state == ImageState.IDLE) {
    this.state = ImageState.LOADING;
    this.changed();

    const sourceState = this.sourceImage_.getState();
    if (sourceState == ImageState.LOADED || sourceState == ImageState.ERROR) {
      this.reproject_();
    } else {
      this.sourceListenerKey_ = listen(this.sourceImage_,
        EventType.CHANGE, function(e) {
          const sourceState = this.sourceImage_.getState();
          if (sourceState == ImageState.LOADED || sourceState == ImageState.ERROR) {
            this.unlistenSource_();
            this.reproject_();
          }
        }, this);
      this.sourceImage_.load();
    }
  }
};


/**
 * @private
 */
ReprojImage.prototype.unlistenSource_ = function() {
  unlistenByKey(/** @type {!module:ol/events~EventsKey} */ (this.sourceListenerKey_));
  this.sourceListenerKey_ = null;
};
export default ReprojImage;
