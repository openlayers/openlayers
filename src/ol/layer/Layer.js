/**
 * @module ol/layer/Layer
 */
import View from '../View.js';
import {assert} from '../asserts.js';
import EventType from '../events/EventType.js';
import {listen, unlistenByKey} from '../events.js';
import {intersects} from '../extent.js';
import RenderEventType from '../render/EventType.js';
import BaseLayer from './Base.js';
import LayerProperty from './Property.js';

/**
 * @typedef {function(import("../Map.js").FrameState):HTMLElement} RenderFunction
 */

/**
 * @typedef {'sourceready'|'change:source'} LayerEventType
 */

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
 *     LayerEventType, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|LayerEventType|
 *     import("../render/EventType").LayerRenderEventTypes, Return>} LayerOnSignature
 */

/**
 * @template {import("../source/Source.js").default} [SourceType=import("../source/Source.js").default]
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
 * @property {import("../Map.js").default|null} [map] Map.
 * @property {RenderFunction} [render] Render function. Takes the frame state as input and is expected to return an
 * HTML element. Will overwrite the default rendering for the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */

/**
 * @typedef {Object} State
 * @property {import("./Layer.js").default} layer Layer.
 * @property {number} opacity Opacity, the value is rounded to two digits to appear after the decimal point.
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
 * in the case where a custom layer is added to the map with a custom `render` function.
 * Such a function can be specified in the `options` object, and is expected to return an HTML element.
 *
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * Components like {@link module:ol/interaction/Draw~Draw} use unmanaged layers
 * internally. These unmanaged layers are associated with the map using
 * [layer.setMap()]{@link module:ol/layer/Layer~Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 * A `sourceready` event is fired when the layer's source is ready.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @fires import("../events/Event.js").BaseEvent#sourceready
 *
 * @template {import("../source/Source.js").default} [SourceType=import("../source/Source.js").default]
 * @template {import("../renderer/Layer.js").default} [RendererType=import("../renderer/Layer.js").default]
 * @api
 */
class Layer extends BaseLayer {
  /**
   * @param {Options<SourceType>} options Layer options.
   */
  constructor(options) {
    const baseOptions = Object.assign({}, options);
    delete baseOptions.source;

    super(baseOptions);

    /***
     * @type {LayerOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {LayerOnSignature<import("../events").EventsKey>}
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
     * @type {RendererType}
     */
    this.renderer_ = null;

    /**
     * @private
     * @type {boolean}
     */
    this.sourceReady_ = false;

    /**
     * @protected
     * @type {boolean}
     */
    this.rendered = false;

    // Overwrite default render method with a custom one
    if (options.render) {
      this.render = options.render;
    }

    if (options.map) {
      this.setMap(options.map);
    }

    this.addChangeListener(
      LayerProperty.SOURCE,
      this.handleSourcePropertyChange_,
    );

    const source = options.source
      ? /** @type {SourceType} */ (options.source)
      : null;
    this.setSource(source);
  }

  /**
   * @param {Array<import("./Layer.js").default>} [array] Array of layers (to be modified in place).
   * @return {Array<import("./Layer.js").default>} Array of layers.
   * @override
   */
  getLayersArray(array) {
    array = array ? array : [];
    array.push(this);
    return array;
  }

  /**
   * @param {Array<import("./Layer.js").State>} [states] Optional list of layer states (to be modified in place).
   * @return {Array<import("./Layer.js").State>} List of layer states.
   * @override
   */
  getLayerStatesArray(states) {
    states = states ? states : [];
    states.push(this.getLayerState());
    return states;
  }

  /**
   * Get the layer source.
   * @return {SourceType|null} The layer source (or `null` if not yet set).
   * @observable
   * @api
   */
  getSource() {
    return /** @type {SourceType} */ (this.get(LayerProperty.SOURCE)) || null;
  }

  /**
   * @return {SourceType|null} The source being rendered.
   */
  getRenderSource() {
    return this.getSource();
  }

  /**
   * @return {import("../source/Source.js").State} Source state.
   * @override
   */
  getSourceState() {
    const source = this.getSource();
    return !source ? 'undefined' : source.getState();
  }

  /**
   * @private
   */
  handleSourceChange_() {
    this.changed();
    if (this.sourceReady_ || this.getSource().getState() !== 'ready') {
      return;
    }
    this.sourceReady_ = true;
    this.dispatchEvent('sourceready');
  }

  /**
   * @private
   */
  handleSourcePropertyChange_() {
    if (this.sourceChangeKey_) {
      unlistenByKey(this.sourceChangeKey_);
      this.sourceChangeKey_ = null;
    }
    this.sourceReady_ = false;
    const source = this.getSource();
    if (source) {
      this.sourceChangeKey_ = listen(
        source,
        EventType.CHANGE,
        this.handleSourceChange_,
        this,
      );
      if (source.getState() === 'ready') {
        this.sourceReady_ = true;
        setTimeout(() => {
          this.dispatchEvent('sourceready');
        }, 0);
      }
      this.clearRenderer();
    }
    this.changed();
  }

  /**
   * @param {import("../pixel").Pixel} pixel Pixel.
   * @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with
   * an array of features.
   */
  getFeatures(pixel) {
    if (!this.renderer_) {
      return Promise.resolve([]);
    }
    return this.renderer_.getFeatures(pixel);
  }

  /**
   * @param {import("../pixel").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Pixel data.
   */
  getData(pixel) {
    if (!this.renderer_ || !this.rendered) {
      return null;
    }
    return this.renderer_.getData(pixel);
  }

