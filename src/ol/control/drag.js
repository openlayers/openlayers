// FIXME support touch events?
// FIXME use goog.fx.Dragger in ol.Map instead?

goog.provide('ol.control.Drag');

goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Control');
goog.require('ol.MapBrowserEvent');



/**
 * @constructor
 * @extends {ol.Control}
 */
ol.control.Drag = function() {

  goog.base(this);

  /**
   * @private
   * @type {boolean}
   */
  this.dragging_ = false;

  /**
   * @type {number}
   */
  this.startX = 0;

  /**
   * @type {number}
   */
  this.startY = 0;

  /**
   * @type {number}
   */
  this.offsetX = 0;

  /**
   * @type {number}
   */
  this.offsetY = 0;

  /**
   * @type {goog.math.Coordinate}
   */
  this.startCenter = null;

  /**
   * @type {goog.math.Coordinate}
   */
  this.startCoordinate = null;

};
goog.inherits(ol.control.Drag, ol.Control);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.control.Drag.prototype.handleDrag = goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.control.Drag.prototype.handleDragStart = goog.functions.FALSE;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.control.Drag.prototype.handleDragEnd = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.control.Drag.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  var browserEventObject;
  if (this.dragging_) {
    if (mapBrowserEvent.type == goog.events.EventType.MOUSEMOVE ||
        mapBrowserEvent.type == goog.events.EventType.MOUSEOUT ||
        mapBrowserEvent.type == goog.events.EventType.MOUSEUP) {
      browserEventObject = mapBrowserEvent.getBrowserEventObject();
      this.deltaX = browserEventObject.offsetX - this.startX;
      this.deltaY = browserEventObject.offsetY - this.startY;
      if (mapBrowserEvent.type == goog.events.EventType.MOUSEMOVE) {
        this.handleDrag(mapBrowserEvent);
      } else {
        this.handleDragEnd(mapBrowserEvent);
        this.dragging_ = false;
      }
      mapBrowserEvent.preventDefault();
    }
  } else {
    if (mapBrowserEvent.type == goog.events.EventType.MOUSEDOWN) {
      browserEventObject = mapBrowserEvent.getBrowserEventObject();
      this.startX = browserEventObject.offsetX;
      this.startY = browserEventObject.offsetY;
      this.deltaX = 0;
      this.deltaY = 0;
      this.startCenter = mapBrowserEvent.map.getCenter();
      this.startCoordinate = mapBrowserEvent.getCoordinate();
      if (this.handleDragStart(mapBrowserEvent)) {
        this.dragging_ = true;
        mapBrowserEvent.preventDefault();
      }
    }
  }
};
