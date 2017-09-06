import _ol_events_EventType_ from './events/eventtype';

/**
 * Constants for event names.
 * @enum {string}
 */
var _ol_MapBrowserEventType_ = {

  /**
   * A true single click with no dragging and no double click. Note that this
   * event is delayed by 250 ms to ensure that it is not a double click.
   * @event ol.MapBrowserEvent#singleclick
   * @api
   */
  SINGLECLICK: 'singleclick',

  /**
   * A click with no dragging. A double click will fire two of this.
   * @event ol.MapBrowserEvent#click
   * @api
   */
  CLICK: _ol_events_EventType_.CLICK,

  /**
   * A true double click, with no dragging.
   * @event ol.MapBrowserEvent#dblclick
   * @api
   */
  DBLCLICK: _ol_events_EventType_.DBLCLICK,

  /**
   * Triggered when a pointer is dragged.
   * @event ol.MapBrowserEvent#pointerdrag
   * @api
   */
  POINTERDRAG: 'pointerdrag',

  /**
   * Triggered when a pointer is moved. Note that on touch devices this is
   * triggered when the map is panned, so is not the same as mousemove.
   * @event ol.MapBrowserEvent#pointermove
   * @api
   */
  POINTERMOVE: 'pointermove',

  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  POINTEROVER: 'pointerover',
  POINTEROUT: 'pointerout',
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  POINTERCANCEL: 'pointercancel'
};

export default _ol_MapBrowserEventType_;
