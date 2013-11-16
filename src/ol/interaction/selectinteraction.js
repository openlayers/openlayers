goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.FeatureRenderIntent');
goog.require('ol.events.ConditionType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');



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

  var layerFilter = options.layers;
  if (!goog.isDef(layerFilter)) {
    layerFilter = goog.functions.TRUE;
  } else if (goog.isArray(layerFilter)) {
    layerFilter = function(layer) {return options.layers.indexOf(layer) > -1;};
  }
  goog.asserts.assertFunction(layerFilter);

  /**
   * @type {function(ol.layer.Layer):boolean}
   * @private
   */
  this.layerFilter_ = layerFilter;

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
    var layers = goog.array.filter(
        map.getLayerGroup().getLayersArray(), this.layerFilter_);
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
    if (!(layer instanceof ol.layer.Vector)) {
      // TODO Support non-vector layers and remove this
      continue;
    }

    var featuresToSelect = featuresByLayer[i];
    var selectedFeatures = layer.getVectorSource().getFeatures(
        ol.layer.Vector.selectedFeaturesFilter);
    if (clear) {
      for (var j = selectedFeatures.length - 1; j >= 0; --j) {
        selectedFeatures[j].setRenderIntent(
            ol.FeatureRenderIntent.DEFAULT);
      }
    }
    for (var j = featuresToSelect.length - 1; j >= 0; --j) {
      var feature = featuresToSelect[j];
      // TODO: Make toggle configurable
      feature.setRenderIntent(feature.getRenderIntent() ==
          ol.FeatureRenderIntent.SELECTED ?
              ol.FeatureRenderIntent.DEFAULT :
              ol.FeatureRenderIntent.SELECTED);
    }
    // TODO: Dispatch an event with selectedFeatures and unselectedFeatures
  }
};
