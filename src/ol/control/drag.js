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

};
goog.inherits(ol.control.Drag, ol.Control);


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @protected
 */
ol.control.Drag.prototype.handleDrag = goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.control.Drag.prototype.handleDragStart = goog.functions.FALSE;


/**
 * @param {ol.MapBrowserEvent} event Event.
 * @protected
 */
ol.control.Drag.prototype.handleDragEnd = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.control.Drag.prototype.handleMapBrowserEvent = function(event) {
  var browserEventObject;
  if (this.dragging_) {
    if (event.type == goog.events.EventType.MOUSEMOVE ||
        event.type == goog.events.EventType.MOUSEOUT ||
        event.type == goog.events.EventType.MOUSEUP) {
      browserEventObject = event.getBrowserEventObject();
      this.deltaX = browserEventObject.offsetX - this.startX;
      this.deltaY = browserEventObject.offsetY - this.startY;
      if (event.type == goog.events.EventType.MOUSEMOVE) {
        this.handleDrag(event);
      } else {
        this.handleDragEnd(event);
        this.dragging_ = false;
      }
      event.preventDefault();
    }
  } else {
    if (event.type == goog.events.EventType.MOUSEDOWN) {
      browserEventObject = event.getBrowserEventObject();
      this.startX = browserEventObject.offsetX;
      this.startY = browserEventObject.offsetY;
      this.deltaX = 0;
      this.deltaY = 0;
      if (this.handleDragStart(event)) {
        this.dragging_ = true;
        event.preventDefault();
      }
    }
  }
};
