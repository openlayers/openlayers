/**
 * @module ol/layer/FeatureEventController
 */
import {listen, unlistenByKey} from '../events.js';
import FeatureEvent, {
  FeatureEventType,
  mapEventTypeForFeatureEvent,
} from './FeatureEvent.js';
import LayerProperty from './Property.js';

/**
 * A pending feature query.
 * @typedef {Object} QueryRequest
 * @property {import("./FeatureEvent.js").FeatureEventTypes} type Event type to dispatch.
 * @property {import("../MapBrowserEvent.js").default} mapBrowserEvent The triggering event.
 * @property {number} epoch For hover queries, the hover epoch the query belongs to.
 */

/**
 * Turns map pointer events into feature events for one layer.
 *
 * The controller listens to the map only for the map events that the
 * registered feature event listeners need, and removes its map listeners as
 * soon as the last feature event listener is removed. A layer whose renderer
 * answers a query synchronously dispatches the feature event synchronously,
 * from within the map event. A renderer that answers with a promise has at
 * most one query in flight; pointer moves that arrive meanwhile collapse to
 * the latest one, and clicks queue up so none is dropped.
 */
class FeatureEventController {
  /**
   * @param {import("./Layer.js").default} layer The layer to dispatch events on.
   */
  constructor(layer) {
    /**
     * @private
     * @type {import("./Layer.js").default}
     */
    this.layer_ = layer;

    /**
     * @private
     * @type {import("../Map.js").default|null}
     */
    this.map_ = null;

    /**
     * Identifies the map and the map events currently listened to.
     * @private
     * @type {string}
     */
    this.subscription_ = '';

    /**
     * @private
     * @type {Array<import("../events.js").EventsKey>}
     */
    this.keys_ = [];

    /**
     * The topmost feature last reported by `featurehover`.
     * @private
     * @type {import("../Feature.js").FeatureLike|undefined}
     */
    this.hovered_ = undefined;

    /**
     * Incremented whenever pending hover results must be discarded: when a
     * drag starts, the pointer leaves the map, or the hover listeners go away.
     * @private
     * @type {number}
     */
    this.hoverEpoch_ = 0;

    /**
     * @private
     * @type {boolean}
     */
    this.inFlight_ = false;

    /**
     * @private
     * @type {QueryRequest|null}
     */
    this.pendingHover_ = null;

    /**
     * @private
     * @type {Array<QueryRequest>}
     */
    this.pendingClicks_ = [];

    /**
     * @private
     * @type {boolean}
     */
    this.disposed_ = false;

    /**
     * @private
     */
    this.boundUpdate_ = this.update.bind(this);

    /**
     * @private
     */
    this.boundHandlePointerMove_ = this.handlePointerMove_.bind(this);

    /**
     * @private
     */
    this.boundHandleClick_ = this.handleClick_.bind(this);

    /**
     * @private
     */
    this.boundHandleSingleClick_ = this.handleSingleClick_.bind(this);

    /**
     * @private
     */
    this.boundHandlePointerLeave_ = this.invalidateHover_.bind(this);

    layer.addChangeListener(LayerProperty.MAP, this.boundUpdate_);
  }

  /**
   * Brings the map listeners in line with the registered feature event
   * listeners and the layer's map. Call it whenever either changes.
   */
  update() {
    if (this.disposed_) {
      return;
    }
    const layer = this.layer_;
    const map = layer.getMapInternal();
    const mapEventTypes = [];
    for (const type in mapEventTypeForFeatureEvent) {
      if (layer.hasListener(type)) {
        mapEventTypes.push(mapEventTypeForFeatureEvent[type]);
      }
    }
    const subscription = map ? mapEventTypes.join() : '';
    if (map === this.map_ && subscription === this.subscription_) {
      return;
    }

    this.keys_.forEach(unlistenByKey);
    this.keys_.length = 0;
    if (!subscription) {
      this.releaseQueryResources_();
    }
    const hoverStays =
      map === this.map_ &&
      this.subscription_.includes('pointermove') &&
      subscription.includes('pointermove');
    if (!hoverStays) {
      this.invalidateHover_();
    }
    this.map_ = map;
    this.subscription_ = subscription;
    if (!map) {
      return;
    }
    for (const mapEventType of mapEventTypes) {
      switch (mapEventType) {
        case 'pointermove':
          this.keys_.push(map.on('pointermove', this.boundHandlePointerMove_));
          this.listenToPointerLeave_(map);
          break;
        case 'click':
          this.keys_.push(map.on('click', this.boundHandleClick_));
          break;
        default:
          this.keys_.push(map.on('singleclick', this.boundHandleSingleClick_));
      }
    }
  }

  /**
   * Lets the renderer free what it holds for answering queries.
   * @private
   */
  releaseQueryResources_() {
    const layer = this.layer_;
    if (layer.hasRenderer()) {
      layer.getRenderer()?.releaseQueryResources();
    }
  }

