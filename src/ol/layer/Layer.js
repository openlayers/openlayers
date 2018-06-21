/**
 * @module ol/layer/Layer
 */
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {getUid, inherits} from '../util.js';
import {getChangeEventType} from '../Object.js';
import BaseLayer from '../layer/Base.js';
import LayerProperty from '../layer/Property.js';
import {assign} from '../obj.js';
import RenderEventType from '../render/EventType.js';
import SourceState from '../source/State.js';


/**
 * @typedef {Object} Options
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {module:ol/extent~Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex=0] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {module:ol/source/Source} [source] Source for this layer.  If not provided to the constructor,
 * the source can be set by calling {@link module:ol/layer/Layer#setSource layer.setSource(source)} after
 * construction.
 */


/**
 * @typedef {Object} State
 * @property {module:ol/layer/Layer} layer
 * @property {number} opacity
 * @property {module:ol/source/Source~State} sourceState
 * @property {boolean} visible
 * @property {boolean} managed
 * @property {module:ol/extent~Extent} [extent]
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
 * @constructor
 * @abstract
 * @extends {module:ol/layer/Base}
 * @fires module:ol/render/Event~RenderEvent
 * @param {module:ol/layer/Layer~Options} options Layer options.
 * @api
 */
const Layer = function(options) {

  const baseOptions = assign({}, options);
  delete baseOptions.source;

  BaseLayer.call(this, /** @type {module:ol/layer/Base~Options} */ (baseOptions));

  /**
   * @private
   * @type {?module:ol/events~EventsKey}
   */
  this.mapPrecomposeKey_ = null;

  /**
   * @private
   * @type {?module:ol/events~EventsKey}
   */
  this.mapRenderKey_ = null;

  /**
   * @private
   * @type {?module:ol/events~EventsKey}
   */
  this.sourceChangeKey_ = null;

  if (options.map) {
    this.setMap(options.map);
  }

  listen(this,
    getChangeEventType(LayerProperty.SOURCE),
    this.handleSourcePropertyChange_, this);

  const source = options.source ? options.source : null;
  this.setSource(source);
};

inherits(Layer, BaseLayer);


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {module:ol/layer/Layer~State} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
export function visibleAtResolution(layerState, resolution) {
  return layerState.visible && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
}


/**
 * @inheritDoc
 */
Layer.prototype.getLayersArray = function(opt_array) {
  const array = opt_array ? opt_array : [];
  array.push(this);
  return array;
};


/**
 * @inheritDoc
 */
Layer.prototype.getLayerStatesArray = function(opt_states) {
  const states = opt_states ? opt_states : [];
  states.push(this.getLayerState());
  return states;
};


/**
 * Get the layer source.
 * @return {module:ol/source/Source} The layer source (or `null` if not yet set).
 * @observable
 * @api
 */
Layer.prototype.getSource = function() {
  const source = this.get(LayerProperty.SOURCE);
  return (
    /** @type {module:ol/source/Source} */ (source) || null
  );
};


/**
  * @inheritDoc
  */
Layer.prototype.getSourceState = function() {
  const source = this.getSource();
  return !source ? SourceState.UNDEFINED : source.getState();
};


/**
 * @private
 */
Layer.prototype.handleSourceChange_ = function() {
  this.changed();
};


/**
 * @private
 */
Layer.prototype.handleSourcePropertyChange_ = function() {
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
};


/**
 * Sets the layer to be rendered on top of other layers on a map. The map will
 * not manage this layer in its layers collection, and the callback in
 * {@link module:ol/Map#forEachLayerAtPixel} will receive `null` as layer. This
 * is useful for temporary layers. To remove an unmanaged layer from the map,
 * use `#setMap(null)`.
 *
 * To add the layer to a map and have it managed by the map, use
 * {@link module:ol/Map#addLayer} instead.
 * @param {module:ol/PluggableMap} map Map.
 * @api
 */
Layer.prototype.setMap = function(map) {
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
      const layerState = this.getLayerState();
      layerState.managed = false;
      layerState.zIndex = Infinity;
      evt.frameState.layerStatesArray.push(layerState);
      evt.frameState.layerStates[getUid(this)] = layerState;
    }, this);
    this.mapRenderKey_ = listen(this, EventType.CHANGE, map.render, map);
    this.changed();
  }
};


/**
 * Set the layer source.
 * @param {module:ol/source/Source} source The layer source.
 * @observable
 * @api
 */
Layer.prototype.setSource = function(source) {
  this.set(LayerProperty.SOURCE, source);
};
export default Layer;
