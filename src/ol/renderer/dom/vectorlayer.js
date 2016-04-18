goog.provide('ol.renderer.dom.VectorLayer');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.layer.Vector} vectorLayer Vector layer.
 */
ol.renderer.dom.VectorLayer = function(vectorLayer) {

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();

  var target = this.context_.canvas;
  // Bootstrap sets the style max-width: 100% for all images, which breaks
  // prevents the image from being displayed in FireFox.  Workaround by
  // overriding the max-width style.
  target.style.maxWidth = 'none';
  target.style.position = 'absolute';

  ol.renderer.dom.Layer.call(this, vectorLayer, target);

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.renderedResolution_ = NaN;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {function(ol.Feature, ol.Feature): number|null}
   */
  this.renderedRenderOrder_ = null;

  /**
   * @private
   * @type {ol.render.canvas.ReplayGroup}
   */
  this.replayGroup_ = null;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.elementTransform_ = ol.transform.create();

};
ol.inherits(ol.renderer.dom.VectorLayer, ol.renderer.dom.Layer);


/**
 * @inheritDoc
 */
ol.renderer.dom.VectorLayer.prototype.clearFrame = function() {
  // Clear the canvas
  var canvas = this.context_.canvas;
  canvas.width = canvas.width;
  this.renderedRevision_ = 0;
};


/**
 * @inheritDoc
 */
ol.renderer.dom.VectorLayer.prototype.composeFrame = function(frameState, layerState) {
  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewRotation = viewState.rotation;
  var viewResolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;
  var viewWidth = frameState.size[0];
  var viewHeight = frameState.size[1];
  var imageWidth = viewWidth * pixelRatio;
  var imageHeight = viewHeight * pixelRatio;

  var transform = ol.transform.compose(this.transform_,
      pixelRatio * viewWidth / 2, pixelRatio * viewHeight / 2,
      pixelRatio / viewResolution, -pixelRatio / viewResolution,
      -viewRotation,
      -viewCenter[0], -viewCenter[1]);

  var context = this.context_;

  // Clear the canvas and set the correct size
  context.canvas.width = imageWidth;
  context.canvas.height = imageHeight;

  var elementTransform = ol.transform.reset(this.elementTransform_);
  ol.transform.scale(elementTransform, 1 / pixelRatio, 1 / pixelRatio);
  ol.transform.translate(elementTransform,
      -(imageWidth - viewWidth) / 2 * pixelRatio,
      -(imageHeight - viewHeight) / 2 * pixelRatio);
  ol.dom.transformElement2D(context.canvas, elementTransform, 6);

  this.dispatchEvent_(ol.render.EventType.PRECOMPOSE, frameState, transform);

  var replayGroup = this.replayGroup_;

  if (replayGroup && !replayGroup.isEmpty()) {

    context.globalAlpha = layerState.opacity;
    replayGroup.replay(context, pixelRatio, transform, viewRotation,
        layerState.managed ? frameState.skippedFeatureUids : {});

    this.dispatchEvent_(ol.render.EventType.RENDER, frameState, transform);
  }

  this.dispatchEvent_(ol.render.EventType.POSTCOMPOSE, frameState, transform);
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform} transform Transform.
 * @private
 */
ol.renderer.dom.VectorLayer.prototype.dispatchEvent_ = function(type, frameState, transform) {
  var context = this.context_;
  var layer = this.getLayer();
  if (layer.hasListener(type)) {
    var render = new ol.render.canvas.Immediate(
        context, frameState.pixelRatio, frameState.extent, transform,
        frameState.viewState.rotation);
    var event = new ol.render.Event(type, render, frameState, context, null);
    layer.dispatchEvent(event);
  }
};


/**
 * @inheritDoc
 */
ol.renderer.dom.VectorLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  if (!this.replayGroup_) {
    return undefined;
  } else {
    var resolution = frameState.viewState.resolution;
    var rotation = frameState.viewState.rotation;
    var layer = this.getLayer();
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(coordinate, resolution,
        rotation, {},
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          var key = ol.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        });
  }
};


/**
 * Handle changes in image style state.
 * @param {ol.events.Event} event Image style change event.
 * @private
 */
