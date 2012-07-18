goog.provide('ol.control.DragPan');

goog.require('goog.functions');
goog.require('goog.math.Coordinate');
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
  var center = new goog.math.Coordinate(
      this.startCenter.x - resolution * this.deltaX,
      this.startCenter.y + resolution * this.deltaY);
  map.setCenter(center);
};


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDragStart = goog.functions.TRUE;
