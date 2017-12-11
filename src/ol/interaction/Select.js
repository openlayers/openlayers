goog.provide('ol.interaction.Select');

goog.require('ol');
goog.require('ol.CollectionEventType');
goog.require('ol.array');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.condition');
goog.require('ol.functions');
goog.require('ol.geom.GeometryType');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.obj');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');


/**
 * @classdesc
 * Interaction for selecting vector features. By default, selected features are
 * styled differently, so this interaction can be used for visual highlighting,
 * as well as selecting features for other actions, such as modification or
 * output. There are three ways of controlling which features are selected:
 * using the browser event as defined by the `condition` and optionally the
 * `toggle`, `add`/`remove`, and `multi` options; a `layers` filter; and a
 * further feature filter using the `filter` option.
 *
 * Selected features are added to an internal unmanaged layer.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.SelectOptions=} opt_options Options.
 * @fires ol.interaction.Select.Event
 * @api
 */
ol.interaction.Select = function(opt_options) {

  ol.interaction.Interaction.call(this, {
    handleEvent: ol.interaction.Select.handleEvent
  });

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : ol.events.condition.singleClick;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.addCondition_ = options.addCondition ?
    options.addCondition : ol.events.condition.never;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.removeCondition_ = options.removeCondition ?
    options.removeCondition : ol.events.condition.never;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.toggleCondition_ = options.toggleCondition ?
    options.toggleCondition : ol.events.condition.shiftKeyOnly;

  /**
   * @private
   * @type {boolean}
   */
  this.multi_ = options.multi ? options.multi : false;

  /**
   * @private
   * @type {ol.SelectFilterFunction}
   */
  this.filter_ = options.filter ? options.filter :
    ol.functions.TRUE;

  /**
   * @private
   * @type {number}
   */
  this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

  var featureOverlay = new ol.layer.Vector({
    source: new ol.source.Vector({
      useSpatialIndex: false,
      features: options.features,
      wrapX: options.wrapX
    }),
    style: options.style ? options.style :
      ol.interaction.Select.getDefaultStyleFunction(),
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
   * @private
   * @type {ol.layer.Vector}
   */
  this.featureOverlay_ = featureOverlay;

  /** @type {function(ol.layer.Layer): boolean} */
  var layerFilter;
  if (options.layers) {
    if (typeof options.layers === 'function') {
      layerFilter = options.layers;
    } else {
      var layers = options.layers;
      layerFilter = function(layer) {
        return ol.array.includes(layers, layer);
      };
    }
  } else {
    layerFilter = ol.functions.TRUE;
  }

  /**
   * @private
   * @type {function(ol.layer.Layer): boolean}
   */
  this.layerFilter_ = layerFilter;

  /**
   * An association between selected feature (key)
   * and layer (value)
   * @private
   * @type {Object.<number, ol.layer.Layer>}
   */
  this.featureLayerAssociation_ = {};

  var features = this.featureOverlay_.getSource().getFeaturesCollection();
  ol.events.listen(features, ol.CollectionEventType.ADD,
      this.addFeature_, this);
  ol.events.listen(features, ol.CollectionEventType.REMOVE,
      this.removeFeature_, this);

};
ol.inherits(ol.interaction.Select, ol.interaction.Interaction);


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.interaction.Select.prototype.addFeatureLayerAssociation_ = function(feature, layer) {
  var key = ol.getUid(feature);
  this.featureLayerAssociation_[key] = layer;
};


/**
 * Get the selected features.
 * @return {ol.Collection.<ol.Feature>} Features collection.
 * @api
 */
ol.interaction.Select.prototype.getFeatures = function() {
  return this.featureOverlay_.getSource().getFeaturesCollection();
};


/**
 * Returns the Hit-detection tolerance.
 * @returns {number} Hit tolerance in pixels.
 * @api
 */
ol.interaction.Select.prototype.getHitTolerance = function() {
  return this.hitTolerance_;
};


/**
 * Returns the associated {@link ol.layer.Vector vectorlayer} of
 * the (last) selected feature. Note that this will not work with any
 * programmatic method like pushing features to
 * {@link ol.interaction.Select#getFeatures collection}.
 * @param {ol.Feature|ol.render.Feature} feature Feature
 * @return {ol.layer.Vector} Layer.
 * @api
 */
ol.interaction.Select.prototype.getLayer = function(feature) {
  var key = ol.getUid(feature);
  return /** @type {ol.layer.Vector} */ (this.featureLayerAssociation_[key]);
};


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} and may change the
 * selected state of features.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.Select}
 * @api
 */
