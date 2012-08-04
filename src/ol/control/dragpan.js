// FIXME cope with rotation

goog.provide('ol.control.DragPan');

goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Constraints');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.control.DragPan = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.control.DragPan, ol.control.Drag);


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var resolution = map.getResolution();
  var delta =
      new ol.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  this.pan(map, delta, this.startCenter);
};


/**
 * @inheritDoc
 */
ol.control.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (!browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
