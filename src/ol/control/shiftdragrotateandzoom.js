goog.provide('ol.control.ShiftDragRotateAndZoom');

goog.require('goog.math.Vec2');
goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Drag');



/**
 * @constructor
 * @extends {ol.control.Drag}
 */
ol.control.ShiftDragRotateAndZoom = function() {
  goog.base(this);
};
goog.inherits(ol.control.ShiftDragRotateAndZoom, ol.control.Drag);


/**
 * @private
 * @type {number}
 */
ol.control.ShiftDragRotateAndZoom.prototype.startRatio_;


/**
 * @private
 * @type {number}
 */
ol.control.ShiftDragRotateAndZoom.prototype.startRotation_;


/**
 * @inheritDoc
 */
ol.control.ShiftDragRotateAndZoom.prototype.handleDrag =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var resolution = map.getResolution();
  var size = map.getSize();
  var delta = new goog.math.Vec2(
      browserEvent.offsetX - size.width / 2,
      size.height / 2 - browserEvent.offsetY);
  var theta = Math.atan2(delta.y, delta.x);
  // FIXME this should use map.withFrozenRendering but an assertion fails :-(
  map.setRotation(this.startRotation_ - theta);
  map.setResolution(this.startRatio_ * delta.magnitude());
};


/**
 * @inheritDoc
 */
ol.control.ShiftDragRotateAndZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  if (map.canRotate() && browserEvent.shiftKey) {
    var resolution = map.getResolution();
    var size = map.getSize();
    var delta = new goog.math.Vec2(
        browserEvent.offsetX - size.width / 2,
        size.height / 2 - browserEvent.offsetY);
    var theta = Math.atan2(delta.y, delta.x);
    this.startRotation_ = (map.getRotation() || 0) + theta;
    this.startRatio_ = resolution / delta.magnitude();
    browserEvent.preventDefault();
    return true;
  } else {
    return false;
  }
};
