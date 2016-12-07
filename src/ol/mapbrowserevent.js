goog.provide('ol.MapBrowserEvent');

goog.require('ol');
goog.require('ol.MapEvent');
goog.require('ol.events.EventType');


/**
 * @classdesc
 * Events emitted as map browser events are instances of this type.
 * See {@link ol.Map} for which events trigger a map browser event.
 *
 * @constructor
 * @extends {ol.MapEvent}
 * @implements {oli.MapBrowserEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {Event} browserEvent Browser event.
 * @param {boolean=} opt_dragging Is the map currently being dragged?
 * @param {?olx.FrameState=} opt_frameState Frame state.
 */
ol.MapBrowserEvent = function(type, map, browserEvent, opt_dragging,
    opt_frameState) {

  ol.MapEvent.call(this, type, map, opt_frameState);

  /**
   * The original browser event.
   * @const
   * @type {Event}
   * @api stable
   */
  this.originalEvent = browserEvent;

  /**
   * The map pixel relative to the viewport corresponding to the original browser event.
   * @type {ol.Pixel}
   * @api stable
   */
  this.pixel = map.getEventPixel(browserEvent);

  /**
   * The coordinate in view projection corresponding to the original browser event.
   * @type {ol.Coordinate}
   * @api stable
   */
  this.coordinate = map.getCoordinateFromPixel(this.pixel);

  /**
   * Indicates if the map is currently being dragged. Only set for
   * `POINTERDRAG` and `POINTERMOVE` events. Default is `false`.
   *
   * @type {boolean}
   * @api stable
   */
  this.dragging = opt_dragging !== undefined ? opt_dragging : false;

};
ol.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * Prevents the default browser action.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/event.preventDefault
 * @override
 * @api stable
 */
ol.MapBrowserEvent.prototype.preventDefault = function() {
  ol.MapEvent.prototype.preventDefault.call(this);
  this.originalEvent.preventDefault();
};


/**
 * Prevents further propagation of the current event.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/event.stopPropagation
 * @override
 * @api stable
 */
ol.MapBrowserEvent.prototype.stopPropagation = function() {
  ol.MapEvent.prototype.stopPropagation.call(this);
  this.originalEvent.stopPropagation();
};


/**
 * Constants for event names.
 * @enum {string}
 */
ol.MapBrowserEvent.EventType = {

  /**
   * A true single click with no dragging and no double click. Note that this
   * event is delayed by 250 ms to ensure that it is not a double click.
   * @event ol.MapBrowserEvent#singleclick
   * @api stable
   */
  SINGLECLICK: 'singleclick',

  /**
   * A click with no dragging. A double click will fire two of this.
   * @event ol.MapBrowserEvent#click
   * @api stable
   */
  CLICK: ol.events.EventType.CLICK,

  /**
   * A true double click, with no dragging.
   * @event ol.MapBrowserEvent#dblclick
   * @api stable
   */
  DBLCLICK: ol.events.EventType.DBLCLICK,

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
   * @api stable
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
