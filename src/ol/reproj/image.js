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
goog.require('ol.reproj.triangulation');



/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.proj.Projection} sourceProj
 * @param {ol.proj.Projection} targetProj
 * @param {ol.Extent} targetExtent
 * @param {number} targetResolution
 * @param {number} pixelRatio
 * @param {function(ol.Extent, number, number, ol.proj.Projection) :
 *             ol.ImageBase} getImageFunction
 */
ol.reproj.Image = function(sourceProj, targetProj,
    targetExtent, targetResolution, pixelRatio, getImageFunction) {

  var width = ol.extent.getWidth(targetExtent) / targetResolution;
  var height = ol.extent.getHeight(targetExtent) / targetResolution;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D(width, height);
  this.context_.imageSmoothingEnabled = true;

  if (goog.DEBUG) {
    this.context_.fillStyle = 'rgba(255,0,0,0.1)';
    this.context_.fillRect(0, 0, width, height);
  }

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = this.context_.canvas;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.maxSourceExtent_ = sourceProj.getExtent();
  var maxTargetExtent = targetProj.getExtent();


  /**
   * @private
   * @type {!ol.reproj.Triangulation}
   */
  this.triangulation_ = ol.reproj.triangulation.createForExtent(
      targetExtent, sourceProj, targetProj,
      maxTargetExtent, this.maxSourceExtent_);

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

  var srcExtent = ol.reproj.triangulation.getSourceExtent(
      this.triangulation_, sourceProj);

  var targetCenter = ol.extent.getCenter(targetExtent);
  var sourceResolution = ol.reproj.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  /**
   * @private
   * @type {ol.ImageBase}
   */
  this.srcImage_ = getImageFunction(srcExtent, sourceResolution,
                                    pixelRatio, sourceProj);

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

  goog.base(this, targetExtent, targetResolution, pixelRatio,
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