ol.renderer.dom.VectorLayer.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
ol.renderer.dom.VectorLayer.prototype.prepareFrame = function(frameState, layerState) {

  var vectorLayer = /** @type {ol.layer.Vector} */ (this.getLayer());
  var vectorSource = vectorLayer.getSource();

  this.updateAttributions(
      frameState.attributions, vectorSource.getAttributions());
  this.updateLogos(frameState, vectorSource);

  var animating = frameState.viewHints[ol.View.Hint.ANIMATING];
  var interacting = frameState.viewHints[ol.View.Hint.INTERACTING];
  var updateWhileAnimating = vectorLayer.getUpdateWhileAnimating();
  var updateWhileInteracting = vectorLayer.getUpdateWhileInteracting();

  if (!this.dirty_ && (!updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)) {
    return true;
  }

  var frameStateExtent = frameState.extent;
  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;
  var vectorLayerRevision = vectorLayer.getRevision();
  var vectorLayerRenderBuffer = vectorLayer.getRenderBuffer();
  var vectorLayerRenderOrder = vectorLayer.getRenderOrder();

  if (vectorLayerRenderOrder === undefined) {
    vectorLayerRenderOrder = ol.renderer.vector.defaultOrder;
  }

  var extent = ol.extent.buffer(frameStateExtent,
      vectorLayerRenderBuffer * resolution);

  if (!this.dirty_ &&
      this.renderedResolution_ == resolution &&
      this.renderedRevision_ == vectorLayerRevision &&
      this.renderedRenderOrder_ == vectorLayerRenderOrder &&
      ol.extent.containsExtent(this.renderedExtent_, extent)) {
    return true;
  }

  this.replayGroup_ = null;

  this.dirty_ = false;

  var replayGroup =
      new ol.render.canvas.ReplayGroup(
          ol.renderer.vector.getTolerance(resolution, pixelRatio), extent,
          resolution, vectorSource.getOverlaps(), vectorLayer.getRenderBuffer());
  vectorSource.loadFeatures(extent, resolution, projection);
  /**
   * @param {ol.Feature} feature Feature.
   * @this {ol.renderer.dom.VectorLayer}
   */
  var renderFeature = function(feature) {
    var styles;
    var styleFunction = feature.getStyleFunction();
    if (styleFunction) {
      styles = styleFunction.call(feature, resolution);
    } else {
      styleFunction = vectorLayer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
    }
    if (styles) {
      var dirty = this.renderFeature(
          feature, resolution, pixelRatio, styles, replayGroup);
      this.dirty_ = this.dirty_ || dirty;
    }
  };
  if (vectorLayerRenderOrder) {
    /** @type {Array.<ol.Feature>} */
    var features = [];
    vectorSource.forEachFeatureInExtent(extent,
        /**
         * @param {ol.Feature} feature Feature.
         */
        function(feature) {
          features.push(feature);
        }, this);
    features.sort(vectorLayerRenderOrder);
    features.forEach(renderFeature, this);
  } else {
    vectorSource.forEachFeatureInExtent(extent, renderFeature, this);
  }
  replayGroup.finish();

  this.renderedResolution_ = resolution;
  this.renderedRevision_ = vectorLayerRevision;
  this.renderedRenderOrder_ = vectorLayerRenderOrder;
  this.renderedExtent_ = extent;
  this.replayGroup_ = replayGroup;

  return true;
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {(ol.style.Style|Array.<ol.style.Style>)} styles The style or array of
 *     styles.
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
ol.renderer.dom.VectorLayer.prototype.renderFeature = function(feature, resolution, pixelRatio, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var loading = false;
  if (Array.isArray(styles)) {
    for (var i = 0, ii = styles.length; i < ii; ++i) {
      loading = ol.renderer.vector.renderFeature(
          replayGroup, feature, styles[i],
          ol.renderer.vector.getSquaredTolerance(resolution, pixelRatio),
          this.handleStyleImageChange_, this) || loading;
    }
  } else {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles,
        ol.renderer.vector.getSquaredTolerance(resolution, pixelRatio),
        this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};
