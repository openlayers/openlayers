goog.provide('ol.interaction.Drag');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.math.Coordinate');
goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Interaction');


/**
 * @typedef {{box: (boolean|undefined),
 *            boxClass: (string|undefined)}|null}
 */
ol.DragCaptureResponse;



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 */
ol.interaction.Drag = function() {

  goog.base(this);

  /**
   * @private
   * @type {Element}
   */
  this.box_ = null;

  /**
   * @private
   * @type {boolean}
   */
  this.dragging_ = false;

  /**
   * @type {goog.math.Coordinate}
   */
  this.start = null;

  /**
   * @type {goog.math.Coordinate}
   */
  this.delta = null;

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
 * @return {ol.DragCaptureResponse} Capture dragging response.
 */
ol.interaction.Drag.prototype.handleDragStart = goog.functions.NULL;


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
  goog.asserts.assert(browserEvent instanceof goog.events.BrowserEvent);
  var overlayContainer = map.getOverlayContainer();
  var position = goog.style.getRelativePosition(browserEvent, overlayContainer);
  if (this.dragging_) {
    goog.asserts.assert(!goog.isNull(this.start));
    this.delta = goog.math.Coordinate.difference(position, this.start);
    if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAG) {
      if (this.box_) {
        goog.style.setPosition(
            this.box_,
            Math.min(this.start.x, position.x),
            Math.min(this.start.y, position.y));
        goog.style.setBorderBoxSize(
            this.box_,
            new ol.Size(Math.abs(this.delta.x), Math.abs(this.delta.y)));
      }
      this.handleDrag(mapBrowserEvent);
    } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGEND) {
      this.handleDragEnd(mapBrowserEvent);
      if (this.box_) {
        goog.dom.removeNode(this.box_);
        this.box_ = null;
      }
      this.dragging_ = false;
      this.start = null;
      this.delta = null;
    }
  } else if (mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DRAGSTART) {
    this.start = position;
    this.delta = new goog.math.Coordinate(0, 0);
    this.startCenter = /** @type {!ol.Coordinate} */ map.getCenter();
    this.startCoordinate = /** @type {ol.Coordinate} */
        mapBrowserEvent.getCoordinate();
    var capture = this.handleDragStart(mapBrowserEvent);
    if (!goog.isNull(capture)) {
      this.dragging_ = true;
      mapBrowserEvent.preventDefault();
      if (capture.box) {
        this.box_ = goog.dom.createDom(goog.dom.TagName.DIV, capture.boxClass);
        goog.style.setPosition(this.box_, this.start.x, this.start.y);
        goog.style.setBorderBoxSize(this.box_, new ol.Size(0, 0));
        goog.dom.appendChild(overlayContainer, this.box_);
      }
    }
  }
};
