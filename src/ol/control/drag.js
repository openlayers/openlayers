
goog.provide('ol.control.Drag');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Control');
goog.require('ol.Coordinate');
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
   * @type {ol.Coordinate}
   */
  this.startCenter = null;

  /**
   * @type {ol.Coordinate}
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
  var map = mapBrowserEvent.map;
  if (!map.isDef()) {
    return;
  }
  var browserEvent = mapBrowserEvent.browserEvent;
  if (this.dragging_) {
    if (mapBrowserEvent.type == goog.fx.Dragger.EventType.DRAG) {
      goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      this.handleDrag(mapBrowserEvent);
    } else if (mapBrowserEvent.type == goog.fx.Dragger.EventType.END) {
      goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      this.handleDragEnd(mapBrowserEvent);
      this.dragging_ = false;
    }
  } else if (mapBrowserEvent.type == goog.fx.Dragger.EventType.START) {
    goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
    this.startX = browserEvent.clientX;
    this.startY = browserEvent.clientY;
    this.deltaX = 0;
    this.deltaY = 0;
    this.startCenter = /** @type {!ol.Coordinate} */ map.getCenter();
    this.startCoordinate = /** @type {ol.Coordinate} */
        mapBrowserEvent.getCoordinate();
    if (this.handleDragStart(mapBrowserEvent)) {
      this.dragging_ = true;
      mapBrowserEvent.preventDefault();
    }
  }
};
