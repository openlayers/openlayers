// FIXME draw drag box

goog.provide('ol.control.DragZoom');

goog.require('ol.Extent');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');


/**
 * @define {number} Hysterisis pixels.
 */
ol.DRAG_ZOOM_HYSTERESIS_PIXELS = 8;



/**
 * @constructor
 * @extends {ol.control.Drag}
 */
ol.control.DragZoom = function() {
  goog.base(this);
};
goog.inherits(ol.control.DragZoom, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.DragZoom.prototype.handleDragEnd = function(mapBrowserEvent) {
  if (this.deltaX * this.deltaX + this.deltaY * this.deltaY >=
      ol.DRAG_ZOOM_HYSTERESIS_PIXELS * ol.DRAG_ZOOM_HYSTERESIS_PIXELS) {
    var extent = ol.Extent.boundingExtent(
        this.startCoordinate,
        mapBrowserEvent.getCoordinate());
    mapBrowserEvent.map.fitExtent(extent);
  }
};


/**
 * @inheritDoc
 */
ol.control.DragZoom.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEventObject = mapBrowserEvent.getBrowserEventObject();
  if (browserEventObject.shiftKey) {
    browserEventObject.preventDefault();
    return true;
  } else {
    return false;
  }
};
