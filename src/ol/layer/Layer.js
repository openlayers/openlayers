/**
 * @module ol/layer/Layer
 */
import BaseLayer from './Base.js';
import EventType from '../events/EventType.js';
import LayerProperty from './Property.js';
import RenderEventType from '../render/EventType.js';
import SourceState from '../source/State.js';
import {assert} from '../asserts.js';
import {assign} from '../obj.js';
import {listen, unlistenByKey} from '../events.js';

/**
 * @typedef {function(import("../PluggableMap.js").FrameState):HTMLElement} RenderFunction
 */

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
 *     'change:source', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|'change:source'|
 *     import("../render/EventType").LayerRenderEventTypes, Return>} LayerOnSignature
 */

/**
 * @template {import("../source/Source.js").default} SourceType
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {SourceType} [source] Source for this layer.  If not provided to the constructor,
 * the source can be set by calling {@link module:ol/layer/Layer~Layer#setSource layer.setSource(source)} after
 * construction.
 * @property {import("../PluggableMap.js").default} [map] Map.
 * @property {RenderFunction} [render] Render function. Takes the frame state as input and is expected to return an
 * HTML element. Will overwrite the default rendering for the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @typedef {Object} State
 * @property {import("./Layer.js").default} layer Layer.
 * @property {number} opacity Opacity, the value is rounded to two digits to appear after the decimal point.
 * @property {import("../source/State.js").default} sourceState SourceState.
 * @property {boolean} visible Visible.
 * @property {boolean} managed Managed.
 * @property {import("../extent.js").Extent} [extent] Extent.
 * @property {number} zIndex ZIndex.
 * @property {number} maxResolution Maximum resolution.
 * @property {number} minResolution Minimum resolution.
 * @property {number} minZoom Minimum zoom.
 * @property {number} maxZoom Maximum zoom.
 */

/**
 * @classdesc
 * Base class from which all layer types are derived. This should only be instantiated
 * in the case where a custom layer is be added to the map with a custom `render` function.
 * Such a function can be specified in the `options` object, and is expected to return an HTML element.
 *
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with {@link import("../PluggableMap.js").default#addLayer map.addLayer()}. Components
 * like {@link module:ol/interaction/Select~Select} use unmanaged layers
 * internally. These unmanaged layers are associated with the map using
 * {@link module:ol/layer/Layer~Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 *
 * Please note that for performance reasons several layers might get rendered to
 * the same HTML element, which will cause {@link import("../PluggableMap.js").default#forEachLayerAtPixel map.forEachLayerAtPixel()} to
 * give false positives. To avoid this, apply different `className` properties to the
 * layers at creation time.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 *
 * @template {import("../source/Source.js").default} SourceType
 * @api
 */
class Layer extends BaseLayer {
  /**
   * @param {Options<SourceType>} options Layer options.
   */
  constructor(options) {
    const baseOptions = assign({}, options);
    delete baseOptions.source;

    super(baseOptions);

    /***
     * @type {LayerOnSignature<import("../Observable.js").OnReturn>}
     */
    this.on;

    /***
     * @type {LayerOnSignature<import("../Observable.js").OnReturn>}
     */
    this.once;

    /***
     * @type {LayerOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.mapPrecomposeKey_ = null;

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.mapRenderKey_ = null;

    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    this.sourceChangeKey_ = null;

    /**
     * @private
     * @type {import("../renderer/Layer.js").default}
     */
    this.renderer_ = null;

    // Overwrite default render method with a custom one
    if (options.render) {
      this.render = options.render;
    }

    if (options.map) {
      this.setMap(options.map);
    }

    this.addChangeListener(
      LayerProperty.SOURCE,
      this.handleSourcePropertyChange_
    );

    const source = options.source
      ? /** @type {SourceType} */ (options.source)
      : null;
    this.setSource(source);
  }

  /**
   * @param {Array<import("./Layer.js").default>} [opt_array] Array of layers (to be modified in place).
   * @return {Array<import("./Layer.js").default>} Array of layers.
   */
  getLayersArray(opt_array) {
    const array = opt_array ? opt_array : [];
    array.push(this);
    return array;
  }

  /**
   * @param {Array<import("./Layer.js").State>} [opt_states] Optional list of layer states (to be modified in place).
   * @return {Array<import("./Layer.js").State>} List of layer states.
   */
  getLayerStatesArray(opt_states) {
    const states = opt_states ? opt_states : [];
    states.push(this.getLayerState());
    return states;
  }

  /**
   * Get the layer source.
   * @return {SourceType} The layer source (or `null` if not yet set).
   * @observable
   * @api
   */
  getSource() {
    return /** @type {SourceType} */ (this.get(LayerProperty.SOURCE)) || null;
  }

