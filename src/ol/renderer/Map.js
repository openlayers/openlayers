/**
 * @module ol/renderer/Map
 */
import {getUid} from '../util.js';
import Disposable from '../Disposable.js';
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {getWidth} from '../extent.js';
import {TRUE, VOID} from '../functions.js';
import {visibleAtResolution} from '../layer/Layer.js';
import {shared as iconImageCache} from '../style/IconImageCache.js';
import {compose as composeTransform, invert as invertTransform, setFromArray as transformSetFromArray} from '../transform.js';


class MapRenderer extends Disposable {

  /**
   * @param {module:ol/PluggableMap} map Map.
   */
  constructor(map) {
    super();

    /**
     * @private
     * @type {module:ol/PluggableMap}
     */
    this.map_ = map;

    /**
     * @private
     * @type {!Object<string, module:ol/renderer/Layer>}
     */
    this.layerRenderers_ = {};

    /**
     * @private
     * @type {Object<string, module:ol/events~EventsKey>}
     */
    this.layerRendererListeners_ = {};

    /**
     * @private
     * @type {Array<module:ol/renderer/Layer>}
     */
    this.layerRendererConstructors_ = [];

  }

  /**
   * Register layer renderer constructors.
   * @param {Array<module:ol/renderer/Layer>} constructors Layer renderers.
   */
  registerLayerRenderers(constructors) {
    this.layerRendererConstructors_.push.apply(this.layerRendererConstructors_, constructors);
  }

  /**
   * Get the registered layer renderer constructors.
   * @return {Array<module:ol/renderer/Layer>} Registered layer renderers.
   */
  getLayerRendererConstructors() {
    return this.layerRendererConstructors_;
  }

  /**
   * @param {module:ol/PluggableMap~FrameState} frameState FrameState.
   * @protected
   */
  calculateMatrices2D(frameState) {
    const viewState = frameState.viewState;
    const coordinateToPixelTransform = frameState.coordinateToPixelTransform;
    const pixelToCoordinateTransform = frameState.pixelToCoordinateTransform;

    composeTransform(coordinateToPixelTransform,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / viewState.resolution, -1 / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0], -viewState.center[1]);

