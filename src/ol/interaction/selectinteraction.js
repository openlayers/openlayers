goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');



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
   * @type {Object.<number, boolean>}
   * @private
   */
  this.featureMap_ = {};

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
  this.addFeaturesListeners_(this.featureOverlay_.getFeatures());

  /**
   * @type {Object.<number, function(ol.geom.Geometry, Object): boolean>}
   * @private
   */
  this.renderGeometryFunctions_ = {};

};
goog.inherits(ol.interaction.Select, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.Select.prototype.disposeInternal = function() {
  this.removeFeaturesListeners_(this.featureOverlay_.getFeatures());
  goog.base(this, 'disposeInternal');
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.interaction.Select.prototype.addFeatureAndRenderGeometryFunction_ = function(
    feature, layer) {
  if (!(goog.getUid(layer) in this.renderGeometryFunctions_)) {
    goog.asserts.assertInstanceof(layer, ol.layer.Vector);
    var renderGeometryFunctions = layer.getRenderGeometryFunctions();
    if (!goog.isDef(renderGeometryFunctions)) {
      renderGeometryFunctions = new ol.Collection();
      layer.setRenderGeometryFunctions(renderGeometryFunctions);
    }
    var featureMap = this.featureMap_;
    this.renderGeometryFunctions_[goog.getUid(layer)] = function(
        geometry, object) {
      goog.asserts.assertInstanceof(object, ol.Feature);
      return !(goog.getUid(object) in featureMap);
    };
    if (goog.array.indexOf(renderGeometryFunctions.getArray(),
        this.renderGeometryFunctions_) == - 1) {
      var renderGeometryFunction =
          this.renderGeometryFunctions_[goog.getUid(layer)];
      renderGeometryFunctions.push(renderGeometryFunction);
    }
  }
  this.featureMap_[goog.getUid(feature)] = true;
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Select.prototype.handleFeatureAdded_ = function(evt) {
  var map = this.getMap();
  if (!goog.isNull(map)) {
    return;
  }
  var feature = evt.element;
  goog.asserts.assertInstanceof(feature, ol.Feature);
  var extent = feature.getGeometry().getExtent();
  var layers = map.getLayers().getArray();
  var matchFeature = function(f) { return f === feature; };
  var found, i, layer, source;
  for (i = layers.length - 1; i >= 0; --i) {
    layer = layers[i];
    if (this.layerFilter_(layer)) {
      source = layer.getSource();
      if (source instanceof ol.source.Vector) {
        found = source.forEachFeatureInExtent(extent, matchFeature);
        if (found) {
          this.addFeatureAndRenderGeometryFunction_(feature, layer);
        }
      }
    }
  }
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Select.prototype.handleFeatureRemoved_ = function(evt) {
  goog.asserts.assertObject(evt.element);
  delete this.featureMap_[goog.getUid(evt.element)];
};


/**
 * @param {ol.Collection} features Feature collection
 * @private
 */
ol.interaction.Select.prototype.addFeaturesListeners_ = function(features) {
  goog.events.listen(features,
      ol.CollectionEventType.ADD, this.handleFeatureAdded_, false, this);
  goog.events.listen(features,
      ol.CollectionEventType.REMOVE, this.handleFeatureRemoved_, false, this);
};


/**
 * @param {ol.Collection} features Feature collection
 * @private
 */
ol.interaction.Select.prototype.removeFeaturesListeners_ = function(features) {
  goog.events.unlisten(features,
      ol.CollectionEventType.ADD, this.handleFeatureAdded_, false, this);
  goog.events.unlisten(features,
      ol.CollectionEventType.REMOVE, this.handleFeatureRemoved_, false, this);
};


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
  } else {
    // Modify the currently selected feature(s).
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         */
        function(feature, layer) {
          var index = goog.array.indexOf(features.getArray(), feature);
          if (index == -1) {
            if (add || toggle) {
              features.push(feature);
            }
          } else {
            if (remove || toggle) {
              features.removeAt(index);
            }
          }
        }, undefined, this.layerFilter_);
  }
  return false;
};


/**
 * @inheritDoc
 */
ol.interaction.Select.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  if (currentMap !== map) {
    var layers = map.getLayers().getArray();
    var i, layer, renderGeometryFunctions;
    for (i = layers.length - 1; i >= 0; --i) {
      layer = layers[i];
      if (this.layerFilter_(layer) && layer instanceof ol.layer.Vector) {
        renderGeometryFunctions = layer.getRenderGeometryFunctions();
        if (renderGeometryFunctions) {
          renderGeometryFunctions.remove(
              this.renderGeometryFunctions_[goog.getUid(layer)]);
        }
      }
    }
  }
  goog.base(this, 'setMap', map);
  this.featureOverlay_.setMap(map);
};
