goog.provide('ol3.interaction.DragPan');

goog.require('ol3.Coordinate');
goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Constraints');
goog.require('ol3.interaction.Drag');



/**
 * @constructor
 * @extends {ol3.interaction.Drag}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.DragPan = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol3.interaction.DragPan, ol3.interaction.Drag);


/**
 * @inheritDoc
 */
ol3.interaction.DragPan.prototype.handleDrag = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var resolution = map.getResolution();
  var rotation = map.getRotation();
  var delta =
      new ol3.Coordinate(-resolution * this.deltaX, resolution * this.deltaY);
  if (map.canRotate() && goog.isDef(rotation)) {
    delta.rotate(rotation);
  }
  this.pan(map, delta, this.startCenter);
};


/**
 * @inheritDoc
 */
ol3.interaction.DragPan.prototype.handleDragStart = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (!browserEvent.shiftKey) {
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
