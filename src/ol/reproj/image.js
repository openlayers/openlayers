goog.provide('ol.reproj.Image');

goog.require('ol');
goog.require('ol.Image');
goog.require('ol.ImageBase');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.reproj');
goog.require('ol.reproj.Triangulation');


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
ol.reproj.Image = function(sourceProj, targetProj,
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
      ol.extent.getIntersection(targetExtent, maxTargetExtent) : targetExtent;

  var targetCenter = ol.extent.getCenter(limitedTargetExtent);
  var sourceResolution = ol.reproj.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  var errorThresholdInPixels = ol.DEFAULT_RASTER_REPROJECTION_ERROR_THRESHOLD;

  /**
   * @private
   * @type {!ol.reproj.Triangulation}
   */
  this.triangulation_ = new ol.reproj.Triangulation(
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


  var state = ol.Image.State.LOADED;
  var attributions = [];

  if (this.sourceImage_) {
    state = ol.Image.State.IDLE;
    attributions = this.sourceImage_.getAttributions();
  }

  ol.ImageBase.call(this, targetExtent, targetResolution, this.sourcePixelRatio_,
            state, attributions);
};
ol.inherits(ol.reproj.Image, ol.ImageBase);


/**
 * @inheritDoc
 */
ol.reproj.Image.prototype.disposeInternal = function() {
  if (this.state == ol.Image.State.LOADING) {
    this.unlistenSource_();
  }
  ol.ImageBase.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
ol.reproj.Image.prototype.getImage = function(opt_context) {
  return this.canvas_;
};


/**
 * @return {ol.proj.Projection} Projection.
 */
ol.reproj.Image.prototype.getProjection = function() {
  return this.targetProj_;
};


/**
 * @private
 */
ol.reproj.Image.prototype.reproject_ = function() {
  var sourceState = this.sourceImage_.getState();
  if (sourceState == ol.Image.State.LOADED) {
    var width = ol.extent.getWidth(this.targetExtent_) / this.targetResolution_;
    var height =
        ol.extent.getHeight(this.targetExtent_) / this.targetResolution_;

    this.canvas_ = ol.reproj.render(width, height, this.sourcePixelRatio_,
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
ol.reproj.Image.prototype.load = function() {
  if (this.state == ol.Image.State.IDLE) {
    this.state = ol.Image.State.LOADING;
    this.changed();

    var sourceState = this.sourceImage_.getState();
    if (sourceState == ol.Image.State.LOADED ||
        sourceState == ol.Image.State.ERROR) {
      this.reproject_();
    } else {
      this.sourceListenerKey_ = ol.events.listen(this.sourceImage_,
          ol.events.EventType.CHANGE, function(e) {
            var sourceState = this.sourceImage_.getState();
            if (sourceState == ol.Image.State.LOADED ||
                sourceState == ol.Image.State.ERROR) {
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
ol.reproj.Image.prototype.unlistenSource_ = function() {
  ol.DEBUG && console.assert(this.sourceListenerKey_,
      'this.sourceListenerKey_ should not be null');
  ol.events.unlistenByKey(/** @type {!ol.EventsKey} */ (this.sourceListenerKey_));
  this.sourceListenerKey_ = null;
};