    invertTransform(
      transformSetFromArray(pixelToCoordinateTransform, coordinateToPixelTransform));
  }

  /**
   * Removes all layer renderers.
   */
  removeLayerRenderers() {
    for (const key in this.layerRenderers_) {
      this.removeLayerRendererByKey_(key).dispose();
    }
  }

  /**
   * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
   * @param {module:ol/PluggableMap~FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(this: S, (module:ol/Feature|module:ol/render/Feature),
   *     module:ol/layer/Layer): T} callback Feature callback.
   * @param {S} thisArg Value to use as `this` when executing `callback`.
   * @param {function(this: U, module:ol/layer/Layer): boolean} layerFilter Layer filter
   *     function, only layers which are visible and for which this function
   *     returns `true` will be tested for features.  By default, all visible
   *     layers will be tested.
   * @param {U} thisArg2 Value to use as `this` when executing `layerFilter`.
   * @return {T|undefined} Callback result.
   * @template S,T,U
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    thisArg,
    layerFilter,
    thisArg2
  ) {
    let result;
    const viewState = frameState.viewState;
    const viewResolution = viewState.resolution;

    /**
     * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
     * @param {module:ol/layer/Layer} layer Layer.
     * @return {?} Callback result.
     */
    function forEachFeatureAtCoordinate(feature, layer) {
      const key = getUid(feature).toString();
      const managed = frameState.layerStates[getUid(layer)].managed;
      if (!(key in frameState.skippedFeatureUids && !managed)) {
        return callback.call(thisArg, feature, managed ? layer : null);
      }
    }

    const projection = viewState.projection;

    let translatedCoordinate = coordinate;
    if (projection.canWrapX()) {
      const projectionExtent = projection.getExtent();
      const worldWidth = getWidth(projectionExtent);
      const x = coordinate[0];
      if (x < projectionExtent[0] || x > projectionExtent[2]) {
        const worldsAway = Math.ceil((projectionExtent[0] - x) / worldWidth);
        translatedCoordinate = [x + worldWidth * worldsAway, coordinate[1]];
      }
    }

    const layerStates = frameState.layerStatesArray;
    const numLayers = layerStates.length;
    let i;
    for (i = numLayers - 1; i >= 0; --i) {
      const layerState = layerStates[i];
      const layer = layerState.layer;
      if (visibleAtResolution(layerState, viewResolution) && layerFilter.call(thisArg2, layer)) {
        const layerRenderer = this.getLayerRenderer(layer);
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
  }

  /**
   * @abstract
   * @param {module:ol/pixel~Pixel} pixel Pixel.
   * @param {module:ol/PluggableMap~FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(this: S, module:ol/layer/Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
   *     callback.
   * @param {S} thisArg Value to use as `this` when executing `callback`.
   * @param {function(this: U, module:ol/layer/Layer): boolean} layerFilter Layer filter
   *     function, only layers which are visible and for which this function
   *     returns `true` will be tested for features.  By default, all visible
   *     layers will be tested.
   * @param {U} thisArg2 Value to use as `this` when executing `layerFilter`.
   * @return {T|undefined} Callback result.
   * @template S,T,U
   */
  forEachLayerAtPixel(pixel, frameState, hitTolerance, callback, thisArg, layerFilter, thisArg2) {}

  /**
   * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
   * @param {module:ol/PluggableMap~FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {function(this: U, module:ol/layer/Layer): boolean} layerFilter Layer filter
   *     function, only layers which are visible and for which this function
   *     returns `true` will be tested for features.  By default, all visible
   *     layers will be tested.
   * @param {U} thisArg Value to use as `this` when executing `layerFilter`.
   * @return {boolean} Is there a feature at the given coordinate?
   * @template U
   */
  hasFeatureAtCoordinate(coordinate, frameState, hitTolerance, layerFilter, thisArg) {
    const hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, hitTolerance, TRUE, this, layerFilter, thisArg);

    return hasFeature !== undefined;
  }

  /**
   * @param {module:ol/layer/Layer} layer Layer.
   * @protected
   * @return {module:ol/renderer/Layer} Layer renderer.
   */
  getLayerRenderer(layer) {
    const layerKey = getUid(layer).toString();
    if (layerKey in this.layerRenderers_) {
      return this.layerRenderers_[layerKey];
    } else {
      let renderer;
      for (let i = 0, ii = this.layerRendererConstructors_.length; i < ii; ++i) {
        const candidate = this.layerRendererConstructors_[i];
        if (candidate['handles'](layer)) {
          renderer = candidate['create'](this, layer);
          break;
        }
      }
      if (renderer) {
        this.layerRenderers_[layerKey] = renderer;
        this.layerRendererListeners_[layerKey] = listen(renderer,
          EventType.CHANGE, this.handleLayerRendererChange_, this);
      } else {
        throw new Error('Unable to create renderer for layer: ' + layer.getType());
      }
      return renderer;
    }
  }

  /**
   * @param {string} layerKey Layer key.
   * @protected
   * @return {module:ol/renderer/Layer} Layer renderer.
   */
  getLayerRendererByKey(layerKey) {
    return this.layerRenderers_[layerKey];
  }

  /**
   * @protected
   * @return {Object<string, module:ol/renderer/Layer>} Layer renderers.
   */
  getLayerRenderers() {
    return this.layerRenderers_;
  }

  /**
   * @return {module:ol/PluggableMap} Map.
   */
  getMap() {
    return this.map_;
  }

  /**
   * Handle changes in a layer renderer.
   * @private
   */
  handleLayerRendererChange_() {
    this.map_.render();
  }

  /**
   * @param {string} layerKey Layer key.
   * @return {module:ol/renderer/Layer} Layer renderer.
   * @private
   */
  removeLayerRendererByKey_(layerKey) {
    const layerRenderer = this.layerRenderers_[layerKey];
    delete this.layerRenderers_[layerKey];

    unlistenByKey(this.layerRendererListeners_[layerKey]);
    delete this.layerRendererListeners_[layerKey];

    return layerRenderer;
  }

  /**
   * @param {module:ol/PluggableMap} map Map.
   * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
   * @private
   */
  removeUnusedLayerRenderers_(map, frameState) {
    for (const layerKey in this.layerRenderers_) {
      if (!frameState || !(layerKey in frameState.layerStates)) {
        this.removeLayerRendererByKey_(layerKey).dispose();
      }
    }
  }

  /**
   * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
   * @protected
   */
  scheduleExpireIconCache(frameState) {
    frameState.postRenderFunctions.push(/** @type {module:ol/PluggableMap~PostRenderFunction} */ (expireIconCache));
  }

  /**
   * @param {!module:ol/PluggableMap~FrameState} frameState Frame state.
   * @protected
   */
  scheduleRemoveUnusedLayerRenderers(frameState) {
    for (const layerKey in this.layerRenderers_) {
      if (!(layerKey in frameState.layerStates)) {
        frameState.postRenderFunctions.push(
          /** @type {module:ol/PluggableMap~PostRenderFunction} */ (this.removeUnusedLayerRenderers_.bind(this))
        );
        return;
      }
    }
  }
}


/**
 * @param {module:ol/PluggableMap} map Map.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 */
function expireIconCache(map, frameState) {
  iconImageCache.expire();
}


/**
 * Render.
 * @param {?module:ol/PluggableMap~FrameState} frameState Frame state.
 */
MapRenderer.prototype.renderFrame = VOID;


/**
 * @param {module:ol/render/EventType} type Event type.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 */
MapRenderer.prototype.dispatchRenderEvent = VOID;


/**
 * @param {module:ol/layer/Layer~State} state1 First layer state.
 * @param {module:ol/layer/Layer~State} state2 Second layer state.
 * @return {number} The zIndex difference.
 */
export function sortByZIndex(state1, state2) {
  return state1.zIndex - state2.zIndex;
}
export default MapRenderer;