  /**
   * @return {import("../source/State.js").default} Source state.
   */
  getSourceState() {
    const source = this.getSource();
    return !source ? SourceState.UNDEFINED : source.getState();
  }

  /**
   * @private
   */
  handleSourceChange_() {
    this.changed();
  }

  /**
   * @private
   */
  handleSourcePropertyChange_() {
    if (this.sourceChangeKey_) {
      unlistenByKey(this.sourceChangeKey_);
      this.sourceChangeKey_ = null;
    }
    const source = this.getSource();
    if (source) {
      this.sourceChangeKey_ = listen(
        source,
        EventType.CHANGE,
        this.handleSourceChange_,
        this
      );
    }
    this.changed();
  }

  /**
   * @param {import("../pixel").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../Feature").default>>} Promise that resolves with
   * an array of features.
   */
  getFeatures(pixel) {
    if (!this.renderer_) {
      return new Promise((resolve) => resolve([]));
    }
    return this.renderer_.getFeatures(pixel);
  }

  /**
   * In charge to manage the rendering of the layer. One layer type is
   * bounded with one layer renderer.
   * @param {?import("../PluggableMap.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target which the renderer may (but need not) use
   * for rendering its content.
   * @return {HTMLElement} The rendered element.
   */
  render(frameState, target) {
    const layerRenderer = this.getRenderer();

    if (layerRenderer.prepareFrame(frameState)) {
      return layerRenderer.renderFrame(frameState, target);
    }
  }

  /**
   * Sets the layer to be rendered on top of other layers on a map. The map will
   * not manage this layer in its layers collection, and the callback in
   * {@link module:ol/Map~Map#forEachLayerAtPixel} will receive `null` as layer. This
   * is useful for temporary layers. To remove an unmanaged layer from the map,
   * use `#setMap(null)`.
   *
   * To add the layer to a map and have it managed by the map, use
   * {@link module:ol/Map~Map#addLayer} instead.
   * @param {import("../PluggableMap.js").default} map Map.
   * @api
   */
  setMap(map) {
    if (this.mapPrecomposeKey_) {
      unlistenByKey(this.mapPrecomposeKey_);
      this.mapPrecomposeKey_ = null;
    }
    if (!map) {
      this.changed();
    }
    if (this.mapRenderKey_) {
      unlistenByKey(this.mapRenderKey_);
      this.mapRenderKey_ = null;
    }
    if (map) {
      this.mapPrecomposeKey_ = listen(
        map,
        RenderEventType.PRECOMPOSE,
        function (evt) {
          const renderEvent =
            /** @type {import("../render/Event.js").default} */ (evt);
          const layerStatesArray = renderEvent.frameState.layerStatesArray;
          const layerState = this.getLayerState(false);
          // A layer can only be added to the map once. Use either `layer.setMap()` or `map.addLayer()`, not both.
          assert(
            !layerStatesArray.some(function (arrayLayerState) {
              return arrayLayerState.layer === layerState.layer;
            }),
            67
          );
          layerStatesArray.push(layerState);
        },
        this
      );
      this.mapRenderKey_ = listen(this, EventType.CHANGE, map.render, map);
      this.changed();
    }
  }

  /**
   * Set the layer source.
   * @param {SourceType} source The layer source.
   * @observable
   * @api
   */
  setSource(source) {
    this.set(LayerProperty.SOURCE, source);
  }

  /**
   * Get the renderer for this layer.
   * @return {import("../renderer/Layer.js").default} The layer renderer.
   */
  getRenderer() {
    if (!this.renderer_) {
      this.renderer_ = this.createRenderer();
    }
    return this.renderer_;
  }

  /**
   * @return {boolean} The layer has a renderer.
   */
  hasRenderer() {
    return !!this.renderer_;
  }

  /**
   * Create a renderer for this layer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   * @protected
   */
  createRenderer() {
    return null;
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    this.setSource(null);
    super.disposeInternal();
  }
}

/**
 * Return `true` if the layer is visible and if the provided view state
 * has resolution and zoom levels that are in range of the layer's min/max.
 * @param {State} layerState Layer state.
 * @param {import("../View.js").State} viewState View state.
 * @return {boolean} The layer is visible at the given view state.
 */
export function inView(layerState, viewState) {
  if (!layerState.visible) {
    return false;
  }
  const resolution = viewState.resolution;
  if (
    resolution < layerState.minResolution ||
    resolution >= layerState.maxResolution
  ) {
    return false;
  }
  const zoom = viewState.zoom;
  return zoom > layerState.minZoom && zoom <= layerState.maxZoom;
}

export default Layer;
