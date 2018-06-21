/**
 * @module ol/interaction/Translate
 */
import {inherits} from '../util.js';
import Collection from '../Collection.js';
import {getChangeEventType} from '../Object.js';
import {listen} from '../events.js';
import Event from '../events/Event.js';
import {TRUE} from '../functions.js';
import {includes} from '../array.js';
import PointerInteraction from '../interaction/Pointer.js';
import InteractionProperty from '../interaction/Property.js';


/**
 * @enum {string}
 */
const TranslateEventType = {
  /**
   * Triggered upon feature translation start.
   * @event TranslateEvent#translatestart
   * @api
   */
  TRANSLATESTART: 'translatestart',
  /**
   * Triggered upon feature translation.
   * @event TranslateEvent#translating
   * @api
   */
  TRANSLATING: 'translating',
  /**
   * Triggered upon feature translation end.
   * @event TranslateEvent#translateend
   * @api
   */
  TRANSLATEEND: 'translateend'
};


/**
 * @typedef {Object} Options
 * @property {module:ol/Collection.<module:ol/Feature>} [features] Only features contained in this collection will be able to be translated. If
 * not specified, all features on the map will be able to be translated.
 * @property {Array.<module:ol/layer/Layer>|function(module:ol/layer/Layer): boolean} [layers] A list of layers from which features should be
 * translated. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be translatable. If the option is
 * absent, all visible layers will be considered translatable.
 * @property {number} [hitTolerance=0] Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL.
 */


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Translate~Translate} instances
 * are instances of this type.
 *
 * @constructor
 * @extends {module:ol/events/Event}
 * @param {module:ol/interaction/Translate~TranslateEventType} type Type.
 * @param {module:ol/Collection.<module:ol/Feature>} features The features translated.
 * @param {module:ol/coordinate~Coordinate} coordinate The event coordinate.
 */
export const TranslateEvent = function(type, features, coordinate) {

  Event.call(this, type);

  /**
   * The features being translated.
   * @type {module:ol/Collection.<module:ol/Feature>}
   * @api
   */
  this.features = features;

  /**
   * The coordinate of the drag event.
   * @const
   * @type {module:ol/coordinate~Coordinate}
   * @api
   */
  this.coordinate = coordinate;
};

inherits(TranslateEvent, Event);


/**
 * @classdesc
 * Interaction for translating (moving) features.
 *
 * @constructor
 * @extends {module:ol/interaction/Pointer}
 * @fires module:ol/interaction/Translate~TranslateEvent
 * @param {module:ol/interaction/Translate~Options=} opt_options Options.
 * @api
 */
const Translate = function(opt_options) {
  PointerInteraction.call(this, {
    handleDownEvent: handleDownEvent,
    handleDragEvent: handleDragEvent,
    handleMoveEvent: handleMoveEvent,
    handleUpEvent: handleUpEvent
  });

  const options = opt_options ? opt_options : {};

  /**
   * The last position we translated to.
   * @type {module:ol/coordinate~Coordinate}
   * @private
   */
  this.lastCoordinate_ = null;


  /**
   * @type {module:ol/Collection.<module:ol/Feature>}
   * @private
   */
  this.features_ = options.features !== undefined ? options.features : null;

  /** @type {function(module:ol/layer/Layer): boolean} */
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
   * @type {function(module:ol/layer/Layer): boolean}
   */
  this.layerFilter_ = layerFilter;

  /**
   * @private
   * @type {number}
   */
  this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

  /**
   * @type {module:ol/Feature}
   * @private
   */
  this.lastFeature_ = null;

  listen(this,
    getChangeEventType(InteractionProperty.ACTIVE),
    this.handleActiveChanged_, this);

};

inherits(Translate, PointerInteraction);


/**
 * @param {module:ol/MapBrowserPointerEvent} event Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/Translate}
 */
function handleDownEvent(event) {
  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (!this.lastCoordinate_ && this.lastFeature_) {
    this.lastCoordinate_ = event.coordinate;
    handleMoveEvent.call(this, event);

    const features = this.features_ || new Collection([this.lastFeature_]);

    this.dispatchEvent(
      new TranslateEvent(
        TranslateEventType.TRANSLATESTART, features,
        event.coordinate));
    return true;
  }
  return false;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} event Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/Translate}
 */
function handleUpEvent(event) {
  if (this.lastCoordinate_) {
    this.lastCoordinate_ = null;
    handleMoveEvent.call(this, event);

    const features = this.features_ || new Collection([this.lastFeature_]);

    this.dispatchEvent(
      new TranslateEvent(
        TranslateEventType.TRANSLATEEND, features,
        event.coordinate));
    return true;
  }
  return false;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} event Event.
 * @this {module:ol/interaction/Translate}
 */
function handleDragEvent(event) {
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
      new TranslateEvent(
        TranslateEventType.TRANSLATING, features,
        newCoordinate));
  }
}


/**
 * @param {module:ol/MapBrowserEvent} event Event.
 * @this {module:ol/interaction/Translate}
 */
function handleMoveEvent(event) {
  const elem = event.map.getViewport();

  // Change the cursor to grab/grabbing if hovering any of the features managed
  // by the interaction
  if (this.featuresAtPixel_(event.pixel, event.map)) {
    elem.classList.remove(this.lastCoordinate_ ? 'ol-grab' : 'ol-grabbing');
    elem.classList.add(this.lastCoordinate_ ? 'ol-grabbing' : 'ol-grab');
  } else {
    elem.classList.remove('ol-grab', 'ol-grabbing');
  }
}


/**
 * Tests to see if the given coordinates intersects any of our selected
 * features.
 * @param {module:ol~Pixel} pixel Pixel coordinate to test for intersection.
 * @param {module:ol/PluggableMap} map Map to test the intersection on.
 * @return {module:ol/Feature} Returns the feature found at the specified pixel
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
 * @param {module:ol/PluggableMap} oldMap Old map.
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


export default Translate;
