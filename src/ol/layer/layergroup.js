goog.provide('ol.layer.LayerGroup');

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
goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerBase');


/**
 * @enum {string}
 */
ol.layer.LayerGroupProperty = {
  LAYERS: 'layers'
};



/**
 * @constructor
 * @extends {ol.layer.LayerBase}
 * @param {ol.layer.LayerGroupOptions=} opt_options Layer options.
 */
ol.layer.LayerGroup = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};
  var baseOptions = /** @type {ol.layer.LayerGroupOptions} */
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
      ol.Object.getChangeEventType(ol.layer.LayerGroupProperty.LAYERS),
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
goog.inherits(ol.layer.LayerGroup, ol.layer.LayerBase);


/**
 * @inheritDoc
 */
ol.layer.LayerGroup.prototype.handleLayerChange = function() {
  if (this.getVisible()) {
    this.dispatchChangeEvent();
  }
};


/**
 * @inheritDoc
 */
ol.layer.LayerGroup.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.layer.LayerGroup.prototype.handleLayersChanged_ = function(event) {
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
ol.layer.LayerGroup.prototype.handleLayersAdd_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.LayerBase} */ (collectionEvent.getElement());
  this.listenerKeys_[goog.getUid(layer).toString()] = goog.events.listen(
      layer, goog.events.EventType.CHANGE, this.handleLayerChange, false,
      this);
  this.dispatchChangeEvent();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.LayerGroup.prototype.handleLayersRemove_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.LayerBase} */ (collectionEvent.getElement());
  var key = goog.getUid(layer).toString();
  goog.events.unlistenByKey(this.listenerKeys_[key]);
  delete this.listenerKeys_[key];
  this.dispatchChangeEvent();
};


/**
 * @return {ol.Collection} Collection of layers.
 */
ol.layer.LayerGroup.prototype.getLayers = function() {
  return /** @type {ol.Collection} */ (this.get(
      ol.layer.LayerGroupProperty.LAYERS));
};
goog.exportProperty(
    ol.layer.LayerGroup.prototype,
    'getLayers',
    ol.layer.LayerGroup.prototype.getLayers);


/**
 * @param {ol.Collection} layers Collection of layers.
 */
ol.layer.LayerGroup.prototype.setLayers = function(layers) {
  this.set(ol.layer.LayerGroupProperty.LAYERS, layers);
};
goog.exportProperty(
    ol.layer.LayerGroup.prototype,
    'setLayers',
    ol.layer.LayerGroup.prototype.setLayers);


/**
 * @inheritDoc
 */
ol.layer.LayerGroup.prototype.getLayersArray = function(opt_array) {
  var array = (goog.isDef(opt_array)) ? opt_array : [];
  this.getLayers().forEach(function(layer) {
    layer.getLayersArray(array);
  });
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.LayerGroup.prototype.getLayerStatesArray = function(opt_obj) {
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
    layerState.visible = layerState.visible && ownLayerState.visible;
  }

  return obj;
};


/**
 * @inheritDoc
 */
ol.layer.LayerGroup.prototype.isReady = function() {
  return null === goog.array.find(
      this.getLayers().getArray(), function(elt, index, array) {
        return !elt.isReady();
      });
};
