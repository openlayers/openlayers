goog.provide('ol.renderer.Map');

goog.require('ol');
goog.require('ol.Disposable');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.functions');
goog.require('ol.layer.Layer');
goog.require('ol.plugins');
goog.require('ol.style');
goog.require('ol.transform');


/**
 * @constructor
 * @abstract
 * @extends {ol.Disposable}
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @struct
 */
ol.renderer.Map = function(container, map) {

  ol.Disposable.call(this);


  /**
   * @private
   * @type {ol.PluggableMap}
   */
  this.map_ = map;

  /**
   * @private
   * @type {Object.<string, ol.renderer.Layer>}
   */
  this.layerRenderers_ = {};

  /**
   * @private
   * @type {Object.<string, ol.EventsKey>}
   */
  this.layerRendererListeners_ = {};

};
ol.inherits(ol.renderer.Map, ol.Disposable);


/**
 * @param {olx.FrameState} frameState FrameState.
 * @protected
 */
ol.renderer.Map.prototype.calculateMatrices2D = function(frameState) {
  var viewState = frameState.viewState;
  var coordinateToPixelTransform = frameState.coordinateToPixelTransform;
  var pixelToCoordinateTransform = frameState.pixelToCoordinateTransform;

  ol.transform.compose(coordinateToPixelTransform,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / viewState.resolution, -1 / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0], -viewState.center[1]);

  ol.transform.invert(
      ol.transform.setFromArray(pixelToCoordinateTransform, coordinateToPixelTransform));
};


/**
 * @inheritDoc
 */
ol.renderer.Map.prototype.disposeInternal = function() {
  for (var id in this.layerRenderers_) {
    this.layerRenderers_[id].dispose();
  }
};


/**
 * @param {ol.PluggableMap} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.Map.expireIconCache_ = function(map, frameState) {
  var cache = ol.style.iconImageCache;
  cache.expire();
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {function(this: S, (ol.Feature|ol.render.Feature),
 *     ol.layer.Layer): T} callback Feature callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @param {function(this: U, ol.layer.Layer): boolean} layerFilter Layer filter
 *     function, only layers which are visible and for which this function
 *     returns `true` will be tested for features.  By default, all visible
 *     layers will be tested.
 * @param {U} thisArg2 Value to use as `this` when executing `layerFilter`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.Map.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg,
    layerFilter, thisArg2) {
  var result;
  var viewState = frameState.viewState;
  var viewResolution = viewState.resolution;

  /**
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   * @param {ol.layer.Layer} layer Layer.
   * @return {?} Callback result.
   */
  function forEachFeatureAtCoordinate(feature, layer) {
    var key = ol.getUid(feature).toString();
    var managed = frameState.layerStates[ol.getUid(layer)].managed;
    if (!(key in frameState.skippedFeatureUids && !managed)) {
      return callback.call(thisArg, feature, managed ? layer : null);
    }
  }

  var projection = viewState.projection;

  var translatedCoordinate = coordinate;
  if (projection.canWrapX()) {
    var projectionExtent = projection.getExtent();
    var worldWidth = ol.extent.getWidth(projectionExtent);
    var x = coordinate[0];
    if (x < projectionExtent[0] || x > projectionExtent[2]) {
      var worldsAway = Math.ceil((projectionExtent[0] - x) / worldWidth);
      translatedCoordinate = [x + worldWidth * worldsAway, coordinate[1]];
    }
  }

  var layerStates = frameState.layerStatesArray;
  var numLayers = layerStates.length;
  var i;
  for (i = numLayers - 1; i >= 0; --i) {
    var layerState = layerStates[i];
    var layer = layerState.layer;
    if (ol.layer.Layer.visibleAtResolution(layerState, viewResolution) &&
        layerFilter.call(thisArg2, layer)) {
      var layerRenderer = this.getLayerRenderer(layer);
      if (layer.getSource()) {
        result = layerRenderer.forEachFeatureAtCoordinate(
            layer.getSource().getWrapX() ? translatedCoordinate : coordinate,
            frameState, hitTolerance, forEachFeatureAtCoordinate, thisArg);
      }
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};


/**
 * @abstract
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
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
ol.renderer.Map.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg,
    layerFilter, thisArg2) {};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {function(this: U, ol.layer.Layer): boolean} layerFilter Layer filter
 *     function, only layers which are visible and for which this function
 *     returns `true` will be tested for features.  By default, all visible
 *     layers will be tested.
 * @param {U} thisArg Value to use as `this` when executing `layerFilter`.
 * @return {boolean} Is there a feature at the given coordinate?
 * @template U
 */
ol.renderer.Map.prototype.hasFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, layerFilter, thisArg) {
  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, hitTolerance, ol.functions.TRUE, this, layerFilter, thisArg);

  return hasFeature !== undefined;
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 * @return {ol.renderer.Layer} Layer renderer.
 */
