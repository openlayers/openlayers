/**
 * @module ol/layer/FeatureEvent
 */
import Event from '../events/Event.js';

/**
 * @typedef {'featurehover'|'featureclick'|'featuresingleclick'} FeatureEventTypes
 */

/**
 * The feature events a layer dispatches. A layer queries its features only
 * while at least one listener for one of these types is registered.
 * @type {{HOVER: 'featurehover', CLICK: 'featureclick', SINGLECLICK: 'featuresingleclick'}}
 */
export const FeatureEventType = {
  /**
   * Triggered when the topmost feature under the pointer changes, including
   * when it changes to nothing. This happens when the pointer leaves the map
   * or a drag starts as well.
   * @event module:ol/layer/FeatureEvent~FeatureEvent#featurehover
   * @api
   */
  HOVER: 'featurehover',

  /**
   * Triggered for every map `click`, whether or not a feature of the layer is
   * under the pointer.
   * @event module:ol/layer/FeatureEvent~FeatureEvent#featureclick
   * @api
   */
  CLICK: 'featureclick',

  /**
   * Triggered for every map `singleclick`, whether or not a feature of the
   * layer is under the pointer.
   * @event module:ol/layer/FeatureEvent~FeatureEvent#featuresingleclick
   * @api
   */
  SINGLECLICK: 'featuresingleclick',
};

/**
 * The map event that triggers the query for each feature event type.
 * @type {Object<string, string>}
 */
export const mapEventTypeForFeatureEvent = {
  [FeatureEventType.CLICK]: 'click',
  [FeatureEventType.SINGLECLICK]: 'singleclick',
  [FeatureEventType.HOVER]: 'pointermove',
};

/**
 * @param {string} type Event type.
 * @return {boolean} The type is one of the feature event types.
 */
export function isFeatureEventType(type) {
  return type in mapEventTypeForFeatureEvent;
}

/**
 * @classdesc
 * Events dispatched by a layer when features under the pointer are reported.
 * See {@link module:ol/layer/FeatureEvent~FeatureEventType} for the types.
 * Feature events are asynchronous for layers that query the GPU, so they may
 * arrive a few frames after the pointer event that triggered them.
 * @api
 */
class FeatureEvent extends Event {
  /**
   * @param {FeatureEventTypes} type Type.
   * @param {import("./Layer.js").default} layer The layer that was queried.
   * @param {Array<import("../Feature.js").FeatureLike>} features All features
   *     under the pointer, topmost first.
   * @param {import("../MapBrowserEvent.js").default} [mapBrowserEvent] The
   *     map event that triggered the query.
   * @param {import("../Feature.js").FeatureLike} [previousFeature] The previous
   *     topmost feature, for `featurehover`.
   */
  constructor(type, layer, features, mapBrowserEvent, previousFeature) {
    super(type);

    /**
     * The layer that was queried.
     * @type {import("./Layer.js").default}
     * @api
     */
    this.layer = layer;

    /**
     * The topmost feature under the pointer, or `undefined` if there is none.
     * @type {import("../Feature.js").FeatureLike|undefined}
     * @api
     */
    this.feature = features[0];

    /**
     * All features of the layer under the pointer, topmost first. A WebGPU
     * layer leaves out of `featurehover` the features that other features
     * cover, to answer sooner.
     * @type {Array<import("../Feature.js").FeatureLike>}
     * @api
     */
    this.features = features;

    /**
     * The topmost feature before this change. Only set for `featurehover`.
     * @type {import("../Feature.js").FeatureLike|undefined}
     * @api
     */
    this.previousFeature = previousFeature;

    /**
     * The map event that triggered the query. It is `undefined` when the
     * trigger was the pointer leaving the map, or a drag starting.
     * @type {import("../MapBrowserEvent.js").default|undefined}
     * @api
     */
    this.mapBrowserEvent = mapBrowserEvent;

    /**
     * The pixel of the pointer, relative to the map viewport. `undefined`
     * when there is no map event.
     * @type {import("../pixel.js").Pixel|undefined}
     * @api
     */
    this.pixel = mapBrowserEvent?.pixel;

    /**
     * The coordinate of the pointer. `undefined` when there is no map event.
     * @type {import("../coordinate.js").Coordinate|undefined}
     * @api
     */
    this.coordinate = mapBrowserEvent?.coordinate;
  }
}

export default FeatureEvent;
