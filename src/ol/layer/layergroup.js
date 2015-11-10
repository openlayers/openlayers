goog.provide('ol.layer.Group');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.CollectionEvent');
goog.require('ol.CollectionEventType');
goog.require('ol.Object');
goog.require('ol.ObjectEventType');
goog.require('ol.extent');
goog.require('ol.layer.Base');
goog.require('ol.source.State');


/**
 * @enum {string}
 */
ol.layer.GroupProperty = {
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
 * @api stable
 */
ol.layer.Group = function(opt_options) {

  var options = opt_options || {};
  var baseOptions = /** @type {olx.layer.GroupOptions} */
      (goog.object.clone(options));
  delete baseOptions.layers;

  var layers = options.layers;

  goog.base(this, baseOptions);

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.layersListenerKeys_ = [];

  /**
   * @private
   * @type {Object.<string, Array.<goog.events.Key>>}
   */
  this.listenerKeys_ = {};

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.GroupProperty.LAYERS),
      this.handleLayersChanged_, false, this);

  if (layers) {
    if (goog.isArray(layers)) {
      layers = new ol.Collection(layers.slice());
    } else {
      goog.asserts.assertInstanceof(layers, ol.Collection,
          'layers should be an ol.Collection');
      layers = layers;
    }
  } else {
    layers = new ol.Collection();
  }

  this.setLayers(layers);

};
goog.inherits(ol.layer.Group, ol.layer.Base);


/**
 * @private
 */
ol.layer.Group.prototype.handleLayerChange_ = function() {
  if (this.getVisible()) {
    this.changed();
  }
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.layer.Group.prototype.handleLayersChanged_ = function(event) {
  this.layersListenerKeys_.forEach(goog.events.unlistenByKey);
  this.layersListenerKeys_.length = 0;

  var layers = this.getLayers();
  this.layersListenerKeys_.push(
      goog.events.listen(layers, ol.CollectionEventType.ADD,
          this.handleLayersAdd_, false, this),
      goog.events.listen(layers, ol.CollectionEventType.REMOVE,
          this.handleLayersRemove_, false, this));

  goog.object.forEach(this.listenerKeys_, function(keys) {
    keys.forEach(goog.events.unlistenByKey);
  });
  goog.object.clear(this.listenerKeys_);

  var layersArray = layers.getArray();
  var i, ii, layer;
  for (i = 0, ii = layersArray.length; i < ii; i++) {
    layer = layersArray[i];
    this.listenerKeys_[goog.getUid(layer).toString()] = [
      goog.events.listen(layer, ol.ObjectEventType.PROPERTYCHANGE,
          this.handleLayerChange_, false, this),
      goog.events.listen(layer, goog.events.EventType.CHANGE,
          this.handleLayerChange_, false, this)
    ];
  }

  this.changed();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersAdd_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  var key = goog.getUid(layer).toString();
  goog.asserts.assert(!(key in this.listenerKeys_),
      'listeners already registered');
  this.listenerKeys_[key] = [
    goog.events.listen(layer, ol.ObjectEventType.PROPERTYCHANGE,
        this.handleLayerChange_, false, this),
    goog.events.listen(layer, goog.events.EventType.CHANGE,
        this.handleLayerChange_, false, this)
  ];
  this.changed();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersRemove_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  var key = goog.getUid(layer).toString();
  goog.asserts.assert(key in this.listenerKeys_, 'no listeners to unregister');
  this.listenerKeys_[key].forEach(goog.events.unlistenByKey);
  delete this.listenerKeys_[key];
  this.changed();
};


/**
 * Returns the {@link ol.Collection collection} of {@link ol.layer.Layer layers}
 * in this group.
 * @return {!ol.Collection.<ol.layer.Base>} Collection of
 *   {@link ol.layer.Base layers} that are part of this group.
 * @observable
 * @api stable
 */
ol.layer.Group.prototype.getLayers = function() {
  return /** @type {!ol.Collection.<ol.layer.Base>} */ (this.get(
      ol.layer.GroupProperty.LAYERS));
};


/**
 * Set the {@link ol.Collection collection} of {@link ol.layer.Layer layers}
 * in this group.
 * @param {!ol.Collection.<ol.layer.Base>} layers Collection of
 *   {@link ol.layer.Base layers} that are part of this group.
 * @observable
 * @api stable
 */
ol.layer.Group.prototype.setLayers = function(layers) {
  this.set(ol.layer.GroupProperty.LAYERS, layers);
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
