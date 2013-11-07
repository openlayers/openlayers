goog.provide('ol.interaction.Drag');

goog.require('goog.asserts');
goog.require('goog.events.BrowserEvent');
goog.require('goog.functions');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.ViewHint');
goog.require('ol.interaction.Interaction');



/**
 * Base class for interactions that drag the map.
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.Drag = function() {

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
  this.deltaX = 0;

  /**
   * @type {number}
   */
  this.deltaY = 0;

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
 * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
 * @protected
 */
ol.interaction.Drag.prototype.handleDown = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.interaction.Drag.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  if (!map.isDef()) {
    return true;
  }
  var stopEvent = false;
  var view = map.getView();
  var browserEvent = mapBrowserEvent.browserEvent;
  if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DOWN) {
    goog.asserts.assertInstanceof(browserEvent, goog.events.BrowserEvent);
    this.handleDown(mapBrowserEvent);
  }
  if (this.dragging_) {
    if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAG) {
      goog.asserts.assertInstanceof(browserEvent, goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      this.handleDrag(mapBrowserEvent);
    } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGEND) {
      goog.asserts.assertInstanceof(browserEvent, goog.events.BrowserEvent);
      this.deltaX = browserEvent.clientX - this.startX;
      this.deltaY = browserEvent.clientY - this.startY;
      view.setHint(ol.ViewHint.INTERACTING, -1);
      this.dragging_ = false;
      this.handleDragEnd(mapBrowserEvent);
    }
  } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGSTART) {
    goog.asserts.assertInstanceof(browserEvent, goog.events.BrowserEvent);
    var view2DState = view.getView2D().getView2DState();
    this.startX = browserEvent.clientX;
    this.startY = browserEvent.clientY;
    this.deltaX = 0;
    this.deltaY = 0;
    this.startCenter = view2DState.center;
    this.startCoordinate = /** @type {ol.Coordinate} */
        (mapBrowserEvent.getCoordinate());
    var handled = this.handleDragStart(mapBrowserEvent);
    if (handled) {
      view.setHint(ol.ViewHint.INTERACTING, 1);
      this.dragging_ = true;
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