ol.renderer.Map.prototype.getLayerRenderer = function(layer) {
  var layerKey = ol.getUid(layer).toString();
  if (layerKey in this.layerRenderers_) {
    return this.layerRenderers_[layerKey];
  } else {
    var layerRendererPlugins = ol.plugins.getLayerRendererPlugins();
    var renderer;
    var type = this.getType();
    for (var i = 0, ii = layerRendererPlugins.length; i < ii; ++i) {
      var plugin = layerRendererPlugins[i];
      if (plugin.handles(type, layer)) {
        renderer = plugin.create(this, layer);
        break;
      }
    }
    if (renderer) {
      this.layerRenderers_[layerKey] = renderer;
      this.layerRendererListeners_[layerKey] = ol.events.listen(renderer,
          ol.events.EventType.CHANGE, this.handleLayerRendererChange_, this);
    } else {
      throw new Error('Unable to create renderer for layer: ' + layer.getType());
    }
    return renderer;
  }
};


/**
 * @param {string} layerKey Layer key.
 * @protected
 * @return {ol.renderer.Layer} Layer renderer.
 */
ol.renderer.Map.prototype.getLayerRendererByKey = function(layerKey) {
  return this.layerRenderers_[layerKey];
};


/**
 * @protected
 * @return {Object.<string, ol.renderer.Layer>} Layer renderers.
 */
ol.renderer.Map.prototype.getLayerRenderers = function() {
  return this.layerRenderers_;
};


/**
 * @return {ol.PluggableMap} Map.
 */
ol.renderer.Map.prototype.getMap = function() {
  return this.map_;
};


/**
 * @abstract
 * @return {ol.renderer.Type} Type
 */
ol.renderer.Map.prototype.getType = function() {};


/**
 * Handle changes in a layer renderer.
 * @private
 */
ol.renderer.Map.prototype.handleLayerRendererChange_ = function() {
  this.map_.render();
};


/**
 * @param {string} layerKey Layer key.
 * @return {ol.renderer.Layer} Layer renderer.
 * @private
 */
ol.renderer.Map.prototype.removeLayerRendererByKey_ = function(layerKey) {
  var layerRenderer = this.layerRenderers_[layerKey];
  delete this.layerRenderers_[layerKey];

  ol.events.unlistenByKey(this.layerRendererListeners_[layerKey]);
  delete this.layerRendererListeners_[layerKey];

  return layerRenderer;
};


/**
 * Render.
 * @param {?olx.FrameState} frameState Frame state.
 */
ol.renderer.Map.prototype.renderFrame = ol.nullFunction;


/**
 * @param {ol.PluggableMap} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.Map.prototype.removeUnusedLayerRenderers_ = function(map, frameState) {
  var layerKey;
  for (layerKey in this.layerRenderers_) {
    if (!frameState || !(layerKey in frameState.layerStates)) {
      this.removeLayerRendererByKey_(layerKey).dispose();
    }
  }
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @protected
 */
ol.renderer.Map.prototype.scheduleExpireIconCache = function(frameState) {
  frameState.postRenderFunctions.push(
      /** @type {ol.PostRenderFunction} */ (ol.renderer.Map.expireIconCache_)
  );
};


/**
 * @param {!olx.FrameState} frameState Frame state.
 * @protected
 */
ol.renderer.Map.prototype.scheduleRemoveUnusedLayerRenderers = function(frameState) {
  var layerKey;
  for (layerKey in this.layerRenderers_) {
    if (!(layerKey in frameState.layerStates)) {
      frameState.postRenderFunctions.push(
          /** @type {ol.PostRenderFunction} */ (this.removeUnusedLayerRenderers_.bind(this))
      );
      return;
    }
  }
};


/**
 * @param {ol.LayerState} state1 First layer state.
 * @param {ol.LayerState} state2 Second layer state.
 * @return {number} The zIndex difference.
 */
ol.renderer.Map.sortByZIndex = function(state1, state2) {
  return state1.zIndex - state2.zIndex;
};
