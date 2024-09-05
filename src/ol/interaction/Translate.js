/**
 * @module ol/interaction/Translate
 */
import Collection from '../Collection.js';
import Event from '../events/Event.js';
import Feature from '../Feature.js';
import InteractionProperty from './Property.js';
import PointerInteraction from './Pointer.js';
import {TRUE} from '../functions.js';
import {always} from '../events/condition.js';
import {fromUserCoordinate, getUserProjection} from '../proj.js';

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
  TRANSLATEEND: 'translateend',
};

/**
 * A function that takes a {@link module:ol/Feature~Feature} or
 * {@link module:ol/render/Feature~RenderFeature} and a
 * {@link module:ol/layer/Layer~Layer} and returns `true` if the feature may be
 * translated or `false` otherwise.
 * @typedef {function(Feature, import("../layer/Layer.js").default<import("../source/Source").default>):boolean} FilterFunction
 */

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition.always}.
 * @property {Collection<Feature>} [features] Features contained in this collection will be able to be translated together.
 * @property {Array<import("../layer/Layer.js").default>|function(import("../layer/Layer.js").default<import("../source/Source").default>): boolean} [layers] A list of layers from which features should be
 * translated. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be translatable. If the option is
 * absent, all visible layers will be considered translatable.
 * Not used if `features` is provided.
 * @property {FilterFunction} [filter] A function
 * that takes a {@link module:ol/Feature~Feature} and an
 * {@link module:ol/layer/Layer~Layer} and returns `true` if the feature may be
 * translated or `false` otherwise. Not used if `features` is provided.
 * @property {number} [hitTolerance=0] Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features.
 */

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Translate~Translate} instances
 * are instances of this type.
 */
