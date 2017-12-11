goog.provide('ol.layer.Group');

goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Object');
goog.require('ol.ObjectEventType');
goog.require('ol.asserts');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.layer.Base');
goog.require('ol.obj');
goog.require('ol.source.State');


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
ol.layer.Group = function(opt_options) {

  var options = opt_options || {};
  var baseOptions = /** @type {olx.layer.GroupOptions} */
      (ol.obj.assign({}, options));
  delete baseOptions.layers;

  var layers = options.layers;

  ol.layer.Base.call(this, baseOptions);

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

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.Group.Property_.LAYERS),
      this.handleLayersChanged_, this);

  if (layers) {
    if (Array.isArray(layers)) {
      layers = new ol.Collection(layers.slice(), {unique: true});
    } else {
      ol.asserts.assert(layers instanceof ol.Collection,
          43); // Expected `layers` to be an array or an `ol.Collection`
      layers = layers;
    }
  } else {
    layers = new ol.Collection(undefined, {unique: true});
  }

  this.setLayers(layers);

};
ol.inherits(ol.layer.Group, ol.layer.Base);


/**
 * @private
 */
ol.layer.Group.prototype.handleLayerChange_ = function() {
  this.changed();
};


/**
 * @param {ol.events.Event} event Event.
 * @private
 */
ol.layer.Group.prototype.handleLayersChanged_ = function(event) {
  this.layersListenerKeys_.forEach(ol.events.unlistenByKey);
  this.layersListenerKeys_.length = 0;

  var layers = this.getLayers();
  this.layersListenerKeys_.push(
      ol.events.listen(layers, ol.CollectionEventType.ADD,
          this.handleLayersAdd_, this),
      ol.events.listen(layers, ol.CollectionEventType.REMOVE,
          this.handleLayersRemove_, this));

  for (var id in this.listenerKeys_) {
    this.listenerKeys_[id].forEach(ol.events.unlistenByKey);
  }
  ol.obj.clear(this.listenerKeys_);

  var layersArray = layers.getArray();
  var i, ii, layer;
  for (i = 0, ii = layersArray.length; i < ii; i++) {
    layer = layersArray[i];
    this.listenerKeys_[ol.getUid(layer).toString()] = [
      ol.events.listen(layer, ol.ObjectEventType.PROPERTYCHANGE,
          this.handleLayerChange_, this),
      ol.events.listen(layer, ol.events.EventType.CHANGE,
          this.handleLayerChange_, this)
    ];
  }

  this.changed();
};


/**
 * @param {ol.Collection.Event} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersAdd_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  var key = ol.getUid(layer).toString();
  this.listenerKeys_[key] = [
    ol.events.listen(layer, ol.ObjectEventType.PROPERTYCHANGE,
        this.handleLayerChange_, this),
    ol.events.listen(layer, ol.events.EventType.CHANGE,
        this.handleLayerChange_, this)
  ];
  this.changed();
};


/**
 * @param {ol.Collection.Event} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersRemove_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  var key = ol.getUid(layer).toString();
  this.listenerKeys_[key].forEach(ol.events.unlistenByKey);
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
ol.layer.Group.prototype.getLayers = function() {
  return /** @type {!ol.Collection.<ol.layer.Base>} */ (this.get(
      ol.layer.Group.Property_.LAYERS));
};


/**
 * Set the {@link ol.Collection collection} of {@link ol.layer.Layer layers}
 * in this group.
 * @param {!ol.Collection.<ol.layer.Base>} layers Collection of
 *   {@link ol.layer.Base layers} that are part of this group.
 * @observable
 * @api
 */
ol.layer.Group.prototype.setLayers = function(layers) {
  this.set(ol.layer.Group.Property_.LAYERS, layers);
};


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.getLayersArray = function(opt_array) {
  var array = opt_array !== undefined ? opt_array : [];
  this.getLayers().forEach(function(layer) {
    layer.getLayersArray(array);
  });
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.getLayerStatesArray = function(opt_states) {
  var states = opt_states !== undefined ? opt_states : [];

  var pos = states.length;

  this.getLayers().forEach(function(layer) {
    layer.getLayerStatesArray(states);
  });

  var ownLayerState = this.getLayerState();
  var i, ii, layerState;
  for (i = pos, ii = states.length; i < ii; i++) {
    layerState = states[i];
    layerState.opacity *= ownLayerState.opacity;
    layerState.visible = layerState.visible && ownLayerState.visible;
    layerState.maxResolution = Math.min(
        layerState.maxResolution, ownLayerState.maxResolution);
    layerState.minResolution = Math.max(
        layerState.minResolution, ownLayerState.minResolution);
    if (ownLayerState.extent !== undefined) {
      if (layerState.extent !== undefined) {
        layerState.extent = ol.extent.getIntersection(
            layerState.extent, ownLayerState.extent);
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
ol.layer.Group.prototype.getSourceState = function() {
  return ol.source.State.READY;
};

/**
 * @enum {string}
 * @private
 */
ol.layer.Group.Property_ = {
  LAYERS: 'layers'
};
