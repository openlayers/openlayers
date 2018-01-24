/**
 * @module ol/layer/Group
 */
import {getUid, inherits} from '../index.js';
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import BaseObject from '../Object.js';
import ObjectEventType from '../ObjectEventType.js';
import {assert} from '../asserts.js';
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {getIntersection} from '../extent.js';
import BaseLayer from '../layer/Base.js';
import {assign, clear} from '../obj.js';
import SourceState from '../source/State.js';


/**
 * @enum {string}
 * @private
 */
const Property = {
  LAYERS: 'layers'
};


/**
 * @classdesc
 * A {@link ol.Collection} of layers that are handled together.
 *
 * A generic `change` event is triggered when the group/Collection changes.
 *
 * @constructor
 * @extends {ol.layer.Base}
 * @param {olx.layer.GroupOptions=} opt_options Layer options.
 * @api
 */
const LayerGroup = function(opt_options) {

  const options = opt_options || {};
  const baseOptions = /** @type {olx.layer.GroupOptions} */ (assign({}, options));
  delete baseOptions.layers;

  let layers = options.layers;

  BaseLayer.call(this, baseOptions);

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
   */
  this.layersListenerKeys_ = [];

  /**
   * @private
   * @type {Object.<string, Array.<ol.EventsKey>>}
   */
  this.listenerKeys_ = {};

  listen(this,
    BaseObject.getChangeEventType(Property.LAYERS),
    this.handleLayersChanged_, this);

  if (layers) {
    if (Array.isArray(layers)) {
      layers = new Collection(layers.slice(), {unique: true});
    } else {
      assert(layers instanceof Collection,
        43); // Expected `layers` to be an array or an `ol.Collection`
      layers = layers;
    }
  } else {
    layers = new Collection(undefined, {unique: true});
  }

  this.setLayers(layers);

};

inherits(LayerGroup, BaseLayer);


/**
 * @private
 */
LayerGroup.prototype.handleLayerChange_ = function() {
  this.changed();
};


/**
 * @param {ol.events.Event} event Event.
 * @private
 */
LayerGroup.prototype.handleLayersChanged_ = function(event) {
  this.layersListenerKeys_.forEach(unlistenByKey);
  this.layersListenerKeys_.length = 0;

  const layers = this.getLayers();
  this.layersListenerKeys_.push(
    listen(layers, CollectionEventType.ADD,
      this.handleLayersAdd_, this),
    listen(layers, CollectionEventType.REMOVE,
      this.handleLayersRemove_, this));

  for (const id in this.listenerKeys_) {
    this.listenerKeys_[id].forEach(unlistenByKey);
  }
  clear(this.listenerKeys_);

  const layersArray = layers.getArray();
  for (let i = 0, ii = layersArray.length; i < ii; i++) {
    const layer = layersArray[i];
    this.listenerKeys_[getUid(layer).toString()] = [
      listen(layer, ObjectEventType.PROPERTYCHANGE,
        this.handleLayerChange_, this),
      listen(layer, EventType.CHANGE,
        this.handleLayerChange_, this)
    ];
  }

  this.changed();
};


/**
 * @param {ol.Collection.Event} collectionEvent Collection event.
 * @private
 */
LayerGroup.prototype.handleLayersAdd_ = function(collectionEvent) {
  const layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  const key = getUid(layer).toString();
  this.listenerKeys_[key] = [
    listen(layer, ObjectEventType.PROPERTYCHANGE,
      this.handleLayerChange_, this),
    listen(layer, EventType.CHANGE,
      this.handleLayerChange_, this)
  ];
  this.changed();
};


/**
 * @param {ol.Collection.Event} collectionEvent Collection event.
 * @private
 */
LayerGroup.prototype.handleLayersRemove_ = function(collectionEvent) {
  const layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  const key = getUid(layer).toString();
  this.listenerKeys_[key].forEach(unlistenByKey);
  delete this.listenerKeys_[key];
  this.changed();
};


/**
 * Returns the {@link ol.Collection collection} of {@link ol.layer.Layer layers}
 * in this group.
 * @return {!ol.Collection.<ol.layer.Base>} Collection of
 *   {@link ol.layer.Base layers} that are part of this group.
 * @observable
 * @api
 */
LayerGroup.prototype.getLayers = function() {
  return (/** @type {!ol.Collection.<ol.layer.Base>} */ this.get(Property.LAYERS));
};


/**
 * Set the {@link ol.Collection collection} of {@link ol.layer.Layer layers}
 * in this group.
 * @param {!ol.Collection.<ol.layer.Base>} layers Collection of
 *   {@link ol.layer.Base layers} that are part of this group.
 * @observable
 * @api
 */
LayerGroup.prototype.setLayers = function(layers) {
  this.set(Property.LAYERS, layers);
};


/**
 * @inheritDoc
 */
LayerGroup.prototype.getLayersArray = function(opt_array) {
  const array = opt_array !== undefined ? opt_array : [];
  this.getLayers().forEach(function(layer) {
    layer.getLayersArray(array);
  });
  return array;
};


/**
 * @inheritDoc
 */
LayerGroup.prototype.getLayerStatesArray = function(opt_states) {
  const states = opt_states !== undefined ? opt_states : [];

  const pos = states.length;

  this.getLayers().forEach(function(layer) {
    layer.getLayerStatesArray(states);
  });

  const ownLayerState = this.getLayerState();
  for (let i = pos, ii = states.length; i < ii; i++) {
    const layerState = states[i];
    layerState.opacity *= ownLayerState.opacity;
    layerState.visible = layerState.visible && ownLayerState.visible;
    layerState.maxResolution = Math.min(
      layerState.maxResolution, ownLayerState.maxResolution);
    layerState.minResolution = Math.max(
      layerState.minResolution, ownLayerState.minResolution);
    if (ownLayerState.extent !== undefined) {
      if (layerState.extent !== undefined) {
        layerState.extent = getIntersection(layerState.extent, ownLayerState.extent);
      } else {
        layerState.extent = ownLayerState.extent;
      }
    }
  }

  return states;
};


/**
 * @inheritDoc
 */
LayerGroup.prototype.getSourceState = function() {
  return SourceState.READY;
};

export default LayerGroup;
