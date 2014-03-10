goog.provide('ol.interaction.Select');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.object');
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
   * @type {boolean}
   * @private
   */
  this.handlingBrowserEvent_ = false;

  /**
   * @type {Object.<number, ol.layer.Layer>}
   * @private
   */
  this.layerMap_ = {};

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
  goog.events.listen(this.featureOverlay_, goog.events.EventType.CHANGE,
      this.handleFeaturesChanged_, false, this);

  /**
   * @type {ol.Collection}
   * @private
   */
  this.observedFeatures_ = this.featureOverlay_.getFeatures();

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
  goog.events.unlisten(this.featureOverlay_, goog.events.EventType.CHANGE,
      this.handleFeaturesChanged_, false, this);
  goog.base(this, 'disposeInternal');
};


/**
 * @param {ol.Feature} feature Feature.
 * @param {ol.layer.Layer=} opt_layer Layer.
 * @private
 */
ol.interaction.Select.prototype.addFeatureToLayerMap_ = function(
    feature, opt_layer) {
  var layer = opt_layer;
  if (goog.isDef(layer) && layer instanceof ol.layer.Vector &&
      goog.array.indexOf(goog.object.getValues(this.layerMap_), layer) == -1) {
    var renderGeometryFunctions = layer.getRenderGeometryFunctions();
    if (!goog.isDef(renderGeometryFunctions)) {
      renderGeometryFunctions = new ol.Collection();
      layer.setRenderGeometryFunctions(renderGeometryFunctions);
    }
    var layerMap = this.layerMap_;
    this.renderGeometryFunctions_[goog.getUid(layer)] = function(
        geometry, object) {
      if (object instanceof ol.Feature) {
        return layerMap[goog.getUid(object)] !== layer;
      }
      return true;
    };
    if (goog.array.indexOf(renderGeometryFunctions.getArray(),
        this.renderGeometryFunctions_) == - 1) {
      var renderGeometryFunction =
          this.renderGeometryFunctions_[goog.getUid(layer)];
      renderGeometryFunctions.push(renderGeometryFunction);
    }
    this.layerMap_[goog.getUid(feature)] = layer;
  }
};


/**
 * @return {ol.Collection} Features collection.
 * @todo stability experimental
 */
ol.interaction.Select.prototype.getFeatures = function() {
  return this.featureOverlay_.getFeatures();
};


/**
 * @param {ol.CollectionEvent} evt Event.
 * @private
 */
ol.interaction.Select.prototype.handleFeatureAdded_ = function(evt) {
  var map = this.getMap();
  if (!goog.isNull(map) && this.handlingBrowserEvent_) {
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
    if (layer instanceof ol.layer.Vector && this.layerFilter_(layer)) {
      source = layer.getSource();
      if (source instanceof ol.source.Vector) {
        found = source.forEachFeatureInExtent(extent, matchFeature);
        if (found) {
          this.addFeatureToLayerMap_(feature, layer);
          break;
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
  var feature = evt.element;
  goog.asserts.assertInstanceof(feature, ol.Feature);
  var layerMap = this.layerMap_;
  var layer = layerMap[goog.getUid(feature)];
  delete layerMap[goog.getUid(feature)];
  if (goog.isDef(layer)) {
    goog.asserts.assertInstanceof(layer, ol.layer.Vector);
    if (goog.array.indexOf(goog.object.getValues(layerMap), layer) == -1) {
      layer.getRenderGeometryFunctions().remove(
          this.renderGeometryFunctions_[goog.getUid(layer)]);
      delete this.renderGeometryFunctions_[goog.getUid(layer)];
    }
  }
};


/**
 * @param {goog.events.Event} evt Event
 * @private
 */
ol.interaction.Select.prototype.handleFeaturesChanged_ = function(evt) {
  var features = this.featureOverlay_.getFeatures();
  if (features !== this.observedFeatures_) {
    this.removeFeaturesListeners_(this.observedFeatures_);
    this.addFeaturesListeners_(features);
    this.observedFeatures_ = features;
  }
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
 * @inheritDoc
 */
ol.interaction.Select.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  if (!this.condition_(mapBrowserEvent)) {
    return true;
  }
  this.handlingBrowserEvent_ = true;
  var add = this.addCondition_(mapBrowserEvent);
  var map = mapBrowserEvent.map;
  var features = this.featureOverlay_.getFeatures();
  if (add) {
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         */
        function(feature, layer) {
          if (goog.array.indexOf(features.getArray(), feature) == -1) {
            features.push(feature);
            this.addFeatureToLayerMap_(feature, layer);
          }
        }, this, this.layerFilter_);
  } else {
    /** @type {ol.layer.Layer|undefined} */
    var layer;
    /** @type {ol.Feature|undefined} */
    var feature = map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature} feature Feature.
         * @param {ol.layer.Layer} l Layer.
         */
        function(feature, l) {
          layer = l;
          return feature;
        }, undefined, this.layerFilter_);
    if (goog.isDef(feature)) {
      if (features.getLength() == 1) {
        if (features.getAt(0) !== feature) {
          features.setAt(0, feature);
          this.addFeatureToLayerMap_(feature, layer);
        }
      } else {
        if (features.getLength() != 1) {
          features.clear();
        }
        features.push(feature);
        this.addFeatureToLayerMap_(feature, layer);
      }
    } else {
      if (features.getLength() !== 0) {
        features.clear();
      }
    }
  }
  this.handlingBrowserEvent_ = false;
  return false;
};


/**
 * @inheritDoc
 */
ol.interaction.Select.prototype.setMap = function(map) {
  goog.base(this, 'setMap', map);
  this.featureOverlay_.setMap(map);
};
