goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.dispose');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.FrameState');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {Element} container Container.
 * @param {ol.Map} map Map.
 * @suppress {checkStructDictInheritance}
 * @struct
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
  goog.asserts.assert(!goog.isNull(coordinateToPixelMatrix));
  ol.vec.Mat4.makeTransform2D(coordinateToPixelMatrix,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / view2DState.resolution, -1 / view2DState.resolution,
      -view2DState.rotation,
      -view2DState.center[0], -view2DState.center[1]);
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
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, ol.Feature, ol.layer.Layer): T} callback Feature
 *     callback.
 * @param {S=} opt_obj Scope for feature callback.
 * @param {function(this: U, ol.layer.Layer): boolean=} opt_layerFunction Layer
 *     function.
 * @param {U=} opt_obj2 Scope for layer function.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.Map.prototype.forEachFeatureAtPixel =
    function(pixel, callback, opt_obj, opt_layerFunction, opt_obj2) {
  var layerFunction = goog.isDef(opt_layerFunction) ?
      opt_layerFunction : goog.functions.TRUE;
  var layersArray = this.map_.getLayerGroup().getLayersArray();
  var i;
  for (i = layersArray.length - 1; i >= 0; --i) {
    var layer = layersArray[i];
    if (layer.getVisible() && layerFunction.call(opt_obj2, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      var result =
          layerRenderer.forEachFeatureAtPixel(pixel, callback, opt_obj);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
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
