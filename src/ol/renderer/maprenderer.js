goog.provide('ol.RendererType');
goog.provide('ol.renderer.Map');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.dispose');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');
goog.require('ol.style.IconImageCache');
goog.require('ol.vec.Mat4');


/**
 * Available renderers: `'canvas'`, `'dom'` or `'webgl'`.
 * @enum {string}
 * @api stable
 */
ol.RendererType = {
  CANVAS: 'canvas',
  DOM: 'dom',
  WEBGL: 'webgl'
};



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
   * @protected
   * @type {ol.render.IReplayGroup}
   */
  this.replayGroup = null;

  /**
   * @private
   * @type {Object.<string, ol.renderer.Layer>}
   */
  this.layerRenderers_ = {};

};
goog.inherits(ol.renderer.Map, goog.Disposable);


/**
 * @param {olx.FrameState} frameState FrameState.
 * @protected
 */
ol.renderer.Map.prototype.calculateMatrices2D = function(frameState) {
  var viewState = frameState.viewState;
  var coordinateToPixelMatrix = frameState.coordinateToPixelMatrix;
  goog.asserts.assert(!goog.isNull(coordinateToPixelMatrix));
  ol.vec.Mat4.makeTransform2D(coordinateToPixelMatrix,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / viewState.resolution, -1 / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0], -viewState.center[1]);
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
  goog.object.forEach(this.layerRenderers_, goog.dispose);
  goog.base(this, 'disposeInternal');
};


/**
 * @param {ol.Map} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.Map.expireIconCache_ = function(map, frameState) {
  ol.style.IconImageCache.getInstance().expire();
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.Feature, ol.layer.Layer): T} callback Feature
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @param {function(this: U, ol.layer.Layer): boolean} layerFilter Layer filter
 *     function, only layers which are visible and for which this function
 *     returns `true` will be tested for features.  By default, all visible
 *     layers will be tested.
 * @param {U} thisArg2 Value to use as `this` when executing `layerFilter`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.Map.prototype.forEachFeatureAtPixel =
    function(coordinate, frameState, callback, thisArg,
        layerFilter, thisArg2) {
  var result;
  var viewState = frameState.viewState;
  var viewResolution = viewState.resolution;
  var viewRotation = viewState.rotation;
  if (!goog.isNull(this.replayGroup)) {
    /** @type {Object.<string, boolean>} */
    var features = {};
    result = this.replayGroup.forEachGeometryAtPixel(viewResolution,
        viewRotation, coordinate, {},
        /**
         * @param {ol.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          goog.asserts.assert(goog.isDef(feature));
          var key = goog.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, null);
          }
        });
    if (result) {
      return result;
    }
  }
  var layerStates = this.map_.getLayerGroup().getLayerStatesArray();
  var numLayers = layerStates.length;
  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (ol.layer.Layer.visibleAtResolution(layerState, viewResolution) &&
        layerFilter.call(thisArg2, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      result = layerRenderer.forEachFeatureAtPixel(
          coordinate, frameState, callback, thisArg);
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
 * @return {string} Type
 */
ol.renderer.Map.prototype.getType = goog.abstractMethod;


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
 * @param {?olx.FrameState} frameState Frame state.
 */
ol.renderer.Map.prototype.renderFrame = goog.nullFunction;


/**
 * @param {ol.Map} map Map.
 * @param {olx.FrameState} frameState Frame state.
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
 * @param {olx.FrameState} frameState Frame state.
 * @protected
 */
ol.renderer.Map.prototype.scheduleExpireIconCache = function(frameState) {
  frameState.postRenderFunctions.push(ol.renderer.Map.expireIconCache_);
};


/**
 * @param {!olx.FrameState} frameState Frame state.
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
