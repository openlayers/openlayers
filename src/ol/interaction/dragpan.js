goog.provide('ol.interaction.DragPan');

goog.require('ol.Coordinate');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.DragPan = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.interaction.DragPan, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var resolution = map.getResolution();
  var rotation = map.getRotation();
  var delta =
      new ol.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  if (map.canRotate() && goog.isDef(rotation)) {
    delta.rotate(rotation);
  }
  this.pan(map, delta, this.startCenter);
};


/**
 * @inheritDoc
 */
ol.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (!browserEvent.shiftKey) {
    return true;
  } else {
    return false;
  }
};
