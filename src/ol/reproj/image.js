goog.provide('ol.reproj.Image');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.reproj');
goog.require('ol.reproj.Triangulation');



/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.proj.Projection} sourceProj
 * @param {ol.proj.Projection} targetProj
 * @param {ol.Extent} targetExtent
 * @param {number} targetResolution
 * @param {number} pixelRatio
 * @param {function(ol.Extent, number, number):ol.ImageBase} getImageFunction
 */
ol.reproj.Image = function(sourceProj, targetProj,
    targetExtent, targetResolution, pixelRatio, getImageFunction) {

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

  var width = ol.extent.getWidth(targetExtent) / targetResolution;
  var height = ol.extent.getHeight(targetExtent) / targetResolution;

  /**
   * @private
   * @type {number}
   */
  this.srcPixelRatio_ =
      !goog.isNull(this.srcImage_) ? this.srcImage_.getPixelRatio() : 1;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D(
      Math.round(this.srcPixelRatio_ * width),
      Math.round(this.srcPixelRatio_ * height));
  this.context_.imageSmoothingEnabled = true;
  this.context_.scale(this.srcPixelRatio_, this.srcPixelRatio_);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = this.context_.canvas;

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
 * @private
 */
ol.reproj.Image.prototype.reproject_ = function() {
  var srcState = this.srcImage_.getState();
  if (srcState == ol.ImageState.LOADED) {
    // render the reprojected content
    ol.reproj.renderTriangles(this.context_,
        this.srcImage_.getResolution(), this.maxSourceExtent_,
        this.targetResolution_, this.targetExtent_, this.triangulation_, [{
          extent: this.srcImage_.getExtent(),
          image: this.srcImage_.getImage()
        }], this.srcPixelRatio_);
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
