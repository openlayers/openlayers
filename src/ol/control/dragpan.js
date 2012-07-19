goog.provide('ol.control.DragPan');

goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 */
ol.control.DragPan = function() {
  goog.base(this);
};
goog.inherits(ol.control.DragPan, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var resolution = map.getResolution();
  var center = new ol.Coordinate(
      this.startCenter.x - resolution * this.deltaX,
      this.startCenter.y + resolution * this.deltaY);
  map.setCenter(center);
};


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEventObject = mapBrowserEvent.getBrowserEventObject();
  if (!browserEventObject.shiftKey) {
    browserEventObject.preventDefault();
    return true;
  } else {
    return false;
  }
};
