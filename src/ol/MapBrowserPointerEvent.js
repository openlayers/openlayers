/**
 * @module ol/MapBrowserPointerEvent
 */
import MapBrowserEvent from './MapBrowserEvent.js';

class MapBrowserPointerEvent extends MapBrowserEvent {

  /**
   * @param {string} type Event type.
   * @param {module:ol/PluggableMap} map Map.
   * @param {module:ol/pointer/PointerEvent} pointerEvent Pointer event.
   * @param {boolean=} opt_dragging Is the map currently being dragged?
   * @param {?module:ol/PluggableMap~FrameState=} opt_frameState Frame state.
   */
  constructor(type, map, pointerEvent, opt_dragging, opt_frameState) {

    super(type, map, pointerEvent.originalEvent, opt_dragging, opt_frameState);

    /**
     * @const
     * @type {module:ol/pointer/PointerEvent}
     */
    this.pointerEvent = pointerEvent;

  }

}

export default MapBrowserPointerEvent;
