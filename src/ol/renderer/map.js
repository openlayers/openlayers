import _ol_ from '../index';
import _ol_Disposable_ from '../disposable';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_functions_ from '../functions';
import _ol_layer_Layer_ from '../layer/layer';
import _ol_plugins_ from '../plugins';
import _ol_style_ from '../style';
import _ol_transform_ from '../transform';

/**
 * @constructor
 * @abstract
 * @extends {ol.Disposable}
 * @param {Element} container Container.
 * @param {ol.PluggableMap} map Map.
 * @struct
 */
var _ol_renderer_Map_ = function(container, map) {

  _ol_Disposable_.call(this);


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

_ol_.inherits(_ol_renderer_Map_, _ol_Disposable_);


/**
 * @param {olx.FrameState} frameState FrameState.
 * @protected
 */
_ol_renderer_Map_.prototype.calculateMatrices2D = function(frameState) {
  var viewState = frameState.viewState;
  var coordinateToPixelTransform = frameState.coordinateToPixelTransform;
  var pixelToCoordinateTransform = frameState.pixelToCoordinateTransform;

  _ol_transform_.compose(coordinateToPixelTransform,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / viewState.resolution, -1 / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0], -viewState.center[1]);

  _ol_transform_.invert(
      _ol_transform_.setFromArray(pixelToCoordinateTransform, coordinateToPixelTransform));
};


/**
 * @inheritDoc
 */
_ol_renderer_Map_.prototype.disposeInternal = function() {
  for (var id in this.layerRenderers_) {
    this.layerRenderers_[id].dispose();
  }
};


/**
 * @param {ol.PluggableMap} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
_ol_renderer_Map_.expireIconCache_ = function(map, frameState) {
  var cache = _ol_style_.iconImageCache;
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
_ol_renderer_Map_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg,
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
    var key = _ol_.getUid(feature).toString();
    var managed = frameState.layerStates[_ol_.getUid(layer)].managed;
    if (!(key in frameState.skippedFeatureUids && !managed)) {
      return callback.call(thisArg, feature, managed ? layer : null);
    }
  }

  var projection = viewState.projection;

  var translatedCoordinate = coordinate;
  if (projection.canWrapX()) {
    var projectionExtent = projection.getExtent();
    var worldWidth = _ol_extent_.getWidth(projectionExtent);
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
    if (_ol_layer_Layer_.visibleAtResolution(layerState, viewResolution) &&
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
_ol_renderer_Map_.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg,
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
_ol_renderer_Map_.prototype.hasFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, layerFilter, thisArg) {
  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, hitTolerance, _ol_functions_.TRUE, this, layerFilter, thisArg);

  return hasFeature !== undefined;
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @protected
 * @return {ol.renderer.Layer} Layer renderer.
 */
_ol_renderer_Map_.prototype.getLayerRenderer = function(layer) {
  var layerKey = _ol_.getUid(layer).toString();
  if (layerKey in this.layerRenderers_) {
    return this.layerRenderers_[layerKey];
  } else {
    var layerRendererPlugins = _ol_plugins_.getLayerRendererPlugins();
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
      this.layerRendererListeners_[layerKey] = _ol_events_.listen(renderer,
          _ol_events_EventType_.CHANGE, this.handleLayerRendererChange_, this);
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
_ol_renderer_Map_.prototype.getLayerRendererByKey = function(layerKey) {
  return this.layerRenderers_[layerKey];
};


/**
 * @protected
 * @return {Object.<string, ol.renderer.Layer>} Layer renderers.
 */
_ol_renderer_Map_.prototype.getLayerRenderers = function() {
  return this.layerRenderers_;
};


/**
 * @return {ol.PluggableMap} Map.
 */
_ol_renderer_Map_.prototype.getMap = function() {
  return this.map_;
};


/**
 * @abstract
 * @return {ol.renderer.Type} Type
 */
_ol_renderer_Map_.prototype.getType = function() {};


/**
 * Handle changes in a layer renderer.
 * @private
 */
_ol_renderer_Map_.prototype.handleLayerRendererChange_ = function() {
  this.map_.render();
};


/**
 * @param {string} layerKey Layer key.
 * @return {ol.renderer.Layer} Layer renderer.
 * @private
 */
_ol_renderer_Map_.prototype.removeLayerRendererByKey_ = function(layerKey) {
  var layerRenderer = this.layerRenderers_[layerKey];
  delete this.layerRenderers_[layerKey];

  _ol_events_.unlistenByKey(this.layerRendererListeners_[layerKey]);
  delete this.layerRendererListeners_[layerKey];

  return layerRenderer;
};


/**
 * Render.
 * @param {?olx.FrameState} frameState Frame state.
 */
_ol_renderer_Map_.prototype.renderFrame = _ol_.nullFunction;


/**
 * @param {ol.PluggableMap} map Map.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
_ol_renderer_Map_.prototype.removeUnusedLayerRenderers_ = function(map, frameState) {
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
_ol_renderer_Map_.prototype.scheduleExpireIconCache = function(frameState) {
  frameState.postRenderFunctions.push(
      /** @type {ol.PostRenderFunction} */ (_ol_renderer_Map_.expireIconCache_)
  );
};


/**
 * @param {!olx.FrameState} frameState Frame state.
 * @protected
 */
_ol_renderer_Map_.prototype.scheduleRemoveUnusedLayerRenderers = function(frameState) {
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
_ol_renderer_Map_.sortByZIndex = function(state1, state2) {
  return state1.zIndex - state2.zIndex;
};
export default _ol_renderer_Map_;
