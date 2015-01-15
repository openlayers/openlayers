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
 * @constructor
 * @extends {ol.layer.Base}
 * @fires change Triggered when the group/Collection changes.
 * @param {olx.layer.GroupOptions=} opt_options Layer options.
 * @api stable
 */
ol.layer.Group = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};
  var baseOptions = /** @type {olx.layer.GroupOptions} */
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

  if (goog.isDefAndNotNull(layers)) {
    if (goog.isArray(layers)) {
      layers = new ol.Collection(layers.slice());
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
          goog.events.listen(layer,
              [ol.ObjectEventType.PROPERTYCHANGE, goog.events.EventType.CHANGE],
              this.handleLayerChange_, false, this);
    }
  }

  this.changed();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersAdd_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  this.listenerKeys_[goog.getUid(layer).toString()] = goog.events.listen(
      layer, [ol.ObjectEventType.PROPERTYCHANGE, goog.events.EventType.CHANGE],
      this.handleLayerChange_, false, this);
  this.changed();
};


/**
 * @param {ol.CollectionEvent} collectionEvent Collection event.
 * @private
 */
ol.layer.Group.prototype.handleLayersRemove_ = function(collectionEvent) {
  var layer = /** @type {ol.layer.Base} */ (collectionEvent.element);
  var key = goog.getUid(layer).toString();
  goog.events.unlistenByKey(this.listenerKeys_[key]);
  delete this.listenerKeys_[key];
  this.changed();
};


/**
 * @return {!ol.Collection.<ol.layer.Base>} Collection of
 * {@link ol.layer.Layer layers} that are part of this group.
 * @observable
 * @api stable
 */
ol.layer.Group.prototype.getLayers = function() {
  return /** @type {!ol.Collection.<ol.layer.Base>} */ (this.get(
      ol.layer.GroupProperty.LAYERS));
};
goog.exportProperty(
    ol.layer.Group.prototype,
    'getLayers',
    ol.layer.Group.prototype.getLayers);


/**
 * @param {!ol.Collection.<ol.layer.Base>} layers Collection of
 * {@link ol.layer.Layer layers} that are part of this group.
 * @observable
 * @api stable
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
  var array = goog.isDef(opt_array) ? opt_array : [];
  this.getLayers().forEach(function(layer) {
    layer.getLayersArray(array);
  });
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.Group.prototype.getLayerStatesArray = function(opt_states) {
  var states = goog.isDef(opt_states) ? opt_states : [];

  var pos = states.length;

  this.getLayers().forEach(function(layer) {
    layer.getLayerStatesArray(states);
  });

  var ownLayerState = this.getLayerState();
  var i, ii, layerState;
  for (i = pos, ii = states.length; i < ii; i++) {
    layerState = states[i];
    layerState.brightness = goog.math.clamp(
        layerState.brightness + ownLayerState.brightness, -1, 1);
    layerState.contrast *= ownLayerState.contrast;
    layerState.hue += ownLayerState.hue;
    layerState.opacity *= ownLayerState.opacity;
    layerState.saturation *= ownLayerState.saturation;
    layerState.visible = layerState.visible && ownLayerState.visible;
    layerState.maxResolution = Math.min(
        layerState.maxResolution, ownLayerState.maxResolution);
    layerState.minResolution = Math.max(
        layerState.minResolution, ownLayerState.minResolution);
    if (goog.isDef(ownLayerState.extent)) {
      if (goog.isDef(layerState.extent)) {
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