ol.interaction.Select.handleEvent = function(mapBrowserEvent) {
  if (!this.condition_(mapBrowserEvent)) {
    return true;
  }
  var add = this.addCondition_(mapBrowserEvent);
  var remove = this.removeCondition_(mapBrowserEvent);
  var toggle = this.toggleCondition_(mapBrowserEvent);
  var set = !add && !remove && !toggle;
  var map = mapBrowserEvent.map;
  var features = this.featureOverlay_.getSource().getFeaturesCollection();
  var deselected = [];
  var selected = [];
  if (set) {
    // Replace the currently selected feature(s) with the feature(s) at the
    // pixel, or clear the selected feature(s) if there is no feature at
    // the pixel.
    ol.obj.clear(this.featureLayerAssociation_);
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        (
          /**
           * @param {ol.Feature|ol.render.Feature} feature Feature.
           * @param {ol.layer.Layer} layer Layer.
           * @return {boolean|undefined} Continue to iterate over the features.
           */
          function(feature, layer) {
            if (this.filter_(feature, layer)) {
              selected.push(feature);
              this.addFeatureLayerAssociation_(feature, layer);
              return !this.multi_;
            }
          }).bind(this), {
          layerFilter: this.layerFilter_,
          hitTolerance: this.hitTolerance_
        });
    var i;
    for (i = features.getLength() - 1; i >= 0; --i) {
      var feature = features.item(i);
      var index = selected.indexOf(feature);
      if (index > -1) {
        // feature is already selected
        selected.splice(index, 1);
      } else {
        features.remove(feature);
        deselected.push(feature);
      }
    }
    if (selected.length !== 0) {
      features.extend(selected);
    }
  } else {
    // Modify the currently selected feature(s).
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        (
          /**
           * @param {ol.Feature|ol.render.Feature} feature Feature.
           * @param {ol.layer.Layer} layer Layer.
           * @return {boolean|undefined} Continue to iterate over the features.
           */
          function(feature, layer) {
            if (this.filter_(feature, layer)) {
              if ((add || toggle) &&
                !ol.array.includes(features.getArray(), feature)) {
                selected.push(feature);
                this.addFeatureLayerAssociation_(feature, layer);
              } else if ((remove || toggle) &&
                ol.array.includes(features.getArray(), feature)) {
                deselected.push(feature);
                this.removeFeatureLayerAssociation_(feature);
              }
              return !this.multi_;
            }
          }).bind(this), {
          layerFilter: this.layerFilter_,
          hitTolerance: this.hitTolerance_
        });
    var j;
    for (j = deselected.length - 1; j >= 0; --j) {
      features.remove(deselected[j]);
    }
    features.extend(selected);
  }
  if (selected.length > 0 || deselected.length > 0) {
    this.dispatchEvent(
        new ol.interaction.Select.Event(ol.interaction.Select.EventType_.SELECT,
            selected, deselected, mapBrowserEvent));
  }
  return ol.events.condition.pointerMove(mapBrowserEvent);
};


/**
 * Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @api
 */
ol.interaction.Select.prototype.setHitTolerance = function(hitTolerance) {
  this.hitTolerance_ = hitTolerance;
};


/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.PluggableMap} map Map.
 * @override
 * @api
 */
ol.interaction.Select.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var selectedFeatures =
      this.featureOverlay_.getSource().getFeaturesCollection();
  if (currentMap) {
    selectedFeatures.forEach(currentMap.unskipFeature, currentMap);
  }
  ol.interaction.Interaction.prototype.setMap.call(this, map);
  this.featureOverlay_.setMap(map);
  if (map) {
    selectedFeatures.forEach(map.skipFeature, map);
  }
};


/**
 * @return {ol.StyleFunction} Styles.
 */
ol.interaction.Select.getDefaultStyleFunction = function() {
  var styles = ol.style.Style.createDefaultEditing();
  ol.array.extend(styles[ol.geom.GeometryType.POLYGON],
      styles[ol.geom.GeometryType.LINE_STRING]);
  ol.array.extend(styles[ol.geom.GeometryType.GEOMETRY_COLLECTION],
      styles[ol.geom.GeometryType.LINE_STRING]);

  return function(feature, resolution) {
    if (!feature.getGeometry()) {
      return null;
    }
    return styles[feature.getGeometry().getType()];
  };
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
ol.interaction.Select.prototype.addFeature_ = function(evt) {
  var map = this.getMap();
  if (map) {
    map.skipFeature(/** @type {ol.Feature} */ (evt.element));
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
ol.interaction.Select.prototype.removeFeature_ = function(evt) {
  var map = this.getMap();
  if (map) {
    map.unskipFeature(/** @type {ol.Feature} */ (evt.element));
  }
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.interaction.Select.prototype.removeFeatureLayerAssociation_ = function(feature) {
  var key = ol.getUid(feature);
  delete this.featureLayerAssociation_[key];
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Select} instances are instances of
 * this type.
 *
 * @param {ol.interaction.Select.EventType_} type The event type.
 * @param {Array.<ol.Feature>} selected Selected features.
 * @param {Array.<ol.Feature>} deselected Deselected features.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Associated
 *     {@link ol.MapBrowserEvent}.
 * @implements {oli.SelectEvent}
 * @extends {ol.events.Event}
 * @constructor
 */
ol.interaction.Select.Event = function(type, selected, deselected, mapBrowserEvent) {
  ol.events.Event.call(this, type);

  /**
   * Selected features array.
   * @type {Array.<ol.Feature>}
   * @api
   */
  this.selected = selected;

  /**
   * Deselected features array.
   * @type {Array.<ol.Feature>}
   * @api
   */
  this.deselected = deselected;

  /**
   * Associated {@link ol.MapBrowserEvent}.
   * @type {ol.MapBrowserEvent}
   * @api
   */
  this.mapBrowserEvent = mapBrowserEvent;
};
ol.inherits(ol.interaction.Select.Event, ol.events.Event);


/**
 * @enum {string}
 * @private
 */
ol.interaction.Select.EventType_ = {
  /**
   * Triggered when feature(s) has been (de)selected.
   * @event ol.interaction.Select.Event#select
   * @api
   */
  SELECT: 'select'
};
