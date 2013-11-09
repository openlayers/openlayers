goog.provide('ol.layer.Group');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.Collection');
goog.require('ol.CollectionEvent');
goog.require('ol.CollectionEventType');
goog.require('ol.Object');
goog.require('ol.layer.Base');
goog.require('ol.source.State');


/**
 * @enum {string}
 */
ol.layer.GroupProperty = {
  LAYERS: 'layers'
};



/**
 * @constructor
 * @extends {ol.layer.Base}
 * @param {ol.layer.GroupOptions=} opt_options Layer options.
 * @todo stability experimental
 * @todo observable layers {ol.Collection} collection of layers that are part
 *       of this group
 */
ol.layer.Group = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};
  var baseOptions = /** @type {ol.layer.GroupOptions} */
      (goog.object.clone(options));
  delete baseOptions.layers;

  var layers = options.layers;

  goog.base(this, baseOptions);

  /**
   * @private
   * @type {Object.<string, goog.events.Key>}
   */
  this.listenerKeys_ = null;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.GroupProperty.LAYERS),
      this.handleLayersChanged_, false, this);

  if (goog.isDef(layers)) {
    if (goog.isArray(layers)) {
      layers = new ol.Collection(goog.array.clone(layers));
    } else {
      goog.asserts.assertInstanceof(layers, ol.Collection);
      layers = layers;
    }
  } else {
    layers = new ol.Collection();
  }

  this.setLayers(layers);

};
goog.inherits(ol.layer.Group, ol.layer.Base);


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.handleLayerChange = function() {
  if (this.getVisible()) {
    this.dispatchChangeEvent();
  }
};


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.layer.Group.prototype.handleLayersChanged_ = function(event) {
  if (!goog.isNull(this.listenerKeys_)) {
    goog.array.forEach(
        goog.object.getValues(this.listenerKeys_), goog.events.unlistenByKey);
    this.listenerKeys_ = null;
  }

  var layers = this.getLayers();
  if (goog.isDefAndNotNull(layers)) {
    this.listenerKeys_ = {
      'add': goog.events.listen(layers, ol.CollectionEventType.ADD,
          this.handleLayersAdd_, false, this),
      'remove': goog.events.listen(layers, ol.CollectionEventType.REMOVE,
          this.handleLayersRemove_, false, this)
    };

    var layersArray = layers.getArray();
    var i, ii, layer;
    for (i = 0, ii = layersArray.length; i < ii; i++) {
      layer = layersArray[i];
      this.listenerKeys_[goog.getUid(layer).toString()] =
          goog.events.listen(layer, goog.events.EventType.CHANGE,
              this.handleLayerChange, false, this);
    }
  }

  this.dispatchChangeEvent();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersAdd_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.getElement());
  this.listenerKeys_[goog.getUid(layer).toString()] = goog.events.listen(
      layer, goog.events.EventType.CHANGE, this.handleLayerChange, false,
      this);
  this.dispatchChangeEvent();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersRemove_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.getElement());
  var key = goog.getUid(layer).toString();
  goog.events.unlistenByKey(this.listenerKeys_[key]);
  delete this.listenerKeys_[key];
  this.dispatchChangeEvent();
};


/**
 * @return {ol.Collection} Collection of layers.
 * @todo stability experimental
 */
ol.layer.Group.prototype.getLayers = function() {
  return /** @type {ol.Collection} */ (this.get(
      ol.layer.GroupProperty.LAYERS));
};
goog.exportProperty(
    ol.layer.Group.prototype,
    'getLayers',
    ol.layer.Group.prototype.getLayers);


/**
 * @param {ol.Collection} layers Collection of layers.
 * @todo stability experimental
 */
ol.layer.Group.prototype.setLayers = function(layers) {
  this.set(ol.layer.GroupProperty.LAYERS, layers);
};
goog.exportProperty(
    ol.layer.Group.prototype,
    'setLayers',
    ol.layer.Group.prototype.setLayers);


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.getLayersArray = function(opt_array) {
  var array = (goog.isDef(opt_array)) ? opt_array : [];
  this.getLayers().forEach(function(layer) {
    layer.getLayersArray(array);
  });
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.getLayerStatesArray = function(opt_obj) {
  var obj = (goog.isDef(opt_obj)) ? opt_obj : {
    layers: [],
    layerStates: []
  };
  goog.asserts.assert(obj.layers.length === obj.layerStates.length);
  var pos = obj.layers.length;

  this.getLayers().forEach(function(layer) {
    layer.getLayerStatesArray(obj);
  });

  var ownLayerState = this.getLayerState();
  var i, ii, layerState;
  for (i = pos, ii = obj.layerStates.length; i < ii; i++) {
    layerState = obj.layerStates[i];
    layerState.brightness = goog.math.clamp(
        layerState.brightness + ownLayerState.brightness, -1, 1);
    layerState.contrast *= ownLayerState.contrast;
    layerState.hue += ownLayerState.hue;
    layerState.opacity *= ownLayerState.opacity;
    layerState.saturation *= ownLayerState.saturation;
    layerState.sourceState = this.getSourceState();
    layerState.visible = layerState.visible && ownLayerState.visible;
    layerState.maxResolution = Math.min(
        layerState.maxResolution, ownLayerState.maxResolution);
    layerState.minResolution = Math.max(
        layerState.minResolution, ownLayerState.minResolution);
  }

  return obj;
};


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.getSourceState = function() {
  // Return the layer group's source state based on the best source state of its
  // children:
  // - if any child is READY, return READY
  // - otherwise, if any child is LOADING, return LOADING
  // - otherwise, all children must be in ERROR, return ERROR
  // - otherwise, there are no children, return READY
  var layerSourceStates = [0, 0, 0];
  var layers = this.getLayers().getArray();
  var n = layers.length;
  var i;
  for (i = 0; i < n; ++i) {
    var layerSourceState = layers[i].getSourceState();
    goog.asserts.assert(layerSourceState < layerSourceStates.length);
    ++layerSourceStates[layerSourceState];
  }
  if (layerSourceStates[ol.source.State.READY]) {
    return ol.source.State.READY;
  } else if (layerSourceStates[ol.source.State.LOADING]) {
    return ol.source.State.LOADING;
  } else if (layerSourceStates[ol.source.State.ERROR]) {
    goog.asserts.assert(layerSourceStates[ol.source.State.ERROR] == n);
    return ol.source.State.ERROR;
  } else {
    goog.asserts.assert(n === 0);
    return ol.source.State.READY;
  }
};
