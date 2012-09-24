// FIXME draw drag box

goog.provide('ol.interaction.ShiftDragZoom');

goog.require('ol.Extent');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');
goog.require('ol.interaction.Drag');


/**
 * @define {number} Hysterisis pixels.
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED =
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS *
    ol.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.ShiftDragZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.interaction.ShiftDragZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.ShiftDragZoom.prototype.handleDragEnd =
    function(mapBrowserEvent) {
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
ol.interaction.ShiftDragZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
