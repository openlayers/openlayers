goog.provide('ol.control.AltDragRotate');

goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.control.AltDragRotate = function(constraints) {
  goog.base(this, constraints);
};
goog.inherits(ol.control.AltDragRotate, ol.control.Drag);


/**
 * @private
 * @type {number}
 */
ol.control.AltDragRotate.prototype.startRotation_;


/**
 * @inheritDoc
 */
ol.control.AltDragRotate.prototype.handleDrag = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var theta = Math.atan2(
      size.height / 2 - browserEvent.offsetY,
      browserEvent.offsetX - size.width / 2);
  this.rotate(map, this.startRotation_, -theta);
};


/**
 * @inheritDoc
 */
ol.control.AltDragRotate.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  if (map.canRotate() && browserEvent.altKey) {
    var size = map.getSize();
    var theta = Math.atan2(
        size.height / 2 - browserEvent.offsetY,
        browserEvent.offsetX - size.width / 2);
    this.startRotation_ = (map.getRotation() || 0) + theta;
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
