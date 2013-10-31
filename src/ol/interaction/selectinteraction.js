goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.source.Vector');



/**
 * Allows the user to select features on the map.
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {ol.interaction.SelectOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.interaction.Select = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.events.condition.singleClick;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.addCondition_ = goog.isDef(options.addCondition) ?
      options.addCondition : ol.events.condition.shiftKeyOnly;

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
 * @inheritDoc.
 */
ol.interaction.Select.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    var layers = map.getLayerGroup().getLayersArray();
    if (!goog.isNull(this.layerFilter_)) {
      layers = goog.array.filter(layers, this.layerFilter_);
    }
    var clear = !this.addCondition_(mapBrowserEvent);

    var that = this;
    var select = function(featuresByLayer) {
      that.select(map, featuresByLayer, layers, clear);
    };

    map.getFeatures({
      layers: layers,
      pixel: mapBrowserEvent.getPixel(),
      success: select
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
  if (!(mapId in this.selectionLayers)) {
    this.selectionLayers[mapId] = {map: map, layers: {}};
  }
  for (var i = 0, ii = featuresByLayer.length; i < ii; ++i) {
    var layer = layers[i];
    var layerId = goog.getUid(layer);
    var selectionLayer = this.selectionLayers[mapId].layers[layerId];
    if (!goog.isDef(selectionLayer)) {
      selectionLayer = new ol.layer.Vector({
        source: new ol.source.Vector({parser: null}),
        style: layer instanceof ol.layer.Vector ? layer.getStyle() : null
      });
      selectionLayer.setTemporary(true);
      map.addLayer(selectionLayer);
      this.selectionLayers[mapId].layers[layerId] = selectionLayer;
      this.featureMap_[layerId] = {};
    }

    var selectedFeatures, unselectedFeatures;
    if (goog.isFunction(layer.setRenderIntent)) {
      selectedFeatures = [];
      unselectedFeatures = [];
    }
    var features = featuresByLayer[i];
    var numFeatures = features.length;
    var featuresToAdd = [];
    var featuresToRemove = [];
    var featureMap = this.featureMap_[layerId];
    var oldFeatureMap = featureMap;
    if (clear) {
      for (var f in featureMap) {
        if (goog.isDef(unselectedFeatures)) {
          unselectedFeatures.push(layer.getFeatureWithUid(f));
        }
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
        if (goog.isDef(unselectedFeatures)) {
          unselectedFeatures.push(feature);
        }
        delete featureMap[featureId];
        featuresToRemove.push(clone);
      } else if (!(featureId in oldFeatureMap)) {
        clone = new ol.Feature(feature.getAttributes());
        clone.setGeometry(feature.getGeometry().clone());
        clone.setId(feature.getId());
        clone.setSymbolizers(feature.getSymbolizers());
        clone.renderIntent = ol.layer.VectorLayerRenderIntent.SELECTED;
        featureMap[featureId] = clone;
        if (goog.isDef(selectedFeatures)) {
          selectedFeatures.push(feature);
        }
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
    if (goog.object.getCount(featureMap) == 0) {
      map.removeLayer(selectionLayer);
      delete this.selectionLayers[mapId].layers[layerId];
      delete this.featureMap_[layerId];
    }
    // TODO: Dispatch an event with selectedFeatures and unselectedFeatures
  }
};
