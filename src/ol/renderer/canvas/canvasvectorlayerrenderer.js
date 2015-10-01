goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.Vector');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Vector} vectorLayer Vector layer.
 */
ol.renderer.canvas.VectorLayer = function(vectorLayer) {

  goog.base(this, vectorLayer);

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
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();

};
goog.inherits(ol.renderer.canvas.VectorLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.composeFrame =
    function(frameState, layerState, context) {

  var extent = frameState.extent;
  var pixelRatio = frameState.pixelRatio;
  var skippedFeatureUids = layerState.managed ?
      frameState.skippedFeatureUids : {};
  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var rotation = viewState.rotation;
  var projectionExtent = projection.getExtent();
  var vectorSource = this.getLayer().getSource();
  goog.asserts.assertInstanceof(vectorSource, ol.source.Vector);

  var transform = this.getTransform(frameState, 0);

  this.dispatchPreComposeEvent(context, frameState, transform);

  var replayGroup = this.replayGroup_;
  if (replayGroup && !replayGroup.isEmpty()) {
    var layer = this.getLayer();
    var replayContext;
    if (layer.hasListener(ol.render.EventType.RENDER)) {
      // resize and clear
      this.context_.canvas.width = context.canvas.width;
      this.context_.canvas.height = context.canvas.height;
      replayContext = this.context_;
    } else {
      replayContext = context;
    }
    // for performance reasons, context.save / context.restore is not used
    // to save and restore the transformation matrix and the opacity.
    // see http://jsperf.com/context-save-restore-versus-variable
    var alpha = replayContext.globalAlpha;
    replayContext.globalAlpha = layerState.opacity;

    replayGroup.replay(replayContext, pixelRatio, transform, rotation,
        skippedFeatureUids);
    if (vectorSource.getWrapX() && projection.canWrapX() &&
        !ol.extent.containsExtent(projectionExtent, extent)) {
      var startX = extent[0];
      var worldWidth = ol.extent.getWidth(projectionExtent);
      var world = 0;
      var offsetX;
      while (startX < projectionExtent[0]) {
        --world;
        offsetX = worldWidth * world;
        transform = this.getTransform(frameState, offsetX);
        replayGroup.replay(replayContext, pixelRatio, transform, rotation,
            skippedFeatureUids);
        startX += worldWidth;
      }
      world = 0;
      startX = extent[2];
      while (startX > projectionExtent[2]) {
        ++world;
        offsetX = worldWidth * world;
        transform = this.getTransform(frameState, offsetX);
        replayGroup.replay(replayContext, pixelRatio, transform, rotation,
            skippedFeatureUids);
        startX -= worldWidth;
      }
      // restore original transform for render and compose events
      transform = this.getTransform(frameState, 0);
    }

    if (replayContext != context) {
      this.dispatchRenderEvent(replayContext, frameState, transform);
      context.drawImage(replayContext.canvas, 0, 0);
    }
    replayContext.globalAlpha = alpha;
  }

  this.dispatchPostComposeEvent(context, frameState, transform);

};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.forEachFeatureAtCoordinate =
    function(coordinate, frameState, callback, thisArg) {
  if (!this.replayGroup_) {
    return undefined;
  } else {
    var resolution = frameState.viewState.resolution;
    var rotation = frameState.viewState.rotation;
    var layer = this.getLayer();
    var layerState = frameState.layerStates[goog.getUid(layer)];
    /** @type {Object.<string, boolean>} */
    var features = {};
    return this.replayGroup_.forEachFeatureAtCoordinate(coordinate, resolution,
        rotation, layerState.managed ? frameState.skippedFeatureUids : {},
        /**
         * @param {ol.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          goog.asserts.assert(feature !== undefined, 'received a feature');
          var key = goog.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        });
  }
};


/**
 * Handle changes in image style state.
 * @param {goog.events.Event} event Image style change event.
 * @private
 */
ol.renderer.canvas.VectorLayer.prototype.handleStyleImageChange_ =
    function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.prepareFrame =
    function(frameState, layerState) {

  var vectorLayer = /** @type {ol.layer.Vector} */ (this.getLayer());
  goog.asserts.assertInstanceof(vectorLayer, ol.layer.Vector,
      'layer is an instance of ol.layer.Vector');
  var vectorSource = vectorLayer.getSource();

  this.updateAttributions(
      frameState.attributions, vectorSource.getAttributions());
  this.updateLogos(frameState, vectorSource);

  var animating = frameState.viewHints[ol.ViewHint.ANIMATING];
  var interacting = frameState.viewHints[ol.ViewHint.INTERACTING];
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
  var projectionExtent = viewState.projection.getExtent();

  if (vectorSource.getWrapX() && viewState.projection.canWrapX() &&
      !ol.extent.containsExtent(projectionExtent, frameState.extent)) {
    // For the replay group, we need an extent that intersects the real world
    // (-180° to +180°). To support geometries in a coordinate range from -540°
    // to +540°, we add at least 1 world width on each side of the projection
    // extent. If the viewport is wider than the world, we need to add half of
    // the viewport width to make sure we cover the whole viewport.
    var worldWidth = ol.extent.getWidth(projectionExtent);
    var buffer = Math.max(ol.extent.getWidth(extent) / 2, worldWidth);
    extent[0] = projectionExtent[0] - buffer;
    extent[2] = projectionExtent[2] + buffer;
  }

  if (!this.dirty_ &&
      this.renderedResolution_ == resolution &&
      this.renderedRevision_ == vectorLayerRevision &&
      this.renderedRenderOrder_ == vectorLayerRenderOrder &&
      ol.extent.containsExtent(this.renderedExtent_, extent)) {
    return true;
  }

  // FIXME dispose of old replayGroup in post render
  goog.dispose(this.replayGroup_);
  this.replayGroup_ = null;

  this.dirty_ = false;

  var replayGroup =
      new ol.render.canvas.ReplayGroup(
          ol.renderer.vector.getTolerance(resolution, pixelRatio), extent,
          resolution, vectorLayer.getRenderBuffer());
  vectorSource.loadFeatures(extent, resolution, projection);
  var renderFeature =
      /**
       * @param {ol.Feature} feature Feature.
       * @this {ol.renderer.canvas.VectorLayer}
       */
      function(feature) {
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
    vectorSource.forEachFeatureInExtentAtResolution(extent, resolution,
        /**
         * @param {ol.Feature} feature Feature.
         */
        function(feature) {
          features.push(feature);
        }, this);
    goog.array.sort(features, vectorLayerRenderOrder);
    features.forEach(renderFeature, this);
  } else {
    vectorSource.forEachFeatureInExtentAtResolution(
        extent, resolution, renderFeature, this);
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
 * @param {Array.<ol.style.Style>} styles Array of styles
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
ol.renderer.canvas.VectorLayer.prototype.renderFeature =
    function(feature, resolution, pixelRatio, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var i, ii, loading = false;
  for (i = 0, ii = styles.length; i < ii; ++i) {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles[i],
        ol.renderer.vector.getSquaredTolerance(resolution, pixelRatio),
        this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};
