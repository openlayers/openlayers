goog.provide('ol.control.ShiftDragRotate');

goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 */
ol.control.ShiftDragRotate = function() {
  goog.base(this);
};
goog.inherits(ol.control.ShiftDragRotate, ol.control.Drag);


/**
 * @private
 * @type {number}
 */
ol.control.ShiftDragRotate.prototype.startRotation_;


/**
 * @inheritDoc
 */
ol.control.ShiftDragRotate.prototype.handleDrag = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var theta = Math.atan2(
      size.height / 2 - browserEvent.offsetY,
      browserEvent.offsetX - size.width / 2);
  map.setRotation(this.startRotation_ - theta);
};


/**
 * @inheritDoc
 */
ol.control.ShiftDragRotate.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  if (map.canRotate() && browserEvent.shiftKey) {
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
