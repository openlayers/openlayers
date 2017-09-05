import _ol_ from '../index';
import _ol_ImageBase_ from '../imagebase';
import _ol_ImageState_ from '../imagestate';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_reproj_ from '../reproj';
import _ol_reproj_Triangulation_ from '../reproj/triangulation';

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
var _ol_reproj_Image_ = function(sourceProj, targetProj,
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
  var maxTargetExtent = targetProj.getExtent();

  var limitedTargetExtent = maxTargetExtent ?
    _ol_extent_.getIntersection(targetExtent, maxTargetExtent) : targetExtent;

  var targetCenter = _ol_extent_.getCenter(limitedTargetExtent);
  var sourceResolution = _ol_reproj_.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  var errorThresholdInPixels = _ol_.DEFAULT_RASTER_REPROJECTION_ERROR_THRESHOLD;

  /**
   * @private
   * @type {!ol.reproj.Triangulation}
   */
  this.triangulation_ = new _ol_reproj_Triangulation_(
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

  var sourceExtent = this.triangulation_.calculateSourceExtent();

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


  var state = _ol_ImageState_.LOADED;
  var attributions = [];

  if (this.sourceImage_) {
    state = _ol_ImageState_.IDLE;
    attributions = this.sourceImage_.getAttributions();
  }

  _ol_ImageBase_.call(this, targetExtent, targetResolution, this.sourcePixelRatio_,
      state, attributions);
};

_ol_.inherits(_ol_reproj_Image_, _ol_ImageBase_);


/**
 * @inheritDoc
 */
_ol_reproj_Image_.prototype.disposeInternal = function() {
  if (this.state == _ol_ImageState_.LOADING) {
    this.unlistenSource_();
  }
  _ol_ImageBase_.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
_ol_reproj_Image_.prototype.getImage = function(opt_context) {
  return this.canvas_;
};


/**
 * @return {ol.proj.Projection} Projection.
 */
_ol_reproj_Image_.prototype.getProjection = function() {
  return this.targetProj_;
};


/**
 * @private
 */
_ol_reproj_Image_.prototype.reproject_ = function() {
  var sourceState = this.sourceImage_.getState();
  if (sourceState == _ol_ImageState_.LOADED) {
    var width = _ol_extent_.getWidth(this.targetExtent_) / this.targetResolution_;
    var height =
        _ol_extent_.getHeight(this.targetExtent_) / this.targetResolution_;

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
_ol_reproj_Image_.prototype.load = function() {
  if (this.state == _ol_ImageState_.IDLE) {
    this.state = _ol_ImageState_.LOADING;
    this.changed();

    var sourceState = this.sourceImage_.getState();
    if (sourceState == _ol_ImageState_.LOADED ||
        sourceState == _ol_ImageState_.ERROR) {
      this.reproject_();
    } else {
      this.sourceListenerKey_ = _ol_events_.listen(this.sourceImage_,
          _ol_events_EventType_.CHANGE, function(e) {
            var sourceState = this.sourceImage_.getState();
            if (sourceState == _ol_ImageState_.LOADED ||
                sourceState == _ol_ImageState_.ERROR) {
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
_ol_reproj_Image_.prototype.unlistenSource_ = function() {
  _ol_events_.unlistenByKey(/** @type {!ol.EventsKey} */ (this.sourceListenerKey_));
  this.sourceListenerKey_ = null;
};
export default _ol_reproj_Image_;
