goog.provide('ol.source.ImageVector');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.vec.Mat4');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.vector');
goog.require('ol.source.ImageCanvas');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');
goog.require('ol.vec.Mat4');



/**
 * @classdesc
 * An image source whose images are canvas elements into which vector features
 * read from a vector source (`ol.source.Vector`) are drawn. An
 * `ol.source.ImageVector` object is to be used as the `source` of an image
 * layer (`ol.layer.Image`). Image layers are rotated, scaled, and translated,
 * as opposed to being re-rendered, during animations and interactions. So, like
 * any other image layer, an image layer configured with an
 * `ol.source.ImageVector` will exhibit this behaviour. This is in contrast to a
 * vector layer, where vector features are re-drawn during animations and
 * interactions.
 *
 * @constructor
 * @extends {ol.source.ImageCanvas}
 * @param {olx.source.ImageVectorOptions} options Options.
 * @api
 */
ol.source.ImageVector = function(options) {

  /**
   * @private
   * @type {ol.source.Vector}
   */
  this.source_ = options.source;

  /**
   * @private
   * @type {!ol.style.StyleFunction}
   */
  this.styleFunction_ = goog.isDefAndNotNull(options.style) ?
      ol.style.createStyleFunction(options.style) :
      ol.style.defaultStyleFunction;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.canvasContext_ = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {ol.Size}
   */
  this.canvasSize_ = [0, 0];

  /**
   * @private
   * @type {ol.render.canvas.ReplayGroup}
   */
  this.replayGroup_ = null;

  goog.base(this, {
    attributions: options.attributions,
    canvasFunction: goog.bind(this.canvasFunctionInternal_, this),
    logo: options.logo,
    projection: options.projection,
    ratio: options.ratio,
    resolutions: options.resolutions,
    state: this.source_.getState()
  });

  goog.events.listen(this.source_, goog.events.EventType.CHANGE,
      this.handleSourceChange_, undefined, this);

};
goog.inherits(ol.source.ImageVector, ol.source.ImageCanvas);


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Size} size Size.
 * @param {ol.proj.Projection} projection Projection;
 * @return {HTMLCanvasElement} Canvas element.
 * @private
 */
ol.source.ImageVector.prototype.canvasFunctionInternal_ =
    function(extent, resolution, pixelRatio, size, projection) {

  var replayGroup = new ol.render.canvas.ReplayGroup(
      ol.renderer.vector.getTolerance(resolution, pixelRatio), extent,
      resolution);

  var loading = false;
  this.source_.forEachFeatureInExtentAtResolution(extent, resolution,
      /**
       * @param {ol.Feature} feature Feature.
       */
      function(feature) {
        loading = loading ||
            this.renderFeature_(feature, resolution, pixelRatio, replayGroup);
      }, this);
  replayGroup.finish();

  if (loading) {
    return null;
  }

  if (this.canvasSize_[0] != size[0] || this.canvasSize_[1] != size[1]) {
    this.canvasContext_.canvas.width = size[0];
    this.canvasContext_.canvas.height = size[1];
    this.canvasSize_[0] = size[0];
    this.canvasSize_[1] = size[1];
  } else {
    this.canvasContext_.clearRect(0, 0, size[0], size[1]);
  }

  var transform = this.getTransform_(ol.extent.getCenter(extent),
      resolution, pixelRatio, size);
  replayGroup.replay(this.canvasContext_, extent, pixelRatio, transform, 0,
      {});

  this.replayGroup_ = replayGroup;

  return this.canvasContext_.canvas;
};


/**
 * @inheritDoc
 */
ol.source.ImageVector.prototype.forEachFeatureAtPixel = function(
    extent, resolution, rotation, coordinate, skippedFeatureUids, callback) {
  if (goog.isNull(this.replayGroup_)) {
    return undefined;
  } else {
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachGeometryAtPixel(
        extent, resolution, 0, coordinate, skippedFeatureUids,
        /**
         * @param {ol.geom.Geometry} geometry Geometry.
         * @param {Object} data Data.
         * @return {?} Callback result.
         */
        function(geometry, data) {
          var feature = /** @type {ol.Feature} */ (data);
          goog.asserts.assert(goog.isDef(feature));
          var key = goog.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback(feature);
          }
        });
  }
};


/**
 * @return {ol.source.Vector} Source.
 * @api
 */
ol.source.ImageVector.prototype.getSource = function() {
  return this.source_;
};


/**
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Size} size Size.
 * @return {!goog.vec.Mat4.Number} Transform.
 * @private
 */
ol.source.ImageVector.prototype.getTransform_ =
    function(center, resolution, pixelRatio, size) {
  return ol.vec.Mat4.makeTransform2D(this.transform_,
      size[0] / 2, size[1] / 2,
      pixelRatio / resolution, -pixelRatio / resolution,
      0,
      -center[0], -center[1]);
};


/**
 * Handle changes in image style state.
 * @param {goog.events.Event} event Image style change event.
 * @private
 */
ol.source.ImageVector.prototype.handleImageChange_ =
    function(event) {
  this.dispatchChangeEvent();
};


/**
 * @private
 */
ol.source.ImageVector.prototype.handleSourceChange_ = function() {
  // setState will trigger a CHANGE event, so we always rely
  // change events by calling setState.
  this.setState(this.source_.getState());
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 * @private
 */
ol.source.ImageVector.prototype.renderFeature_ =
    function(feature, resolution, pixelRatio, replayGroup) {
  var styles = this.styleFunction_(feature, resolution);
  if (!goog.isDefAndNotNull(styles)) {
    return false;
  }
  var i, ii, loading = false;
  for (i = 0, ii = styles.length; i < ii; ++i) {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles[i],
        ol.renderer.vector.getSquaredTolerance(resolution, pixelRatio),
        feature, this.handleImageChange_, this) || loading;
  }
  return loading;
};
