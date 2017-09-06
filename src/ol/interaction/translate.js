import _ol_ from '../index';
import _ol_Collection_ from '../collection';
import _ol_Object_ from '../object';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_functions_ from '../functions';
import _ol_array_ from '../array';
import _ol_interaction_Pointer_ from '../interaction/pointer';
import _ol_interaction_Property_ from '../interaction/property';
import _ol_interaction_TranslateEventType_ from '../interaction/translateeventtype';

/**
 * @classdesc
 * Interaction for translating (moving) features.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires ol.interaction.Translate.Event
 * @param {olx.interaction.TranslateOptions=} opt_options Options.
 * @api
 */
var _ol_interaction_Translate_ = function(opt_options) {
  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_Translate_.handleDownEvent_,
    handleDragEvent: _ol_interaction_Translate_.handleDragEvent_,
    handleMoveEvent: _ol_interaction_Translate_.handleMoveEvent_,
    handleUpEvent: _ol_interaction_Translate_.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * The last position we translated to.
   * @type {ol.Coordinate}
   * @private
   */
  this.lastCoordinate_ = null;


  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = options.features !== undefined ? options.features : null;

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
   * @private
   * @type {number}
   */
  this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

  /**
   * @type {ol.Feature}
   * @private
   */
  this.lastFeature_ = null;

  _ol_events_.listen(this,
      _ol_Object_.getChangeEventType(_ol_interaction_Property_.ACTIVE),
      this.handleActiveChanged_, this);

};

_ol_.inherits(_ol_interaction_Translate_, _ol_interaction_Pointer_);


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Translate}
 * @private
 */
_ol_interaction_Translate_.handleDownEvent_ = function(event) {
  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (!this.lastCoordinate_ && this.lastFeature_) {
    this.lastCoordinate_ = event.coordinate;
    _ol_interaction_Translate_.handleMoveEvent_.call(this, event);

    var features = this.features_ || new _ol_Collection_([this.lastFeature_]);

    this.dispatchEvent(
        new _ol_interaction_Translate_.Event(
            _ol_interaction_TranslateEventType_.TRANSLATESTART, features,
            event.coordinate));
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.Translate}
 * @private
 */
_ol_interaction_Translate_.handleUpEvent_ = function(event) {
  if (this.lastCoordinate_) {
    this.lastCoordinate_ = null;
    _ol_interaction_Translate_.handleMoveEvent_.call(this, event);

    var features = this.features_ || new _ol_Collection_([this.lastFeature_]);

    this.dispatchEvent(
        new _ol_interaction_Translate_.Event(
            _ol_interaction_TranslateEventType_.TRANSLATEEND, features,
            event.coordinate));
    return true;
  }
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @this {ol.interaction.Translate}
 * @private
 */
_ol_interaction_Translate_.handleDragEvent_ = function(event) {
  if (this.lastCoordinate_) {
    var newCoordinate = event.coordinate;
    var deltaX = newCoordinate[0] - this.lastCoordinate_[0];
    var deltaY = newCoordinate[1] - this.lastCoordinate_[1];

    var features = this.features_ || new _ol_Collection_([this.lastFeature_]);

    features.forEach(function(feature) {
      var geom = feature.getGeometry();
      geom.translate(deltaX, deltaY);
      feature.setGeometry(geom);
    });

    this.lastCoordinate_ = newCoordinate;
    this.dispatchEvent(
        new _ol_interaction_Translate_.Event(
            _ol_interaction_TranslateEventType_.TRANSLATING, features,
            newCoordinate));
  }
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @this {ol.interaction.Translate}
 * @private
 */
_ol_interaction_Translate_.handleMoveEvent_ = function(event) {
  var elem = event.map.getViewport();

  // Change the cursor to grab/grabbing if hovering any of the features managed
  // by the interaction
  if (this.featuresAtPixel_(event.pixel, event.map)) {
    elem.classList.remove(this.lastCoordinate_ ? 'ol-grab' : 'ol-grabbing');
    elem.classList.add(this.lastCoordinate_ ? 'ol-grabbing' : 'ol-grab');
  } else {
    elem.classList.remove('ol-grab', 'ol-grabbing');
  }
};


/**
 * Tests to see if the given coordinates intersects any of our selected
 * features.
 * @param {ol.Pixel} pixel Pixel coordinate to test for intersection.
 * @param {ol.PluggableMap} map Map to test the intersection on.
 * @return {ol.Feature} Returns the feature found at the specified pixel
 * coordinates.
 * @private
 */
_ol_interaction_Translate_.prototype.featuresAtPixel_ = function(pixel, map) {
  return map.forEachFeatureAtPixel(pixel,
      function(feature) {
        if (!this.features_ ||
            _ol_array_.includes(this.features_.getArray(), feature)) {
          return feature;
        }
      }.bind(this), {
        layerFilter: this.layerFilter_,
        hitTolerance: this.hitTolerance_
      });
};


/**
 * Returns the Hit-detection tolerance.
 * @returns {number} Hit tolerance in pixels.
 * @api
 */
_ol_interaction_Translate_.prototype.getHitTolerance = function() {
  return this.hitTolerance_;
};


/**
 * Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @api
 */
_ol_interaction_Translate_.prototype.setHitTolerance = function(hitTolerance) {
  this.hitTolerance_ = hitTolerance;
};


/**
 * @inheritDoc
 */
_ol_interaction_Translate_.prototype.setMap = function(map) {
  var oldMap = this.getMap();
  _ol_interaction_Pointer_.prototype.setMap.call(this, map);
  this.updateState_(oldMap);
};


/**
 * @private
 */
_ol_interaction_Translate_.prototype.handleActiveChanged_ = function() {
  this.updateState_(null);
};


/**
 * @param {ol.PluggableMap} oldMap Old map.
 * @private
 */
_ol_interaction_Translate_.prototype.updateState_ = function(oldMap) {
  var map = this.getMap();
  var active = this.getActive();
  if (!map || !active) {
    map = map || oldMap;
    if (map) {
      var elem = map.getViewport();
      elem.classList.remove('ol-grab', 'ol-grabbing');
    }
  }
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.Translate} instances are instances of
 * this type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.interaction.TranslateEvent}
 * @param {ol.interaction.TranslateEventType} type Type.
 * @param {ol.Collection.<ol.Feature>} features The features translated.
 * @param {ol.Coordinate} coordinate The event coordinate.
 */
_ol_interaction_Translate_.Event = function(type, features, coordinate) {

  _ol_events_Event_.call(this, type);

  /**
   * The features being translated.
   * @type {ol.Collection.<ol.Feature>}
   * @api
   */
  this.features = features;

  /**
   * The coordinate of the drag event.
   * @const
   * @type {ol.Coordinate}
   * @api
   */
  this.coordinate = coordinate;
};
_ol_.inherits(_ol_interaction_Translate_.Event, _ol_events_Event_);
export default _ol_interaction_Translate_;
