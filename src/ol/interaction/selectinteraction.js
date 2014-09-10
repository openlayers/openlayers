goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.events.condition');
goog.require('ol.geom.GeometryType');
goog.require('ol.interaction.Interaction');
goog.require('ol.style.Style');



/**
 * @classdesc
 * Handles selection of vector data. A {@link ol.FeatureOverlay} is maintained
 * internally to store the selected feature(s). Which features are selected is
 * determined by the `condition` option, and optionally the `toggle` or
 * `add`/`remove` options.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.SelectOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.Select = function(opt_options) {

  goog.base(this);

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
      options.addCondition : ol.events.condition.never;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.removeCondition_ = goog.isDef(options.removeCondition) ?
      options.removeCondition : ol.events.condition.never;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.toggleCondition_ = goog.isDef(options.toggleCondition) ?
      options.toggleCondition : ol.events.condition.shiftKeyOnly;

  var layerFilter;
  if (goog.isDef(options.layers)) {
    if (goog.isFunction(options.layers)) {
      layerFilter = options.layers;
    } else {
      var layers = options.layers;
      layerFilter =
          /**
           * @param {ol.layer.Layer} layer Layer.
           * @return {boolean} Include.
           */
          function(layer) {
        return goog.array.contains(layers, layer);
      };
    }
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
    style: (goog.isDef(options.style)) ? options.style :
        ol.interaction.Select.getDefaultStyleFunction()
  });

  var features = this.featureOverlay_.getFeatures();
  goog.events.listen(features, ol.CollectionEventType.ADD,
      this.addFeature_, false, this);
  goog.events.listen(features, ol.CollectionEventType.REMOVE,
      this.removeFeature_, false, this);

};
goog.inherits(ol.interaction.Select, ol.interaction.Interaction);


/**
 * Get the selected features.
 * @return {ol.Collection.<ol.Feature>} Features collection.
 * @api stable
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
  var remove = this.removeCondition_(mapBrowserEvent);
  var toggle = this.toggleCondition_(mapBrowserEvent);
  var set = !add && !remove && !toggle;
  var map = mapBrowserEvent.map;
  var features = this.featureOverlay_.getFeatures();
  if (set) {
    // Replace the currently selected feature(s) with the feature at the pixel,
    // or clear the selected feature(s) if there is no feature at the pixel.
    /** @type {ol.Feature|undefined} */
    var feature = map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         */
        function(feature, layer) {
          return feature;
        }, undefined, this.layerFilter_);
    if (goog.isDef(feature) &&
        features.getLength() == 1 &&
        features.item(0) == feature) {
      // No change
    } else {
      if (features.getLength() !== 0) {
        features.clear();
      }
      if (goog.isDef(feature)) {
        features.push(feature);
      }
    }
  } else {
    // Modify the currently selected feature(s).
    var /** @type {Array.<number>} */ deselected = [];
    var /** @type {Array.<ol.Feature>} */ selected = [];
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         */
        function(feature, layer) {
          var index = goog.array.indexOf(features.getArray(), feature);
          if (index == -1) {
            if (add || toggle) {
              selected.push(feature);
            }
          } else {
            if (remove || toggle) {
              deselected.push(index);
            }
          }
        }, undefined, this.layerFilter_);
    var i;
    for (i = deselected.length - 1; i >= 0; --i) {
      features.removeAt(deselected[i]);
    }
    features.extend(selected);
  }
  return false;
};


/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.Select.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var selectedFeatures = this.featureOverlay_.getFeatures();
  if (!goog.isNull(currentMap)) {
    selectedFeatures.forEach(currentMap.unskipFeature, currentMap);
  }
  goog.base(this, 'setMap', map);
  this.featureOverlay_.setMap(map);
  if (!goog.isNull(map)) {
    selectedFeatures.forEach(map.skipFeature, map);
  }
};


/**
 * @return {ol.style.StyleFunction} Styles.
 */
ol.interaction.Select.getDefaultStyleFunction = function() {
  var styles = ol.style.createDefaultEditingStyles();
  goog.array.extend(styles[ol.geom.GeometryType.POLYGON],
      styles[ol.geom.GeometryType.LINE_STRING]);
  goog.array.extend(styles[ol.geom.GeometryType.GEOMETRY_COLLECTION],
      styles[ol.geom.GeometryType.LINE_STRING]);

  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Select.prototype.addFeature_ = function(evt) {
  var feature = evt.element;
  var map = this.getMap();
  goog.asserts.assertInstanceof(feature, ol.Feature);
  if (!goog.isNull(map)) {
    map.skipFeature(feature);
  }
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Select.prototype.removeFeature_ = function(evt) {
  var feature = evt.element;
  var map = this.getMap();
  goog.asserts.assertInstanceof(feature, ol.Feature);
  if (!goog.isNull(map)) {
    map.unskipFeature(feature);
  }
};
