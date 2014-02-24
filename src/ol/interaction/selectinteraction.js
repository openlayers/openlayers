goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('ol.FeatureOverlay');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.SelectOptions} options Options.
 * @todo stability experimental
 */
ol.interaction.Select = function(options) {

  goog.base(this);

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

  var layerFilter;
  if (goog.isDef(options.layerFilter)) {
    layerFilter = options.layerFilter;
  } else if (goog.isDef(options.layer)) {
    var layer = options.layer;
    layerFilter =
        /**
         * @param {ol.layer.Layer} l Layer.
         * @return {boolean} Include.
         */
        function(l) {
      return l === layer;
    };
  } else if (goog.isDef(options.layers)) {
    var layers = options.layers;
    layerFilter =
        /**
         * @param {ol.layer.Layer} layer Layer.
         * @return {boolean} Include.
         */
        function(layer) {
      return goog.array.indexOf(layers, layer) != -1;
    };
  } else {
    layerFilter = goog.functions.TRUE;
  }

  /**
   * @private
   * @type {function(ol.layer.Layer): boolean}
   */
  this.layerFilter_ = layerFilter;

  /**
   * @private
   * @type {ol.FeatureOverlay}
   */
  this.featureOverlay_ = new ol.FeatureOverlay({
    style: options.style
  });

};
goog.inherits(ol.interaction.Select, ol.interaction.Interaction);


/**
 * @return {ol.Collection} Features collection.
 * @todo stability experimental
 */
ol.interaction.Select.prototype.getFeatures = function() {
  return this.featureOverlay_.getFeatures();
};


/**
 * @inheritDoc
 */
ol.interaction.Select.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (!this.condition_(mapBrowserEvent)) {
    return true;
  }
  var add = this.addCondition_(mapBrowserEvent);
  var map = mapBrowserEvent.map;
  var features = this.featureOverlay_.getFeatures();
  map.withFrozenRendering(
      /**
       * @this {ol.interaction.Select}
       */
      function() {
        if (add) {
          map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
              /**
               * @param {ol.Feature} feature Feature.
               * @param {ol.layer.Layer} layer Layer.
               */
              function(feature, layer) {
                if (goog.array.indexOf(features.getArray(), feature) == -1) {
                  features.push(feature);
                }
              }, undefined, this.layerFilter_);
        } else {
          /** @type {ol.Feature|undefined} */
          var feature = map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
              /**
               * @param {ol.Feature} feature Feature.
               * @param {ol.layer.Layer} layer Layer.
               */
              function(feature, layer) {
                return feature;
              }, undefined, this.layerFilter_);
          if (goog.isDef(feature)) {
            if (features.getLength() == 1) {
              if (features.getAt(0) !== feature) {
                features.setAt(0, feature);
              }
            } else {
              if (features.getLength() != 1) {
                features.clear();
              }
              features.push(feature);
            }
          } else {
            if (features.getLength() !== 0) {
              features.clear();
            }
          }
        }
      }, this);
  return false;
};


/**
 * @inheritDoc
 */
ol.interaction.Select.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  this.featureOverlay_.setMap(map);
};
