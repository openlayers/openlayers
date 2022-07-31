/**
 * @module ol/MapEvent
 */
import Event from './events/Event.js';

/**
 * @classdesc
 * Events emitted as map events are instances of this type.
 * See {@link module:ol/Map~Map} for which events trigger a map event.
 */
class MapEvent extends Event {
  /**
   * @param {string} type Event type.
   * @param {import("./Map.js").default} map Map.
   * @param {?import("./Map.js").FrameState} [opt_frameState] Frame state.
   */
  constructor(type, map, opt_frameState) {
    super(type);

    /**
     * The map where the event occurred.
     * @type {import("./Map.js").default}
     * @api
     */
    this.map = map;

    /**
     * The frame state at the time of the event.
     * @type {?import("./Map.js").FrameState}
     * @api
     */
    this.frameState = opt_frameState !== undefined ? opt_frameState : null;
  }
}

export default MapEvent;
