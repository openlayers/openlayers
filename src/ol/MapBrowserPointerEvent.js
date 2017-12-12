/**
 * @module ol/MapBrowserPointerEvent
 */
import {inherits} from './index.js';
import _ol_MapBrowserEvent_ from './MapBrowserEvent.js';

/**
 * @constructor
 * @extends {ol.MapBrowserEvent}
 * @param {string} type Event type.
 * @param {ol.PluggableMap} map Map.
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @param {boolean=} opt_dragging Is the map currently being dragged?
 * @param {?olx.FrameState=} opt_frameState Frame state.
 */
var _ol_MapBrowserPointerEvent_ = function(type, map, pointerEvent, opt_dragging,
    opt_frameState) {

  _ol_MapBrowserEvent_.call(this, type, map, pointerEvent.originalEvent, opt_dragging,
      opt_frameState);

  /**
   * @const
   * @type {ol.pointer.PointerEvent}
   */
  this.pointerEvent = pointerEvent;

};

inherits(_ol_MapBrowserPointerEvent_, _ol_MapBrowserEvent_);
export default _ol_MapBrowserPointerEvent_;