export class TranslateEvent extends Event {
  /**
   * @param {TranslateEventType} type Type.
   * @param {Collection<Feature>} features The features translated.
   * @param {import("../coordinate.js").Coordinate} coordinate The event coordinate.
   * @param {import("../coordinate.js").Coordinate} startCoordinate The original coordinates before.translation started
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   */
  constructor(type, features, coordinate, startCoordinate, mapBrowserEvent) {
    super(type);

    /**
     * The features being translated.
     * @type {Collection<Feature>}
     * @api
     */
    this.features = features;

    /**
     * The coordinate of the drag event.
     * @const
     * @type {import("../coordinate.js").Coordinate}
     * @api
     */
    this.coordinate = coordinate;

    /**
     * The coordinate of the start position before translation started.
     * @const
     * @type {import("../coordinate.js").Coordinate}
     * @api
     */
    this.startCoordinate = startCoordinate;

    /**
     * Associated {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserEvent;
  }
}

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'translateend'|'translatestart'|'translating', TranslateEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'translateend'|'translatestart'|'translating', Return>} TranslateOnSignature
 */

/**
 * @classdesc
 * Interaction for translating (moving) features.
 * If you want to translate multiple features in a single action (for example,
 * the collection used by a select interaction), construct the interaction with
 * the `features` option.
 *
 * @fires TranslateEvent
 * @api
 */
class Translate extends PointerInteraction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super(/** @type {import("./Pointer.js").Options} */ (options));

    /***
     * @type {TranslateOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {TranslateOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {TranslateOnSignature<void>}
     */
    this.un;

    /**
     * The last position we translated to.
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.lastCoordinate_ = null;

    /**
     * The start position before translation started.
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    this.startCoordinate_ = null;

    /**
     * @type {Collection<Feature>|null}
     * @private
     */
    this.features_ = options.features !== undefined ? options.features : null;

    /** @type {function(import("../layer/Layer.js").default<import("../source/Source").default>): boolean} */
    let layerFilter;
    if (options.layers && !this.features_) {
      if (typeof options.layers === 'function') {
        layerFilter = options.layers;
      } else {
        const layers = options.layers;
        layerFilter = function (layer) {
          return layers.includes(layer);
        };
      }
    } else {
      layerFilter = TRUE;
    }

    /**
     * @private
     * @type {function(import("../layer/Layer.js").default<import("../source/Source").default>): boolean}
     */
    this.layerFilter_ = layerFilter;

    /**
     * @private
     * @type {FilterFunction}
     */
    this.filter_ = options.filter && !this.features_ ? options.filter : TRUE;

    /**
     * @private
     * @type {number}
     */
    this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : always;

    /**
     * @type {Feature}
     * @private
     */
    this.lastFeature_ = null;

    this.addChangeListener(
      InteractionProperty.ACTIVE,
      this.handleActiveChanged_,
    );
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleDownEvent(event) {
    if (!event.originalEvent || !this.condition_(event)) {
      return false;
    }
    this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
    if (!this.lastCoordinate_ && this.lastFeature_) {
      this.startCoordinate_ = event.coordinate;
      this.lastCoordinate_ = event.coordinate;
      this.handleMoveEvent(event);

      const features = this.features_ || new Collection([this.lastFeature_]);

      this.dispatchEvent(
        new TranslateEvent(
          TranslateEventType.TRANSLATESTART,
          features,
          event.coordinate,
          this.startCoordinate_,
          event,
        ),
      );
      return true;
    }
    return false;
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleUpEvent(event) {
    if (this.lastCoordinate_) {
      this.lastCoordinate_ = null;
      this.handleMoveEvent(event);

      const features = this.features_ || new Collection([this.lastFeature_]);

      this.dispatchEvent(
        new TranslateEvent(
          TranslateEventType.TRANSLATEEND,
          features,
          event.coordinate,
          this.startCoordinate_,
          event,
        ),
      );
      // cleanup
      this.startCoordinate_ = null;
      return true;
    }
    return false;
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @override
   */
  handleDragEvent(event) {
    if (this.lastCoordinate_) {
      const newCoordinate = event.coordinate;
      const projection = event.map.getView().getProjection();

      const newViewCoordinate = fromUserCoordinate(newCoordinate, projection);
      const lastViewCoordinate = fromUserCoordinate(
        this.lastCoordinate_,
        projection,
      );
      const deltaX = newViewCoordinate[0] - lastViewCoordinate[0];
      const deltaY = newViewCoordinate[1] - lastViewCoordinate[1];

      const features = this.features_ || new Collection([this.lastFeature_]);
      const userProjection = getUserProjection();

      features.forEach(function (feature) {
        const geom = feature.getGeometry();
        if (userProjection) {
          geom.transform(userProjection, projection);
          geom.translate(deltaX, deltaY);
          geom.transform(projection, userProjection);
        } else {
          geom.translate(deltaX, deltaY);
        }
        feature.setGeometry(geom);
      });

      this.lastCoordinate_ = newCoordinate;

      this.dispatchEvent(
        new TranslateEvent(
          TranslateEventType.TRANSLATING,
          features,
          newCoordinate,
          this.startCoordinate_,
          event,
        ),
      );
    }
  }

  /**
   * Handle pointer move events.
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @override
   */
  handleMoveEvent(event) {
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
   * @param {import("../pixel.js").Pixel} pixel Pixel coordinate to test for intersection.
   * @param {import("../Map.js").default} map Map to test the intersection on.
   * @return {Feature} Returns the feature found at the specified pixel
   * coordinates.
   * @private
   */
  featuresAtPixel_(pixel, map) {
    return map.forEachFeatureAtPixel(
      pixel,
      (feature, layer) => {
        if (!(feature instanceof Feature) || !this.filter_(feature, layer)) {
          return undefined;
        }
        if (this.features_ && !this.features_.getArray().includes(feature)) {
          return undefined;
        }
        return feature;
      },
      {
        layerFilter: this.layerFilter_,
        hitTolerance: this.hitTolerance_,
      },
    );
  }

  /**
   * Returns the Hit-detection tolerance.
   * @return {number} Hit tolerance in pixels.
   * @api
   */
  getHitTolerance() {
    return this.hitTolerance_;
  }

  /**
   * Hit-detection tolerance. Pixels inside the radius around the given position
   * will be checked for features.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @api
   */
  setHitTolerance(hitTolerance) {
    this.hitTolerance_ = hitTolerance;
  }

  /**
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../Map.js").default} map Map.
   * @override
   */
  setMap(map) {
    const oldMap = this.getMap();
    super.setMap(map);
    this.updateState_(oldMap);
  }

  /**
   * @private
   */
  handleActiveChanged_() {
    this.updateState_(null);
  }

  /**
   * @param {import("../Map.js").default} oldMap Old map.
   * @private
   */
  updateState_(oldMap) {
    let map = this.getMap();
    const active = this.getActive();
    if (!map || !active) {
      map = map || oldMap;
      if (map) {
        const elem = map.getViewport();
        elem.classList.remove('ol-grab', 'ol-grabbing');
      }
    }
  }
}

export default Translate;
