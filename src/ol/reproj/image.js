goog.provide('ol.reproj.Image');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');
goog.require('ol.extent');
goog.require('ol.proj');
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
 * @param {function(ol.Extent, number, number):ol.ImageBase} getImageFunction
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

  var limitedTargetExtent = goog.isNull(maxTargetExtent) ?
      targetExtent : ol.extent.getIntersection(targetExtent, maxTargetExtent);

  var targetCenter = ol.extent.getCenter(limitedTargetExtent);
  var sourceResolution = ol.reproj.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  var errorThresholdInPixels = ol.DEFAULT_RASTER_REPROJ_ERROR_THRESHOLD;

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

  var srcExtent = this.triangulation_.calculateSourceExtent();

  /**
   * @private
   * @type {ol.ImageBase}
   */
  this.srcImage_ = getImageFunction(srcExtent, sourceResolution, pixelRatio);

  /**
   * @private
   * @type {number}
   */
  this.srcPixelRatio_ =
      !goog.isNull(this.srcImage_) ? this.srcImage_.getPixelRatio() : 1;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.sourceListenerKey_ = null;


  var state = ol.ImageState.LOADED;
  var attributions = [];

  if (!goog.isNull(this.srcImage_)) {
    state = ol.ImageState.IDLE;
    attributions = this.srcImage_.getAttributions();
  }

  goog.base(this, targetExtent, targetResolution, this.srcPixelRatio_,
            state, attributions);
};
goog.inherits(ol.reproj.Image, ol.ImageBase);


/**
 * @inheritDoc
 */
ol.reproj.Image.prototype.disposeInternal = function() {
  if (this.state == ol.ImageState.LOADING) {
    this.unlistenSource_();
  }
  goog.base(this, 'disposeInternal');
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
  var srcState = this.srcImage_.getState();
  if (srcState == ol.ImageState.LOADED) {
    var width = ol.extent.getWidth(this.targetExtent_) / this.targetResolution_;
    var height =
        ol.extent.getHeight(this.targetExtent_) / this.targetResolution_;

    this.canvas_ = ol.reproj.render(width, height, this.srcPixelRatio_,
        this.srcImage_.getResolution(), this.maxSourceExtent_,
        this.targetResolution_, this.targetExtent_, this.triangulation_, [{
          extent: this.srcImage_.getExtent(),
          image: this.srcImage_.getImage()
        }]);
  }
  this.state = srcState;
  this.changed();
};


/**
 * @inheritDoc
 */
ol.reproj.Image.prototype.load = function() {
  if (this.state == ol.ImageState.IDLE) {
    this.state = ol.ImageState.LOADING;
    this.changed();

    var srcState = this.srcImage_.getState();
    if (srcState == ol.ImageState.LOADED ||
        srcState == ol.ImageState.ERROR) {
      this.reproject_();
    } else {
      this.sourceListenerKey_ = this.srcImage_.listen(
          goog.events.EventType.CHANGE, function(e) {
            var srcState = this.srcImage_.getState();
            if (srcState == ol.ImageState.LOADED ||
                srcState == ol.ImageState.ERROR) {
              this.unlistenSource_();
              this.reproject_();
            }
          }, false, this);
      this.srcImage_.load();
    }
  }
};


/**
 * @private
 */
ol.reproj.Image.prototype.unlistenSource_ = function() {
  goog.asserts.assert(!goog.isNull(this.sourceListenerKey_),
      'this.sourceListenerKey_ should not be null');
  goog.events.unlistenByKey(this.sourceListenerKey_);
  this.sourceListenerKey_ = null;
};
