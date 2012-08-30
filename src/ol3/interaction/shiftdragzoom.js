// FIXME draw drag box

goog.provide('ol3.interaction.ShiftDragZoom');

goog.require('ol3.Extent');
goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Constraints');
goog.require('ol3.interaction.Drag');


/**
 * @define {number} Hysterisis pixels.
 */
ol3.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS = 8;


/**
 * @const {number}
 */
ol3.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED =
    ol3.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS *
    ol3.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS;



/**
 * @constructor
 * @extends {ol3.interaction.Drag}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.ShiftDragZoom = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol3.interaction.ShiftDragZoom, ol3.interaction.Drag);


/**
 * @inheritDoc
 */
ol3.interaction.ShiftDragZoom.prototype.handleDragEnd =
    function(mapBrowserEvent) {
  if (this.deltaX * this.deltaX + this.deltaY * this.deltaY >=
      ol3.SHIFT_DRAG_ZOOM_HYSTERESIS_PIXELS_SQUARED) {
    var map = mapBrowserEvent.map;
    var extent = ol3.Extent.boundingExtent(
        this.startCoordinate,
        mapBrowserEvent.getCoordinate());
    this.fitExtent(map, extent);
  }
};


/**
 * @inheritDoc
 */
ol3.interaction.ShiftDragZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (browserEvent.isMouseActionButton() && browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
