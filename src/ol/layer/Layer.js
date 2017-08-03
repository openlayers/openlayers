/**
 * @module ol/layer/Layer
 */
import _ol_events_ from '../events.js';
import EventType from '../events/EventType.js';
import {getUid, inherits} from '../index.js';
import BaseObject from '../Object.js';
import BaseLayer from '../layer/Base.js';
import LayerProperty from '../layer/Property.js';
import _ol_obj_ from '../obj.js';
import RenderEventType from '../render/EventType.js';
import SourceState from '../source/State.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with {@link ol.Map#addLayer}. Components
 * like {@link ol.interaction.Select} use unmanaged layers internally. These
 * unmanaged layers are associated with the map using
 * {@link ol.layer.Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 *
 * @constructor
 * @abstract
 * @extends {ol.layer.Base}
 * @fires ol.render.Event
 * @param {olx.layer.LayerOptions} options Layer options.
 * @api
 */
var Layer = function(options) {

  var baseOptions = _ol_obj_.assign({}, options);
  delete baseOptions.source;

  BaseLayer.call(this, /** @type {olx.layer.BaseOptions} */ (baseOptions));

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.mapPrecomposeKey_ = null;

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.mapRenderKey_ = null;

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.sourceChangeKey_ = null;

  if (options.map) {
    this.setMap(options.map);
  }

  _ol_events_.listen(this,
      BaseObject.getChangeEventType(LayerProperty.SOURCE),
      this.handleSourcePropertyChange_, this);

  var source = options.source ? options.source : null;
  this.setSource(source);
};

inherits(Layer, BaseLayer);


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {ol.LayerState} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
Layer.visibleAtResolution = function(layerState, resolution) {
  return layerState.visible && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
};


/**
 * @inheritDoc
 */
Layer.prototype.getLayersArray = function(opt_array) {
  var array = opt_array ? opt_array : [];
  array.push(this);
  return array;
};


/**
 * @inheritDoc
 */
Layer.prototype.getLayerStatesArray = function(opt_states) {
  var states = opt_states ? opt_states : [];
  states.push(this.getLayerState());
  return states;
};


/**
 * Get the layer source.
 * @return {ol.source.Source} The layer source (or `null` if not yet set).
 * @observable
 * @api
 */
Layer.prototype.getSource = function() {
  var source = this.get(LayerProperty.SOURCE);
  return /** @type {ol.source.Source} */ (source) || null;
};


/**
  * @inheritDoc
  */
Layer.prototype.getSourceState = function() {
  var source = this.getSource();
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
    _ol_events_.unlistenByKey(this.sourceChangeKey_);
    this.sourceChangeKey_ = null;
  }
  var source = this.getSource();
  if (source) {
    this.sourceChangeKey_ = _ol_events_.listen(source,
        EventType.CHANGE, this.handleSourceChange_, this);
  }
  this.changed();
};


/**
 * Sets the layer to be rendered on top of other layers on a map (unless
 * a Z-index is specified). The map will not manage this layer in its layers
 * collection, and the callback in {@link ol.Map#forEachLayerAtPixel} will
 * receive `null` as layer. This is useful for temporary layers. To remove an
 * unmanaged layer from the map, use `#setMap(null)`.
 *
 * To add the layer to a map and have it managed by the map, use
 * {@link ol.Map#addLayer} instead.
 * @param {ol.PluggableMap} map Map.
 * @api
 */
Layer.prototype.setMap = function(map) {
  if (this.mapPrecomposeKey_) {
    _ol_events_.unlistenByKey(this.mapPrecomposeKey_);
    this.mapPrecomposeKey_ = null;
  }
  if (!map) {
    this.changed();
  }
  if (this.mapRenderKey_) {
    _ol_events_.unlistenByKey(this.mapRenderKey_);
    this.mapRenderKey_ = null;
  }
  if (map) {
    this.mapPrecomposeKey_ = _ol_events_.listen(
        map, RenderEventType.PRECOMPOSE, function(evt) {
          var layerState = this.getLayerState();
          var zIndex = this.getZIndex();
          layerState.managed = false;
          layerState.zIndex = (goog.isDef(zIndex) && zIndex !== 0) ? zIndex : Infinity;
          evt.frameState.layerStatesArray.push(layerState);
          evt.frameState.layerStates[getUid(this)] = layerState;
        }, this);
    this.mapRenderKey_ = _ol_events_.listen(
        this, EventType.CHANGE, map.render, map);
    this.changed();
  }
};


/**
 * Set the layer source.
 * @param {ol.source.Source} source The layer source.
 * @observable
 * @api
 */
Layer.prototype.setSource = function(source) {
  this.set(LayerProperty.SOURCE, source);
};
export default Layer;
