// FIXME draw drag box

goog.provide('ol.control.ShiftDragZoom');

goog.require('ol.Extent');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Constraints');
goog.require('ol.control.Drag');


/**
 * @define {number} Hysterisis pixels.
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED =
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS * ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;



/**
 * @constructor
 * @extends {ol.control.Drag}
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.control.ShiftDragZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.control.ShiftDragZoom, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.ShiftDragZoom.prototype.handleDragEnd = function(mapBrowserEvent) {
  if (this.deltaX * this.deltaX + this.deltaY * this.deltaY >=
      ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED) {
    var map = mapBrowserEvent.map;
    var extent = ol.Extent.boundingExtent(
        this.startCoordinate,
        mapBrowserEvent.getCoordinate());
    this.fitExtent(map, extent);
  }
};


/**
 * @inheritDoc
 */
ol.control.ShiftDragZoom.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
