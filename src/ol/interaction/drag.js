
goog.provide('ol.interaction.Drag');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');
goog.require('ol.interaction.Interaction');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.Drag = function(constraints) {

  goog.base(this, constraints);

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
goog.inherits(ol.interaction.Drag, ol.interaction.Interaction);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Drag.prototype.handleDrag = goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Drag.prototype.handleDragEnd = goog.nullFunction;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 * @return {boolean} Capture dragging.
 */
ol.interaction.Drag.prototype.handleDragStart = goog.functions.FALSE;


/**
 * @inheritDoc
 */
ol.interaction.Drag.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  if (!map.isDef()) {
    return;
  }
  var browserEvent = mapBrowserEvent.browserEvent;
  if (this.dragging_) {
    if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAG) {
      goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      this.handleDrag(mapBrowserEvent);
    } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGEND) {
      goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      this.handleDragEnd(mapBrowserEvent);
      this.dragging_ = false;
    }
  } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGSTART) {
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
