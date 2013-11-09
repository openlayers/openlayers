goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('ol.Feature');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorLayerRenderIntent');



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
  for (var i = 0, ii = featuresByLayer.length; i < ii; ++i) {
    var layer = layers[i];

    var featuresToSelect = featuresByLayer[i];
    var selectedFeatures = layer.getFeatures(this.selectedFeaturesFilter);
    if (clear) {
      for (var j = selectedFeatures.length - 1; j >= 0; --j) {
        selectedFeatures[j].setRenderIntent(
            ol.layer.VectorLayerRenderIntent.DEFAULT);
      }
    }
    for (var j = featuresToSelect.length - 1; j >= 0; --j) {
      var feature = featuresToSelect[j];
      // TODO: Make toggle configurable
      feature.setRenderIntent(
          feature.renderIntent == ol.layer.VectorLayerRenderIntent.SELECTED ?
              ol.layer.VectorLayerRenderIntent.DEFAULT :
              ol.layer.VectorLayerRenderIntent.SELECTED);
    }
    // TODO: Dispatch an event with selectedFeatures and unselectedFeatures
  }
};


/**
 * @param {ol.Feature} feature Feature.
 * @return {boolean} Whether the feature is selected.
 */
ol.interaction.Select.prototype.selectedFeaturesFilter = function(feature) {
  return feature.renderIntent == ol.layer.VectorLayerRenderIntent.SELECTED;
};
