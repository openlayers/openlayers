// FIXME draw drag box

goog.provide('ol.interaction.ShiftDragZoom');

goog.require('ol.Extent');
goog.require('ol.MapBrowserEvent');
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
 */
ol.interaction.ShiftDragZoom = function() {
  goog.base(this);
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
    map.fitExtent(extent);
  }
};


/**
 * @inheritDoc
 */
ol.interaction.ShiftDragZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && browserEvent.shiftKey) {
    return true;
  } else {
    return false;
  }
};
