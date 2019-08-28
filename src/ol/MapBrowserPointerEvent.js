/**
 * @module ol/MapBrowserPointerEvent
 */
import MapBrowserEvent from './MapBrowserEvent.js';

class MapBrowserPointerEvent extends MapBrowserEvent {

  /**
   * @param {string} type Event type.
   * @param {import("./PluggableMap.js").default} map Map.
   * @param {PointerEvent} pointerEvent Pointer event.
   * @param {boolean=} opt_dragging Is the map currently being dragged?
   * @param {?import("./PluggableMap.js").FrameState=} opt_frameState Frame state.
   */
  constructor(type, map, pointerEvent, opt_dragging, opt_frameState) {

    super(type, map, pointerEvent, opt_dragging, opt_frameState);

    /**
     * @const
     * @type {PointerEvent}
     */
    this.pointerEvent = pointerEvent;

  }

}

export default MapBrowserPointerEvent;
