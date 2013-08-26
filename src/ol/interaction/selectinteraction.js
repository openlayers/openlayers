goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.condition');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.source.Vector');


/**
 * @typedef {{layer: ol.layer.Layer,
 *            map: ol.Map,
 *            selected: (Array.<ol.Feature>|undefined),
 *            type: goog.events.EventType,
 *            unselected: (Array.<ol.Feature>|undefined)}}
 */
ol.interaction.SelectEventObject;



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {ol.interaction.SelectOptions=} opt_options Options.
 */
ol.interaction.Select = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * Mapping between original features and cloned features on selection layers.
   * @type {Object.<*,Object.<*,ol.Feature>>}
   * @private
   */
  this.featureMap_ = {};

  /**
   * Mapping between original layers and selection layers, by map.
   * @type {Object.<*,{map:ol.Map,layers:Object.<*,ol.layer.Vector>}>}
   * @protected
   */
  this.selectionLayers = {};

  /**
   * @type {null|function(ol.layer.Layer):boolean}
   * @private
   */
  this.layerFilter_ = goog.isDef(options.layerFilter) ?
      options.layerFilter : null;

  goog.base(this);
};
goog.inherits(ol.interaction.Select, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.Select.prototype.disposeInternal = function() {
  for (var m in this.selectionLayers) {
    var selectionLayers = this.selectionLayers[m].layers;
    var map = this.selectionLayers[m].map;
    for (var l in selectionLayers) {
      map.removeLayer(selectionLayers[l]);
    }
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc.
 */
ol.interaction.Select.prototype.handleMapBrowserEvent = function(evt) {
  if (evt.type === ol.MapBrowserEvent.EventType.CLICK) {
    var map = evt.map;
    var layers = map.getLayerGroup().getLayersArray();
    if (!goog.isNull(this.layerFilter_)) {
      layers = goog.array.filter(layers, this.layerFilter_);
    }
    var clear = !ol.interaction.condition.shiftKeyOnly(evt.browserEvent);

    var select = function(featuresByLayer) {
      this.select(map, featuresByLayer, layers, clear);
    };

    map.getFeatures({
      layers: layers,
      pixel: evt.getPixel(),
      success: goog.bind(select, this)
    });
  }
  // TODO: Implement box selection
  return true;
};


/**
 * @param {ol.Map} map The map where the selction event originated.
 * @param {Array.<Array.<ol.Feature>>} featuresByLayer Features by layer.
 * @param {Array.<ol.layer.Layer>} layers The queried layers.
 * @param {boolean} clear Whether the current layer content should be cleared.
 */
ol.interaction.Select.prototype.select =
    function(map, featuresByLayer, layers, clear) {
  var mapId = goog.getUid(map);
  for (var i = 0, ii = featuresByLayer.length; i < ii; ++i) {
    var layer = layers[i];
    var layerId = goog.getUid(layer);
    if (!(mapId in this.selectionLayers)) {
      this.selectionLayers[mapId] = {map: map, layers: {}};
    }
    var selectionLayer = this.selectionLayers[mapId].layers[layerId];
    if (!goog.isDef(selectionLayer)) {
      goog.asserts.assertFunction(layer.getStyle,
          'At least one of the layers has no "getStyle()" function.');
      selectionLayer = new ol.layer.Vector({
        source: new ol.source.Vector({parser: null}),
        style: layer.getStyle()
      });
      selectionLayer.setTemporary(true);
      map.addLayer(selectionLayer);
      this.selectionLayers[mapId].layers[layerId] = selectionLayer;
      this.featureMap_[layerId] = {};
    }

    var features = featuresByLayer[i];
    var numFeatures = features.length;
    var selectedFeatures = [];
    var featuresToAdd = [];
    var unselectedFeatures = [];
    var featuresToRemove = [];
    var featureMap = this.featureMap_[layerId];
    var oldFeatureMap = featureMap;
    if (clear) {
      for (var f in featureMap) {
        unselectedFeatures.push(layer.getFeatureWithUid(f));
        featuresToRemove.push(featureMap[f]);
      }
      featureMap = {};
      this.featureMap_[layerId] = featureMap;
    }
    for (var j = 0; j < numFeatures; ++j) {
      var feature = features[j];
      var featureId = goog.getUid(feature);
      var clone = featureMap[featureId];
      if (clone) {
        // TODO: make toggle configurable
        unselectedFeatures.push(feature);
        featuresToRemove.push(clone);
        delete featureMap[featureId];
      } else if (!(featureId in oldFeatureMap)) {
        clone = feature.clone();
        featureMap[featureId] = clone;
        clone.renderIntent = ol.layer.VectorLayerRenderIntent.SELECTED;
        selectedFeatures.push(feature);
        featuresToAdd.push(clone);
      }
    }
    if (goog.isFunction(layer.setRenderIntent)) {
      layer.setRenderIntent(ol.layer.VectorLayerRenderIntent.HIDDEN,
          selectedFeatures);
      layer.setRenderIntent(ol.layer.VectorLayerRenderIntent.DEFAULT,
          unselectedFeatures);
    }
    selectionLayer.removeFeatures(featuresToRemove);
    selectionLayer.addFeatures(featuresToAdd);
    this.dispatchEvent(/** @type {ol.interaction.SelectEventObject} */ ({
      layer: layer,
      map: map,
      selected: selectedFeatures,
      type: goog.events.EventType.CHANGE,
      unselected: unselectedFeatures
    }));
  }
};