  /**
   * @param {import("../Map.js").default} map Map.
   * @private
   */
  listenToPointerLeave_(map) {
    const viewport = map.getViewport();
    if (viewport) {
      this.keys_.push(
        listen(viewport, 'pointerleave', this.boundHandlePointerLeave_),
      );
    }
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} event Map event.
   * @private
   */
  handlePointerMove_(event) {
    if (event.dragging) {
      this.invalidateHover_();
      return;
    }
    this.request_({
      type: FeatureEventType.HOVER,
      mapBrowserEvent: event,
      epoch: this.hoverEpoch_,
    });
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} event Map event.
   * @private
   */
  handleClick_(event) {
    this.request_({
      type: FeatureEventType.CLICK,
      mapBrowserEvent: event,
      epoch: this.hoverEpoch_,
    });
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} event Map event.
   * @private
   */
  handleSingleClick_(event) {
    this.request_({
      type: FeatureEventType.SINGLECLICK,
      mapBrowserEvent: event,
      epoch: this.hoverEpoch_,
    });
  }

  /**
   * Discards pending hover results and reports that there is no feature under
   * the pointer any more.
   * @private
   */
  invalidateHover_() {
    ++this.hoverEpoch_;
    this.pendingHover_ = null;
    const previous = this.hovered_;
    if (previous === undefined) {
      return;
    }
    this.hovered_ = undefined;
    if (this.layer_.hasListener(FeatureEventType.HOVER)) {
      this.layer_.dispatchEvent(
        new FeatureEvent(
          FeatureEventType.HOVER,
          this.layer_,
          [],
          undefined,
          previous,
        ),
      );
    }
  }

  /**
   * @param {QueryRequest} request Request.
   * @private
   */
  request_(request) {
    if (!this.inFlight_) {
      this.run_(request);
    } else if (request.type === FeatureEventType.HOVER) {
      this.pendingHover_ = request;
    } else {
      this.pendingClicks_.push(request);
    }
  }

  /**
   * @param {QueryRequest} request Request.
   * @private
   */
  run_(request) {
    const layer = this.layer_;
    const renderer = layer.hasRenderer() ? layer.getRenderer() : null;
    const result = renderer
      ? renderer.queryFeatures(
          request.mapBrowserEvent.pixel,
          layer.getHitTolerance(),
          request.type !== FeatureEventType.HOVER,
        )
      : [];
    if (Array.isArray(result)) {
      this.deliver_(request, result);
      return;
    }
    this.inFlight_ = true;
    result.then(
      (features) => this.settle_(request, features),
      () => this.settle_(request, null),
    );
  }

  /**
   * @param {QueryRequest} request Request.
   * @param {Array<import("../Feature.js").FeatureLike>|null} features Features,
   *     or null if the query failed.
   * @private
   */
  settle_(request, features) {
    this.inFlight_ = false;
    if (features && !this.disposed_) {
      this.deliver_(request, features);
    }
    this.drain_();
  }

  /**
   * @private
   */
  drain_() {
    if (this.disposed_) {
      return;
    }
    const next = this.pendingClicks_.shift();
    if (next) {
      this.run_(next);
      return;
    }
    const hover = this.pendingHover_;
    this.pendingHover_ = null;
    if (hover && hover.epoch === this.hoverEpoch_) {
      this.run_(hover);
    }
  }

  /**
   * @param {QueryRequest} request Request.
   * @param {Array<import("../Feature.js").FeatureLike>} features Features, topmost first.
   * @private
   */
  deliver_(request, features) {
    const layer = this.layer_;
    if (!layer.hasListener(request.type)) {
      return;
    }
    if (request.type !== FeatureEventType.HOVER) {
      layer.dispatchEvent(
        new FeatureEvent(
          request.type,
          layer,
          features,
          request.mapBrowserEvent,
        ),
      );
      return;
    }
    const feature = features[0];
    if (request.epoch !== this.hoverEpoch_ || feature === this.hovered_) {
      return;
    }
    const previous = this.hovered_;
    this.hovered_ = feature;
    layer.dispatchEvent(
      new FeatureEvent(
        FeatureEventType.HOVER,
        layer,
        features,
        request.mapBrowserEvent,
        previous,
      ),
    );
  }

  /**
   * Removes all listeners. Pending queries are dropped.
   */
  dispose() {
    this.disposed_ = true;
    this.keys_.forEach(unlistenByKey);
    this.keys_.length = 0;
    this.pendingHover_ = null;
    this.pendingClicks_.length = 0;
    this.releaseQueryResources_();
    this.layer_.removeChangeListener(LayerProperty.MAP, this.boundUpdate_);
  }
}

export default FeatureEventController;
