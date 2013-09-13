goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.condition');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorLayerRenderIntent');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {ol.interaction.SelectOptions=} opt_options Options.
 */
ol.interaction.Select = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.clickOnly;

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
 * @param {ol.layer.Layer} layer Layer.
 * @param {ol.Feature} feature Feature.
 * @return {ol.Feature} The added selected feature.
 */
ol.interaction.Select.prototype.addToSelectionData =
    function(layer, feature) {
  var selectionData = layer.getSelectionData();
  var selectedFeature = new ol.Feature(feature.getAttributes());
  selectedFeature.setGeometry(feature.getGeometry().clone());
  selectedFeature.setFeatureId(feature.getFeatureId());
  selectedFeature.setSymbolizers(feature.getSymbolizers());
  selectedFeature.renderIntent = ol.layer.VectorLayerRenderIntent.SELECTED;
  selectionData.featuresBySelectedFeatureUid[goog.getUid(selectedFeature)] =
      feature;
  selectionData.selectedFeaturesByFeatureUid[goog.getUid(feature)] =
      selectedFeature;
  return selectedFeature;
};


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
    var clear = !ol.interaction.condition.shiftKeyOnly(mapBrowserEvent);

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
 * @param {ol.layer.Layer} layer Layer.
 * @param {ol.Feature} feature Feature.
 * @return {ol.Feature} The removed selected feature.
 */
ol.interaction.Select.prototype.removeFromSelectionData =
    function(layer, feature) {
  var selectionData = layer.getSelectionData();
  var featureUid = goog.getUid(feature);
  var selectedFeatures = selectionData.selectedFeaturesByFeatureUid;
  var selectedFeature = selectedFeatures[featureUid];
  delete selectedFeatures[featureUid];
  delete selectionData
      .featuresBySelectedFeatureUid[goog.getUid(selectedFeature)];
  return selectedFeature;
};


/**
 * @param {ol.Map} map The map where the selction event originated.
 * @param {Array.<Array.<ol.Feature>>} featuresByLayer Features by layer.
 * @param {Array.<ol.layer.Layer>} layers The queried layers.
 * @param {boolean} clear Whether the current layer content should be cleared.
 */
ol.interaction.Select.prototype.select =
    function(map, featuresByLayer, layers, clear) {
  for (var i = 0, ii = featuresByLayer.length; i < ii; ++i) {
    var layer = layers[i];
    var selectionData = layer.getSelectionData();
    var selectionLayer = selectionData.layer;
    if (goog.isNull(selectionLayer)) {
      selectionLayer = new ol.layer.Vector({
        source: new ol.source.Vector({parser: null}),
        style: layer instanceof ol.layer.Vector ? layer.getStyle() : null
      });
      selectionLayer.setTemporary(true);
      selectionData.layer = selectionLayer;
    }
    if (goog.array.indexOf(map.getLayers().getArray(), selectionLayer) == -1) {
      map.addLayer(selectionLayer);
    }

    var features = featuresByLayer[i];
    var numFeatures = features.length;
    var selectedFeatures = [];
    var featuresToAdd = [];
    var unselectedFeatures = [];
    var featuresToRemove = [];
    var selectedFeaturesByFeatureUid =
        selectionData.selectedFeaturesByFeatureUid;
    var featuresBySelectedFeatureUid =
        selectionData.featuresBySelectedFeatureUid;
    var previouslySelected = {};
    goog.object.extend(previouslySelected, selectedFeaturesByFeatureUid);
    var feature, featureId;
    if (clear) {
      for (var f in featuresBySelectedFeatureUid) {
        feature = featuresBySelectedFeatureUid[f];
        unselectedFeatures.push(feature);
        featuresToRemove.push(this.removeFromSelectionData(layer, feature));
      }
    }
    for (var j = 0; j < numFeatures; ++j) {
      feature = features[j];
      featureId = goog.getUid(feature);
      var clone = selectedFeaturesByFeatureUid[featureId];
      if (clone) {
        // TODO: make toggle configurable
        unselectedFeatures.push(feature);
        featuresToRemove.push(this.removeFromSelectionData(layer, feature));
      } else if (!(featureId in previouslySelected)) {
        selectedFeatures.push(feature);
        featuresToAdd.push(this.addToSelectionData(layer, feature));
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
    if (goog.object.getCount(selectedFeaturesByFeatureUid) == 0) {
      map.removeLayer(selectionLayer);
    }
    // TODO: Dispatch an event with selectedFeatures and unselectedFeatures
  }
};
