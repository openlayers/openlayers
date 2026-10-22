/**
 * @module ol/interaction/AsyncFeatureListener
 */
import {listen, unlistenByKey} from '../events.js';
import {
  click,
  doubleClick,
  pointerMove,
  singleClick,
} from '../events/condition.js';
import {FeatureEventType} from '../layer/FeatureEvent.js';

/**
 * The feature event that reports the same thing as a map event type.
 * @type {Object<string, import("../layer/FeatureEvent.js").FeatureEventTypes>}
 */
const featureEventForMapEvent = {
  click: FeatureEventType.CLICK,
  singleclick: FeatureEventType.SINGLECLICK,
  pointermove: FeatureEventType.HOVER,
};

/**
 * Whether a condition can pass for a map event of the given type. Conditions
 * that look at the event type are recognised directly. For any other
 * condition (key modifiers combined with a type check, say), the condition is
 * called with stand-in events of the given type, with every combination of the
 * modifier keys, and counts as passing if it passes for any of them, or throws.
 *
 * @param {import("../events/condition.js").Condition} condition Condition.
 * @param {string} type Map event type.
 * @return {boolean} The condition can pass for events of the type.
 */
function conditionAccepts(condition, type) {
  if (condition === click) {
    return type === 'click';
  }
  if (condition === singleClick) {
    return type === 'singleclick';
  }
  if (condition === pointerMove) {
    return type === 'pointermove';
  }
  if (condition === doubleClick) {
    return false;
  }
  for (let modifiers = 0; modifiers < 16; ++modifiers) {
    const originalEvent = {
      type,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      altKey: !!(modifiers & 1),
      shiftKey: !!(modifiers & 2),
      ctrlKey: !!(modifiers & 4),
      metaKey: !!(modifiers & 8),
      target: {tagName: 'DIV'},
    };
    const standIn = {
      type,
      originalEvent,
      dragging: false,
      map: {getTargetElement: () => null},
    };
    try {
      if (
        condition(
          /** @type {import("../MapBrowserEvent.js").default} */ (
            /** @type {unknown} */ (standIn)
          ),
        )
      ) {
        return true;
      }
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * The feature events an interaction needs to listen to, so that it handles the
 * same pointer events as its condition would let through. A condition that
 * accepts none of the events a layer reports (`dblclick`, say) falls back to
 * `featuresingleclick`.
 *
 * @param {import("../events/condition.js").Condition} condition Condition.
 * @return {Array<import("../layer/FeatureEvent.js").FeatureEventTypes>} Feature event types.
 */
export function featureEventTypesForCondition(condition) {
  /** @type {Array<import("../layer/FeatureEvent.js").FeatureEventTypes>} */
  const types = [];
  for (const mapEventType in featureEventForMapEvent) {
    if (conditionAccepts(condition, mapEventType)) {
      types.push(featureEventForMapEvent[mapEventType]);
    }
  }
  return types.length ? types : [FeatureEventType.SINGLECLICK];
}

/**
 * Listens to the feature events of the layers on a map that report features
 * asynchronously (see `Layer#hasAsyncFeatureQuery`). Layers that answer
 * synchronously are left to the map's `forEachFeatureAtPixel`.
 *
 * Listeners exist only while the listener is configured with a map and at
 * least one event type, and they follow layers as they are added to and
 * removed from the map, so a layer is not queried when nothing is interested.
 */
class AsyncFeatureListener {
  /**
   * @param {function(import("../layer/FeatureEvent.js").default): void} handler Called with every
   *     feature event of a layer that is being listened to.
   */
  constructor(handler) {
    /**
     * @private
     */
    this.handler_ = handler;

    /**
     * @private
     * @type {import("../Map.js").default|null}
     */
    this.map_ = null;

    /**
     * @private
     * @type {function(import("../layer/Layer.js").default): boolean}
     */
    this.layerFilter_ = () => true;

    /**
     * @private
     * @type {Array<import("../layer/FeatureEvent.js").FeatureEventTypes>}
     */
    this.types_ = [];

    /**
     * @private
     * @type {import("../layer/Group.js").default|null}
     */
    this.group_ = null;

    /**
     * @private
     * @type {Array<import("../events.js").EventsKey>}
     */
    this.mapKeys_ = [];

    /**
     * @private
     * @type {Array<import("../layer/Layer.js").default>}
     */
    this.layers_ = [];

    /**
     * @private
     * @type {Array<Array<import("../events.js").EventsKey>>}
     */
    this.layerKeys_ = [];

    /**
     * @private
     */
    this.boundUpdate_ = this.update.bind(this);
  }

  /**
   * Point the listener at a map, the layers it should listen to and the event
   * types it needs. Pass a null map to stop listening.
   * @param {import("../Map.js").default|null} map Map.
   * @param {function(import("../layer/Layer.js").default): boolean} layerFilter Layers to listen to.
   * @param {Array<import("../layer/FeatureEvent.js").FeatureEventTypes>} types Event types.
   */
  configure(map, layerFilter, types) {
    this.mapKeys_.forEach(unlistenByKey);
    this.mapKeys_.length = 0;
    this.group_ = null;
    this.map_ = map;
    this.layerFilter_ = layerFilter;
    this.types_ = types;
    this.releaseLayers_();
    if (map && types.length) {
      this.mapKeys_.push(listen(map, 'change:layergroup', this.boundUpdate_));
    }
    this.update();
  }

  /**
   * Listen to the layers that are on the map now.
   */
  update() {
    const map = this.map_;
    const active = !!map && this.types_.length > 0;
    const group = active ? map.getLayerGroup() : null;
    if (group !== this.group_) {
      this.mapKeys_[1] && unlistenByKey(this.mapKeys_[1]);
      this.mapKeys_.length = Math.min(this.mapKeys_.length, 1);
      this.group_ = group;
      if (group) {
        this.mapKeys_.push(listen(group, 'change', this.boundUpdate_));
      }
    }

    const wanted = active
      ? map
          .getAllLayers()
          .filter((layer) => layer.hasAsyncFeatureQuery())
          .filter(this.layerFilter_)
      : [];
    const keys = new Map();
    this.layers_.forEach((layer, i) => keys.set(layer, this.layerKeys_[i]));
    for (const layer of this.layers_) {
      if (!wanted.includes(layer)) {
        keys.get(layer).forEach(unlistenByKey);
      }
    }
    this.layerKeys_ = wanted.map(
      (layer) =>
        keys.get(layer) ||
        this.types_.map((type) =>
          listen(
            layer,
            type,
            /** @type {import("../events.js").ListenerFunction} */ (
              this.handler_
            ),
          ),
        ),
    );
    this.layers_ = wanted;
  }

  /**
   * @private
   */
  releaseLayers_() {
    this.layerKeys_.forEach((keys) => keys.forEach(unlistenByKey));
    this.layerKeys_ = [];
    this.layers_ = [];
  }

  /**
   * The layers that are being listened to, topmost first.
   * @return {Array<import("../layer/Layer.js").default>} Layers.
   */
  getLayers() {
    return this.layers_.slice().reverse();
  }

  /**
   * Stop listening.
   */
  dispose() {
    this.configure(null, this.layerFilter_, []);
  }
}

export default AsyncFeatureListener;
