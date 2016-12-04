goog.provide('ol.MapBrowserPointerEvent');

goog.require('ol');
goog.require('ol.MapBrowserEvent');


/**
 * @constructor
 * @extends {ol.MapBrowserEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @param {boolean=} opt_dragging Is the map currently being dragged?
 * @param {?olx.FrameState=} opt_frameState Frame state.
 */
ol.MapBrowserPointerEvent = function(type, map, pointerEvent, opt_dragging,
    opt_frameState) {

  ol.MapBrowserEvent.call(this, type, map, pointerEvent.originalEvent, opt_dragging,
      opt_frameState);

  /**
   * @const
   * @type {ol.pointer.PointerEvent}
   */
  this.pointerEvent = pointerEvent;

};
ol.inherits(ol.MapBrowserPointerEvent, ol.MapBrowserEvent);
