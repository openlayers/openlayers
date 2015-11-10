goog.provide('ol.interaction.Select');
goog.provide('ol.interaction.SelectEvent');
goog.provide('ol.interaction.SelectEventType');
goog.provide('ol.interaction.SelectFilterFunction');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.CollectionEventType');
goog.require('ol.Feature');
goog.require('ol.array');
goog.require('ol.events.condition');
goog.require('ol.geom.GeometryType');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');


/**
 * @enum {string}
 */
ol.interaction.SelectEventType = {
  /**
   * Triggered when feature(s) has been (de)selected.
   * @event ol.interaction.SelectEvent#select
   * @api
   */
  SELECT: 'select'
};


/**
 * A function that takes an {@link ol.Feature} or {@link ol.render.Feature} and
 * an {@link ol.layer.Layer} and returns `true` if the feature may be selected
 * or `false` otherwise.
 * @typedef {function((ol.Feature|ol.render.Feature), ol.layer.Layer):
 *     boolean}
 * @api
 */
ol.interaction.SelectFilterFunction;



/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Select} instances are instances of
 * this type.
 *
 * @param {string} type The event type.
 * @param {Array.<ol.Feature>} selected Selected features.
 * @param {Array.<ol.Feature>} deselected Deselected features.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Associated
 *     {@link ol.MapBrowserEvent}.
 * @implements {oli.SelectEvent}
 * @extends {goog.events.Event}
 * @constructor
 */
ol.interaction.SelectEvent =
    function(type, selected, deselected, mapBrowserEvent) {
  goog.base(this, type);

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
goog.inherits(ol.interaction.SelectEvent, goog.events.Event);



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
 * @fires ol.interaction.SelectEvent
 * @api stable
 */
ol.interaction.Select = function(opt_options) {

  goog.base(this, {
    handleEvent: ol.interaction.Select.handleEvent
  });

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = options.condition ?
      options.condition : ol.events.condition.singleClick;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.addCondition_ = options.addCondition ?
      options.addCondition : ol.events.condition.never;

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.removeCondition_ = options.removeCondition ?
      options.removeCondition : ol.events.condition.never;

  /**
   * @private
   * @type {ol.events.ConditionType}
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
   * @type {ol.interaction.SelectFilterFunction}
   */
  this.filter_ = options.filter ? options.filter :
      goog.functions.TRUE;

  var layerFilter;
  if (options.layers) {
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
        return ol.array.includes(layers, layer);
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
   * An association between selected feature (key)
   * and layer (value)
   * @private
   * @type {Object.<number, ol.layer.Layer>}
   */
  this.featureLayerAssociation_ = {};

  /**
   * @private
   * @type {ol.layer.Vector}
   */
  this.featureOverlay_ = new ol.layer.Vector({
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

  var features = this.featureOverlay_.getSource().getFeaturesCollection();
  goog.events.listen(features, ol.CollectionEventType.ADD,
      this.addFeature_, false, this);
  goog.events.listen(features, ol.CollectionEventType.REMOVE,
      this.removeFeature_, false, this);

};
goog.inherits(ol.interaction.Select, ol.interaction.Interaction);


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
ol.interaction.Select.prototype.addFeatureLayerAssociation_ =
    function(feature, layer) {
  var key = goog.getUid(feature);
  this.featureLayerAssociation_[key] = layer;
};


/**
 * Get the selected features.
 * @return {ol.Collection.<ol.Feature>} Features collection.
 * @api stable
 */
ol.interaction.Select.prototype.getFeatures = function() {
  return this.featureOverlay_.getSource().getFeaturesCollection();
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
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
  var key = goog.getUid(feature);
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
  var /** @type {!Array.<ol.Feature>} */ deselected = [];
  var /** @type {!Array.<ol.Feature>} */ selected = [];
  var change = false;
  if (set) {
    // Replace the currently selected feature(s) with the feature(s) at the
    // pixel, or clear the selected feature(s) if there is no feature at
    // the pixel.
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         */
        function(feature, layer) {
          if (layer && this.filter_(feature, layer)) {
            selected.push(feature);
            this.addFeatureLayerAssociation_(feature, layer);
            return !this.multi_;
          }
        }, this, this.layerFilter_);
    if (selected.length > 0 && features.getLength() == 1 &&
        features.item(0) == selected[0]) {
      // No change
    } else {
      change = true;
      if (features.getLength() !== 0) {
        deselected = Array.prototype.concat(features.getArray());
        features.clear();
      }
      features.extend(selected);
      // Modify object this.featureLayerAssociation_
      if (selected.length === 0) {
        goog.object.clear(this.featureLayerAssociation_);
      } else {
        if (deselected.length > 0) {
          deselected.forEach(function(feature) {
            this.removeFeatureLayerAssociation_(feature);
          }, this);
        }
      }
    }
  } else {
    // Modify the currently selected feature(s).
    map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @param {ol.layer.Layer} layer Layer.
         */
        function(feature, layer) {
          if (!ol.array.includes(features.getArray(), feature)) {
            if (add || toggle) {
              if (this.filter_(feature, layer)) {
                selected.push(feature);
                this.addFeatureLayerAssociation_(feature, layer);
              }
            }
          } else {
            if (remove || toggle) {
              deselected.push(feature);
              this.removeFeatureLayerAssociation_(feature);
            }
          }
        }, this, this.layerFilter_);
    var i;
    for (i = deselected.length - 1; i >= 0; --i) {
      features.remove(deselected[i]);
    }
    features.extend(selected);
    if (selected.length > 0 || deselected.length > 0) {
      change = true;
    }
  }
  if (change) {
    this.dispatchEvent(
        new ol.interaction.SelectEvent(ol.interaction.SelectEventType.SELECT,
            selected, deselected, mapBrowserEvent));
  }
  return ol.events.condition.pointerMove(mapBrowserEvent);
};


/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.Select.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var selectedFeatures =
      this.featureOverlay_.getSource().getFeaturesCollection();
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
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
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
  goog.asserts.assertInstanceof(feature, ol.Feature,
      'feature should be an ol.Feature');
  if (!goog.isNull(map)) {
    map.unskipFeature(feature);
  }
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
ol.interaction.Select.prototype.removeFeatureLayerAssociation_ =
    function(feature) {
  var key = goog.getUid(feature);
  delete this.featureLayerAssociation_[key];
};
