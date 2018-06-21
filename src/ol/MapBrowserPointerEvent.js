/**
 * @module ol/MapBrowserPointerEvent
 */
import {inherits} from './util.js';
import MapBrowserEvent from './MapBrowserEvent.js';

/**
 * @constructor
 * @extends {module:ol/MapBrowserEvent}
 * @param {string} type Event type.
 * @param {module:ol/PluggableMap} map Map.
 * @param {module:ol/pointer/PointerEvent} pointerEvent Pointer
 * event.
 * @param {boolean=} opt_dragging Is the map currently being dragged?
 * @param {?module:ol/PluggableMap~FrameState=} opt_frameState Frame state.
 */
const MapBrowserPointerEvent = function(type, map, pointerEvent, opt_dragging,
  opt_frameState) {

  MapBrowserEvent.call(this, type, map, pointerEvent.originalEvent, opt_dragging,
    opt_frameState);

  /**
   * @const
   * @type {module:ol/pointer/PointerEvent}
   */
  this.pointerEvent = pointerEvent;

};

inherits(MapBrowserPointerEvent, MapBrowserEvent);
export default MapBrowserPointerEvent;
