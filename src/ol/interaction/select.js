import _ol_ from '../index';
import _ol_CollectionEventType_ from '../collectioneventtype';
import _ol_array_ from '../array';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_events_condition_ from '../events/condition';
import _ol_functions_ from '../functions';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_interaction_Interaction_ from '../interaction/interaction';
import _ol_layer_Vector_ from '../layer/vector';
import _ol_obj_ from '../obj';
import _ol_source_Vector_ from '../source/vector';
import _ol_style_Style_ from '../style/style';

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
var _ol_interaction_Select_ = function(opt_options) {

  _ol_interaction_Interaction_.call(this, {
    handleEvent: _ol_interaction_Select_.handleEvent
  });

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : _ol_events_condition_.singleClick;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.addCondition_ = options.addCondition ?
    options.addCondition : _ol_events_condition_.never;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.removeCondition_ = options.removeCondition ?
    options.removeCondition : _ol_events_condition_.never;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.toggleCondition_ = options.toggleCondition ?
    options.toggleCondition : _ol_events_condition_.shiftKeyOnly;

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
    _ol_functions_.TRUE;

  /**
   * @private
   * @type {number}
   */
  this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

  var featureOverlay = new _ol_layer_Vector_({
    source: new _ol_source_Vector_({
      useSpatialIndex: false,
      features: options.features,
      wrapX: options.wrapX
    }),
    style: options.style ? options.style :
      _ol_interaction_Select_.getDefaultStyleFunction(),
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
        return _ol_array_.includes(layers, layer);
      };
    }
  } else {
    layerFilter = _ol_functions_.TRUE;
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
  _ol_events_.listen(features, _ol_CollectionEventType_.ADD,
      this.addFeature_, this);
  _ol_events_.listen(features, _ol_CollectionEventType_.REMOVE,
      this.removeFeature_, this);

};

_ol_.inherits(_ol_interaction_Select_, _ol_interaction_Interaction_);


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.layer.Layer} layer Layer.
 * @private
 */
_ol_interaction_Select_.prototype.addFeatureLayerAssociation_ = function(feature, layer) {
  var key = _ol_.getUid(feature);
  this.featureLayerAssociation_[key] = layer;
};


/**
 * Get the selected features.
 * @return {ol.Collection.<ol.Feature>} Features collection.
 * @api
 */
_ol_interaction_Select_.prototype.getFeatures = function() {
  return this.featureOverlay_.getSource().getFeaturesCollection();
};


/**
 * Returns the Hit-detection tolerance.
 * @returns {number} Hit tolerance in pixels.
 * @api
 */
_ol_interaction_Select_.prototype.getHitTolerance = function() {
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
_ol_interaction_Select_.prototype.getLayer = function(feature) {
  var key = _ol_.getUid(feature);
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
_ol_interaction_Select_.handleEvent = function(mapBrowserEvent) {
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
    _ol_obj_.clear(this.featureLayerAssociation_);
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
                !_ol_array_.includes(features.getArray(), feature)) {
                selected.push(feature);
                this.addFeatureLayerAssociation_(feature, layer);
              } else if ((remove || toggle) &&
                _ol_array_.includes(features.getArray(), feature)) {
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
        new _ol_interaction_Select_.Event(_ol_interaction_Select_.EventType_.SELECT,
            selected, deselected, mapBrowserEvent));
  }
  return _ol_events_condition_.pointerMove(mapBrowserEvent);
};


/**
 * Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @api
 */
_ol_interaction_Select_.prototype.setHitTolerance = function(hitTolerance) {
  this.hitTolerance_ = hitTolerance;
};


/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.PluggableMap} map Map.
 * @override
 * @api
 */
_ol_interaction_Select_.prototype.setMap = function(map) {
  var currentMap = this.getMap();
  var selectedFeatures =
      this.featureOverlay_.getSource().getFeaturesCollection();
  if (currentMap) {
    selectedFeatures.forEach(currentMap.unskipFeature, currentMap);
  }
  _ol_interaction_Interaction_.prototype.setMap.call(this, map);
  this.featureOverlay_.setMap(map);
  if (map) {
    selectedFeatures.forEach(map.skipFeature, map);
  }
};


/**
 * @return {ol.StyleFunction} Styles.
 */
_ol_interaction_Select_.getDefaultStyleFunction = function() {
  var styles = _ol_style_Style_.createDefaultEditing();
  _ol_array_.extend(styles[_ol_geom_GeometryType_.POLYGON],
      styles[_ol_geom_GeometryType_.LINE_STRING]);
  _ol_array_.extend(styles[_ol_geom_GeometryType_.GEOMETRY_COLLECTION],
      styles[_ol_geom_GeometryType_.LINE_STRING]);

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
_ol_interaction_Select_.prototype.addFeature_ = function(evt) {
  var map = this.getMap();
  if (map) {
    map.skipFeature(/** @type {ol.Feature} */ (evt.element));
  }
};


/**
 * @param {ol.Collection.Event} evt Event.
 * @private
 */
_ol_interaction_Select_.prototype.removeFeature_ = function(evt) {
  var map = this.getMap();
  if (map) {
    map.unskipFeature(/** @type {ol.Feature} */ (evt.element));
  }
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @private
 */
_ol_interaction_Select_.prototype.removeFeatureLayerAssociation_ = function(feature) {
  var key = _ol_.getUid(feature);
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
_ol_interaction_Select_.Event = function(type, selected, deselected, mapBrowserEvent) {
  _ol_events_Event_.call(this, type);

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
_ol_.inherits(_ol_interaction_Select_.Event, _ol_events_Event_);


/**
 * @enum {string}
 * @private
 */
_ol_interaction_Select_.EventType_ = {
  /**
   * Triggered when feature(s) has been (de)selected.
   * @event ol.interaction.Select.Event#select
   * @api
   */
  SELECT: 'select'
};
export default _ol_interaction_Select_;
