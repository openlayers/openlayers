/**
 * @module ol/reproj/Image
 */
import {ERROR_THRESHOLD} from './common.js';
import {inherits} from '../index.js';
import _ol_ImageBase_ from '../ImageBase.js';
import ImageState from '../ImageState.js';
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {getCenter, getIntersection, getHeight, getWidth} from '../extent.js';
import _ol_reproj_ from '../reproj.js';
import Triangulation from '../reproj/Triangulation.js';

/**
 * @classdesc
 * Class encapsulating single reprojected image.
 * See {@link ol.source.Image}.
 *
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.proj.Projection} sourceProj Source projection (of the data).
 * @param {ol.proj.Projection} targetProj Target projection.
 * @param {ol.Extent} targetExtent Target extent.
 * @param {number} targetResolution Target resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.ReprojImageFunctionType} getImageFunction
 *     Function returning source images (extent, resolution, pixelRatio).
 */
const ReprojImage = function(sourceProj, targetProj,
  targetExtent, targetResolution, pixelRatio, getImageFunction) {

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.targetProj_ = targetProj;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.maxSourceExtent_ = sourceProj.getExtent();
  const maxTargetExtent = targetProj.getExtent();

  const limitedTargetExtent = maxTargetExtent ?
    getIntersection(targetExtent, maxTargetExtent) : targetExtent;

  const targetCenter = getCenter(limitedTargetExtent);
  const sourceResolution = _ol_reproj_.calculateSourceResolution(
    sourceProj, targetProj, targetCenter, targetResolution);

  const errorThresholdInPixels = ERROR_THRESHOLD;

  /**
   * @private
   * @type {!ol.reproj.Triangulation}
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
   * @type {ol.Extent}
   */
  this.targetExtent_ = targetExtent;

  const sourceExtent = this.triangulation_.calculateSourceExtent();

  /**
   * @private
   * @type {ol.ImageBase}
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
   * @type {?ol.EventsKey}
   */
  this.sourceListenerKey_ = null;


  let state = ImageState.LOADED;

  if (this.sourceImage_) {
    state = ImageState.IDLE;
  }

  _ol_ImageBase_.call(this, targetExtent, targetResolution, this.sourcePixelRatio_, state);
};

inherits(ReprojImage, _ol_ImageBase_);


/**
 * @inheritDoc
 */
ReprojImage.prototype.disposeInternal = function() {
  if (this.state == ImageState.LOADING) {
    this.unlistenSource_();
  }
  _ol_ImageBase_.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
ReprojImage.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @return {ol.proj.Projection} Projection.
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

    this.canvas_ = _ol_reproj_.render(width, height, this.sourcePixelRatio_,
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
  unlistenByKey(/** @type {!ol.EventsKey} */ (this.sourceListenerKey_));
  this.sourceListenerKey_ = null;
};
export default ReprojImage;
