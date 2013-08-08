goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dispose');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.FrameState');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 */
ol.renderer.Map = function(container, map) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

  /**
   * @private
   * @type {Object.<string, ol.renderer.Layer>}
   */
  this.layerRenderers_ = {};

};
goog.inherits(ol.renderer.Map, goog.Disposable);


/**
 * @param {ol.FrameState} frameState FrameState.
 * @protected
 */
ol.renderer.Map.prototype.calculateMatrices2D = function(frameState) {

  var view2DState = frameState.view2DState;
  var coordinateToPixelMatrix = frameState.coordinateToPixelMatrix;

  goog.vec.Mat4.makeIdentity(coordinateToPixelMatrix);
  goog.vec.Mat4.translate(coordinateToPixelMatrix,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      0);
  goog.vec.Mat4.scale(coordinateToPixelMatrix,
      1 / view2DState.resolution,
      -1 / view2DState.resolution,
      1);
  goog.vec.Mat4.rotateZ(coordinateToPixelMatrix,
      -view2DState.rotation);
  goog.vec.Mat4.translate(coordinateToPixelMatrix,
      -view2DState.center[0],
      -view2DState.center[1],
      0);

  var inverted = goog.vec.Mat4.invert(
      coordinateToPixelMatrix, frameState.pixelToCoordinateMatrix);
  goog.asserts.assert(inverted);

};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 * @return {ol.renderer.Layer} layerRenderer Layer renderer.
 */
ol.renderer.Map.prototype.createLayerRenderer = function(layer) {
  return new ol.renderer.Layer(this, layer);
};


/**
 * @inheritDoc
 */
ol.renderer.Map.prototype.disposeInternal = function() {
  goog.object.forEach(this.layerRenderers_, function(layerRenderer) {
    goog.dispose(layerRenderer);
  });
  goog.base(this, 'disposeInternal');
};


/**
 * @return {Element} Canvas.
 */
ol.renderer.Map.prototype.getCanvas = goog.functions.NULL;


/**
 * @param {ol.Pixel} pixel Pixel coordinate relative to the map viewport.
 * @param {Array.<ol.layer.Layer>} layers Layers to query.
 * @param {function(Array.<Array.<string|undefined>>)} success Callback for
 *     successful queries. The passed argument is the resulting feature
 *     information.  Layers that are able to provide attribute data will put
 *     ol.Feature instances, other layers will put a string which can either
 *     be plain text or markup.
 * @param {function()=} opt_error Callback for unsuccessful
 *     queries.
 */
ol.renderer.Map.prototype.getFeatureInfoForPixel =
    function(pixel, layers, success, opt_error) {
  var numLayers = layers.length;
  var featureInfo = new Array(numLayers);
  var callback = function(layerFeatureInfo, layer) {
    featureInfo[goog.array.indexOf(layers, layer)] = layerFeatureInfo;
    --numLayers;
    if (!numLayers) {
      success(featureInfo);
    }
  };

  var layer, layerRenderer;
  for (var i = 0; i < numLayers; ++i) {
    layer = layers[i];
    layerRenderer = this.getLayerRenderer(layer);
    if (goog.isFunction(layerRenderer.getFeatureInfoForPixel)) {
      layerRenderer.getFeatureInfoForPixel(pixel, callback, opt_error);
    } else {
      --numLayers;
    }
  }
};


/**
 * @param {ol.Pixel} pixel Pixel coordinate relative to the map viewport.
 * @param {Array.<ol.layer.Layer>} layers Layers to query.
 * @param {function(Array.<Array.<ol.Feature|undefined>>)} success Callback for
 *     successful queries. The passed argument is the resulting feature
 *     information.  Layers that are able to provide attribute data will put
 *     ol.Feature instances, other layers will put a string which can either
 *     be plain text or markup.
 * @param {function()=} opt_error Callback for unsuccessful
 *     queries.
 */
ol.renderer.Map.prototype.getFeaturesForPixel =
    function(pixel, layers, success, opt_error) {
  var numLayers = layers.length;
  var features = new Array(numLayers);
  var callback = function(layerFeatures, layer) {
    features[goog.array.indexOf(layers, layer)] = layerFeatures;
    --numLayers;
    if (!numLayers) {
      success(features);
    }
  };

  var layer, layerRenderer;
  for (var i = 0; i < numLayers; ++i) {
    layer = layers[i];
    layerRenderer = this.getLayerRenderer(layer);
    if (goog.isFunction(layerRenderer.getFeaturesForPixel)) {
      layerRenderer.getFeaturesForPixel(pixel, callback, opt_error);
    } else {
      --numLayers;
    }
  }
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 * @return {ol.renderer.Layer} Layer renderer.
 */
ol.renderer.Map.prototype.getLayerRenderer = function(layer) {
  var layerKey = goog.getUid(layer).toString();
  if (layerKey in this.layerRenderers_) {
    return this.layerRenderers_[layerKey];
  } else {
    var layerRenderer = this.createLayerRenderer(layer);
    this.layerRenderers_[layerKey] = layerRenderer;
    return layerRenderer;
  }
};


/**
 * @param {string} layerKey Layer key.
 * @protected
 * @return {ol.renderer.Layer} Layer renderer.
 */
ol.renderer.Map.prototype.getLayerRendererByKey = function(layerKey) {
  goog.asserts.assert(layerKey in this.layerRenderers_);
  return this.layerRenderers_[layerKey];
};


/**
 * @protected
 * @return {Object.<number, ol.renderer.Layer>} Layer renderers.
 */
ol.renderer.Map.prototype.getLayerRenderers = function() {
  return this.layerRenderers_;
};


/**
 * @return {ol.Map} Map.
 */
ol.renderer.Map.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {string} layerKey Layer key.
 * @return {ol.renderer.Layer} Layer renderer.
 * @private
 */
ol.renderer.Map.prototype.removeLayerRendererByKey_ = function(layerKey) {
  goog.asserts.assert(layerKey in this.layerRenderers_);
  var layerRenderer = this.layerRenderers_[layerKey];
  delete this.layerRenderers_[layerKey];
  return layerRenderer;
};


/**
 * Render.
 * @param {?ol.FrameState} frameState Frame state.
 */
ol.renderer.Map.prototype.renderFrame = goog.nullFunction;


/**
 * @param {ol.Map} map Map.
 * @param {ol.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.Map.prototype.removeUnusedLayerRenderers_ =
    function(map, frameState) {
  var layerKey;
  for (layerKey in this.layerRenderers_) {
    if (goog.isNull(frameState) || !(layerKey in frameState.layerStates)) {
      goog.dispose(this.removeLayerRendererByKey_(layerKey));
    }
  }
};


/**
 * @param {!ol.FrameState} frameState Frame state.
 * @protected
 */
ol.renderer.Map.prototype.scheduleRemoveUnusedLayerRenderers =
    function(frameState) {
  var layerKey;
  for (layerKey in this.layerRenderers_) {
    if (!(layerKey in frameState.layerStates)) {
      frameState.postRenderFunctions.push(
          goog.bind(this.removeUnusedLayerRenderers_, this));
      return;
    }
  }
};
