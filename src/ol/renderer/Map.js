/**
 * @module ol/renderer/Map
 */
import Disposable from '../Disposable.js';
import {wrapX} from '../coordinate.js';
import {getWidth} from '../extent.js';
import {TRUE} from '../functions.js';
import {inView} from '../layer/Layer.js';
import {shared as iconImageCache} from '../style/IconImageCache.js';
import {compose as composeTransform, makeInverse} from '../transform.js';
import {abstract} from '../util.js';

/**
 * @template T
 * @typedef HitMatch
 * @property {import("../Feature.js").FeatureLike} feature Feature.
 * @property {import("../layer/Layer.js").default} layer Layer.
 * @property {import("../geom/SimpleGeometry.js").default} geometry Geometry.
 * @property {number} distanceSq Squared distance.
 * @property {import("./vector.js").FeatureCallback<T>} callback Callback.
 */

/**
 * @abstract
 */
class MapRenderer extends Disposable {
  /**
   * @param {import("../Map.js").default} map Map.
   */
  constructor(map) {
    super();

    /**
     * @private
     * @type {import("../Map.js").default}
     */
    this.map_ = map;
  }

  /**
   * @abstract
   * @param {import("../render/EventType.js").default} type Event type.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   */
  dispatchRenderEvent(type, frameState) {
    abstract();
  }

  /**
   * @param {import("../Map.js").FrameState} frameState FrameState.
   * @protected
   */
  calculateMatrices2D(frameState) {
    const viewState = frameState.viewState;
    const coordinateToPixelTransform = frameState.coordinateToPixelTransform;
    const pixelToCoordinateTransform = frameState.pixelToCoordinateTransform;

    composeTransform(
      coordinateToPixelTransform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      1 / viewState.resolution,
      -1 / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0],
      -viewState.center[1],
    );

    makeInverse(pixelToCoordinateTransform, coordinateToPixelTransform);
  }

  /**
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../Map.js").FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {boolean} checkWrapped Check for wrapped geometries.
   * @param {import("./vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {S} thisArg Value to use as `this` when executing `callback`.
   * @param {function(this: U, import("../layer/Layer.js").default): boolean} layerFilter Layer filter
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
    checkWrapped,
    callback,
    thisArg,
    layerFilter,
    thisArg2,
  ) {
    let result;
    const viewState = frameState.viewState;

    /**
     * @param {boolean} managed Managed layer.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {import("../layer/Layer.js").default} layer Layer.
     * @param {import("../geom/Geometry.js").default} geometry Geometry.
     * @return {T|undefined} Callback result.
     */
    function forEachFeatureAtCoordinate(managed, feature, layer, geometry) {
      return callback.call(thisArg, feature, managed ? layer : null, geometry);
    }

    const projection = viewState.projection;

    const translatedCoordinate = wrapX(coordinate.slice(), projection);
    const offsets = [[0, 0]];
    if (projection.canWrapX() && checkWrapped) {
      const projectionExtent = projection.getExtent();
      const worldWidth = getWidth(projectionExtent);
      offsets.push([-worldWidth, 0], [worldWidth, 0]);
    }

    const layerStates = frameState.layerStatesArray;
    const numLayers = layerStates.length;

    const matches = /** @type {Array<HitMatch<T>>} */ ([]);
    const tmpCoord = [];
    for (let i = 0; i < offsets.length; i++) {
      for (let j = numLayers - 1; j >= 0; --j) {
        const layerState = layerStates[j];
        const layer = layerState.layer;
        if (
          layer.hasRenderer() &&
          inView(layerState, viewState) &&
          layerFilter.call(thisArg2, layer)
        ) {
          const layerRenderer = layer.getRenderer();
          const source = layer.getSource();
          if (layerRenderer && source) {
            const coordinates = source.getWrapX()
              ? translatedCoordinate
              : coordinate;
            const callback = forEachFeatureAtCoordinate.bind(
              null,
              layerState.managed,
            );
            tmpCoord[0] = coordinates[0] + offsets[i][0];
            tmpCoord[1] = coordinates[1] + offsets[i][1];
            result = layerRenderer.forEachFeatureAtCoordinate(
              tmpCoord,
              frameState,
              hitTolerance,
              callback,
              matches,
            );
          }
          if (result) {
            return result;
          }
        }
      }
    }
    if (matches.length === 0) {
      return undefined;
    }
    const order = 1 / matches.length;
    matches.forEach((m, i) => (m.distanceSq += i * order));
    matches.sort((a, b) => a.distanceSq - b.distanceSq);
    matches.some((m) => {
      return (result = m.callback(m.feature, m.layer, m.geometry));
    });
    return result;
  }

  /**
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../Map.js").FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {boolean} checkWrapped Check for wrapped geometries.
   * @param {function(this: U, import("../layer/Layer.js").default): boolean} layerFilter Layer filter
   *     function, only layers which are visible and for which this function
   *     returns `true` will be tested for features.  By default, all visible
   *     layers will be tested.
   * @param {U} thisArg Value to use as `this` when executing `layerFilter`.
   * @return {boolean} Is there a feature at the given coordinate?
   * @template U
   */
  hasFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    checkWrapped,
    layerFilter,
    thisArg,
  ) {
    const hasFeature = this.forEachFeatureAtCoordinate(
      coordinate,
      frameState,
      hitTolerance,
      checkWrapped,
      TRUE,
      this,
      layerFilter,
      thisArg,
    );

    return hasFeature !== undefined;
  }

  /**
   * @return {import("../Map.js").default} Map.
   */
  getMap() {
    return this.map_;
  }

  /**
   * Render.
   * @abstract
   * @param {?import("../Map.js").FrameState} frameState Frame state.
   */
  renderFrame(frameState) {
    abstract();
  }

  /**
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @protected
   */
  scheduleExpireIconCache(frameState) {
    if (iconImageCache.canExpireCache()) {
      frameState.postRenderFunctions.push(expireIconCache);
    }
  }
}

/**
 * @param {import("../Map.js").default} map Map.
 * @param {import("../Map.js").FrameState} frameState Frame state.
 */
function expireIconCache(map, frameState) {
  iconImageCache.expire();
}

export default MapRenderer;