  /**
   * The layer is visible on the map view, i.e. within its min/max resolution or zoom and
   * extent, not set to `visible: false`, and not inside a layer group that is set
   * to `visible: false`.
   * @param {View|import("../View.js").ViewStateLayerStateExtent} [view] View or {@link import("../Map.js").FrameState}.
   * Only required when the layer is not added to a map.
   * @return {boolean} The layer is visible in the map view.
   * @api
   */
  isVisible(view) {
    let frameState;
    const map = this.getMapInternal();
    if (!view && map) {
      view = map.getView();
    }
    if (view instanceof View) {
      frameState = {
        viewState: view.getState(),
        extent: view.calculateExtent(),
      };
    } else {
      frameState = view;
    }
    if (!frameState.layerStatesArray && map) {
      frameState.layerStatesArray = map.getLayerGroup().getLayerStatesArray();
    }
    let layerState;
    if (frameState.layerStatesArray) {
      layerState = frameState.layerStatesArray.find(
        (layerState) => layerState.layer === this,
      );
      if (!layerState) {
        return false;
      }
    } else {
      layerState = this.getLayerState();
    }

    const layerExtent = this.getExtent();

    return (
      inView(layerState, frameState.viewState) &&
      (!layerExtent || intersects(layerExtent, frameState.extent))
    );
  }

  /**
   * Get the attributions of the source of this layer for the given view.
   * @param {View|import("../View.js").ViewStateLayerStateExtent} [view] View or {@link import("../Map.js").FrameState}.
   * Only required when the layer is not added to a map.
   * @return {Array<string>} Attributions for this layer at the given view.
   * @api
   */
  getAttributions(view) {
    if (!this.isVisible(view)) {
      return [];
    }
    const getAttributions = this.getSource()?.getAttributions();
    if (!getAttributions) {
      return [];
    }
    const frameState =
      view instanceof View ? view.getViewStateAndExtent() : view;
    let attributions = getAttributions(frameState);
    if (!Array.isArray(attributions)) {
      attributions = [attributions];
    }
    return attributions;
  }

  /**
   * In charge to manage the rendering of the layer. One layer type is
   * bounded with one layer renderer.
   * @param {?import("../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target which the renderer may (but need not) use
   * for rendering its content.
   * @return {HTMLElement|null} The rendered element.
   */
  render(frameState, target) {
    const layerRenderer = this.getRenderer();

    if (layerRenderer.prepareFrame(frameState)) {
      this.rendered = true;
      return layerRenderer.renderFrame(frameState, target);
    }
    return null;
  }

  /**
   * Called when a layer is not visible during a map render.
   */
  unrender() {
    this.rendered = false;
  }

  /** @return {string} Declutter */
  getDeclutter() {
    return undefined;
  }

  /**
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @param {import("../layer/Layer.js").State} layerState Layer state.
   */
  renderDeclutter(frameState, layerState) {}

  /**
   * When the renderer follows a layout -> render approach, do the final rendering here.
   * @param {import('../Map.js').FrameState} frameState Frame state
   */
  renderDeferred(frameState) {
    const layerRenderer = this.getRenderer();
    if (!layerRenderer) {
      return;
    }
    layerRenderer.renderDeferred(frameState);
  }

  /**
   * For use inside the library only.
   * @param {import("../Map.js").default|null} map Map.
   */
  setMapInternal(map) {
    if (!map) {
      this.unrender();
    }
    this.set(LayerProperty.MAP, map);
  }

  /**
   * For use inside the library only.
   * @return {import("../Map.js").default|null} Map.
   */
  getMapInternal() {
    return this.get(LayerProperty.MAP);
  }

  /**
   * Sets the layer to be rendered on top of other layers on a map. The map will
   * not manage this layer in its layers collection. This
   * is useful for temporary layers. To remove an unmanaged layer from the map,
   * use `#setMap(null)`.
   *
   * To add the layer to a map and have it managed by the map, use
   * {@link module:ol/Map~Map#addLayer} instead.
   * @param {import("../Map.js").default|null} map Map.
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
        this.handlePrecompose_,
        this,
      );
      this.mapRenderKey_ = listen(this, EventType.CHANGE, map.render, map);
      this.changed();
    }
  }

  /**
   * @param {import("../events/Event.js").default} renderEvent Render event
   * @private
   */
  handlePrecompose_(renderEvent) {
    const layerStatesArray =
      /** @type {import("../render/Event.js").default} */ (renderEvent)
        .frameState.layerStatesArray;
    const layerState = this.getLayerState(false);
    assert(
      !layerStatesArray.some(
        (arrayLayerState) => arrayLayerState.layer === layerState.layer,
      ),
      'A layer can only be added to the map once. Use either `layer.setMap()` or `map.addLayer()`, not both.',
    );
    layerStatesArray.push(layerState);
  }

  /**
   * Set the layer source.
   * @param {SourceType|null} source The layer source.
   * @observable
   * @api
   */
  setSource(source) {
    this.set(LayerProperty.SOURCE, source);
  }

  /**
   * Get the renderer for this layer.
   * @return {RendererType|null} The layer renderer.
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
   * @return {RendererType} A layer renderer.
   * @protected
   */
  createRenderer() {
    return null;
  }

  /**
   * This will clear the renderer so that a new one can be created next time it is needed
   */
  clearRenderer() {
    if (this.renderer_) {
      this.renderer_.dispose();
      delete this.renderer_;
    }
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.clearRenderer();
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
