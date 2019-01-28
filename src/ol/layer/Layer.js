/**
 * @module ol/layer/Layer
 */
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {getChangeEventType} from '../Object.js';
import BaseLayer from './Base.js';
import LayerProperty from './Property.js';
import {assign} from '../obj.js';
import RenderEventType from '../render/EventType.js';
import SourceState from '../source/State.js';


/**
 * @typedef {Object} Options
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
 * @property {import("../source/Source.js").default} [source] Source for this layer.  If not provided to the constructor,
 * the source can be set by calling {@link module:ol/layer/Layer#setSource layer.setSource(source)} after
 * construction.
 * @property {import("../PluggableMap.js").default} [map] Map.
 */


/**
 * @typedef {Object} State
 * @property {import("./Base.js").default} layer
 * @property {number} opacity Opacity, the value is rounded to two digits to appear after the decimal point.
 * @property {SourceState} sourceState
 * @property {boolean} visible
 * @property {boolean} managed
 * @property {import("../extent.js").Extent} [extent]
 * @property {number} zIndex
 * @property {number} maxResolution
 * @property {number} minResolution
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with {@link module:ol/Map#addLayer}. Components
 * like {@link module:ol/interaction/Select~Select} use unmanaged layers
 * internally. These unmanaged layers are associated with the map using
 * {@link module:ol/layer/Layer~Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 *
 * @template {import("../source/Source.js").default} SourceType
 */
class Layer extends BaseLayer {
  /**
   * @param {Options} options Layer options.
   */
  constructor(options) {

    const baseOptions = assign({}, options);
    delete baseOptions.source;

    super(baseOptions);

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

    if (options.map) {
      this.setMap(options.map);
    }

    listen(this,
      getChangeEventType(LayerProperty.SOURCE),
      this.handleSourcePropertyChange_, this);

    const source = options.source ? /** @type {SourceType} */ (options.source) : null;
    this.setSource(source);
  }

  /**
   * @inheritDoc
   */
  getLayersArray(opt_array) {
    const array = opt_array ? opt_array : [];
    array.push(this);
    return array;
  }

  /**
   * @inheritDoc
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
    * @inheritDoc
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
      this.sourceChangeKey_ = listen(source,
        EventType.CHANGE, this.handleSourceChange_, this);
    }
    this.changed();
  }

  /**
   * In charge to manage the rendering of the layer. One layer type is
   * bounded with one layer renderer.
   * @param {?import("../PluggableMap.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  render(frameState) {
    const layerRenderer = this.getRenderer();
    const layerState = this.getLayerState();
    if (layerRenderer.prepareFrame(frameState, layerState)) {
      return layerRenderer.renderFrame(frameState, layerState);
    }
  }

  /**
   * Sets the layer to be rendered on top of other layers on a map. The map will
   * not manage this layer in its layers collection, and the callback in
   * {@link module:ol/Map#forEachLayerAtPixel} will receive `null` as layer. This
   * is useful for temporary layers. To remove an unmanaged layer from the map,
   * use `#setMap(null)`.
   *
   * To add the layer to a map and have it managed by the map, use
   * {@link module:ol/Map#addLayer} instead.
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
      this.mapPrecomposeKey_ = listen(map, RenderEventType.PRECOMPOSE, function(evt) {
        const renderEvent = /** @type {import("../render/Event.js").default} */ (evt);
        const layerState = this.getLayerState();
        layerState.managed = false;
        if (this.getZIndex() === undefined) {
          layerState.zIndex = Infinity;
        }
        renderEvent.frameState.layerStatesArray.push(layerState);
      }, this);
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
   * Create a renderer for this layer.
   * @return {import("../renderer/Layer.js").default} A layer renderer.
   * @protected
   */
  createRenderer() {
    return null;
  }

}


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {State} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
export function visibleAtResolution(layerState, resolution) {
  return layerState.visible && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
}


export default Layer;
