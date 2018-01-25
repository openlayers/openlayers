/**
 * @module ol/interaction/Translate
 */
import {inherits} from '../index.js';
import Collection from '../Collection.js';
import BaseObject from '../Object.js';
import {listen} from '../events.js';
import Event from '../events/Event.js';
import {TRUE} from '../functions.js';
import {includes} from '../array.js';
import PointerInteraction from '../interaction/Pointer.js';
import InteractionProperty from '../interaction/Property.js';
import TranslateEventType from '../interaction/TranslateEventType.js';

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
const Translate = function(opt_options) {
  PointerInteraction.call(this, {
    handleDownEvent: Translate.handleDownEvent_,
    handleDragEvent: Translate.handleDragEvent_,
    handleMoveEvent: Translate.handleMoveEvent_,
    handleUpEvent: Translate.handleUpEvent_
  });

  const options = opt_options ? opt_options : {};

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
  let layerFilter;
  if (options.layers) {
    if (typeof options.layers === 'function') {
      layerFilter = options.layers;
    } else {
      const layers = options.layers;
      layerFilter = function(layer) {
        return includes(layers, layer);
      };
    }
  } else {
    layerFilter = TRUE;
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

  listen(this,
    BaseObject.getChangeEventType(InteractionProperty.ACTIVE),
    this.handleActiveChanged_, this);

};

inherits(Translate, PointerInteraction);


/**
 * @param {ol.MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.Translate}
 * @private
 */
Translate.handleDownEvent_ = function(event) {
  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (!this.lastCoordinate_ && this.lastFeature_) {
    this.lastCoordinate_ = event.coordinate;
    Translate.handleMoveEvent_.call(this, event);

    const features = this.features_ || new Collection([this.lastFeature_]);

    this.dispatchEvent(
      new Translate.Event(
        TranslateEventType.TRANSLATESTART, features,
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
Translate.handleUpEvent_ = function(event) {
  if (this.lastCoordinate_) {
    this.lastCoordinate_ = null;
    Translate.handleMoveEvent_.call(this, event);

    const features = this.features_ || new Collection([this.lastFeature_]);

    this.dispatchEvent(
      new Translate.Event(
        TranslateEventType.TRANSLATEEND, features,
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
Translate.handleDragEvent_ = function(event) {
  if (this.lastCoordinate_) {
    const newCoordinate = event.coordinate;
    const deltaX = newCoordinate[0] - this.lastCoordinate_[0];
    const deltaY = newCoordinate[1] - this.lastCoordinate_[1];

    const features = this.features_ || new Collection([this.lastFeature_]);

    features.forEach(function(feature) {
      const geom = feature.getGeometry();
      geom.translate(deltaX, deltaY);
      feature.setGeometry(geom);
    });

    this.lastCoordinate_ = newCoordinate;
    this.dispatchEvent(
      new Translate.Event(
        TranslateEventType.TRANSLATING, features,
        newCoordinate));
  }
};


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @this {ol.interaction.Translate}
 * @private
 */
Translate.handleMoveEvent_ = function(event) {
  const elem = event.map.getViewport();

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
Translate.prototype.featuresAtPixel_ = function(pixel, map) {
  return map.forEachFeatureAtPixel(pixel,
    function(feature) {
      if (!this.features_ || includes(this.features_.getArray(), feature)) {
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
Translate.prototype.getHitTolerance = function() {
  return this.hitTolerance_;
};


/**
 * Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @api
 */
Translate.prototype.setHitTolerance = function(hitTolerance) {
  this.hitTolerance_ = hitTolerance;
};


/**
 * @inheritDoc
 */
Translate.prototype.setMap = function(map) {
  const oldMap = this.getMap();
  PointerInteraction.prototype.setMap.call(this, map);
  this.updateState_(oldMap);
};


/**
 * @private
 */
Translate.prototype.handleActiveChanged_ = function() {
  this.updateState_(null);
};


/**
 * @param {ol.PluggableMap} oldMap Old map.
 * @private
 */
Translate.prototype.updateState_ = function(oldMap) {
  let map = this.getMap();
  const active = this.getActive();
  if (!map || !active) {
    map = map || oldMap;
    if (map) {
      const elem = map.getViewport();
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
Translate.Event = function(type, features, coordinate) {

  Event.call(this, type);

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
inherits(Translate.Event, Event);
export default Translate;
