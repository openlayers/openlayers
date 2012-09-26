goog.provide('ol.interaction.ShiftDragRotateAndZoom');

goog.require('goog.math.Vec2');
goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.ShiftDragRotateAndZoom = function(constraints) {

  goog.base(this, constraints);

  /**
   * @private
   * @type {number}
   */
  this.startRatio_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.startRotation_ = 0;

};
goog.inherits(ol.interaction.ShiftDragRotateAndZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.ShiftDragRotateAndZoom.prototype.handleDrag =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var delta = new goog.math.Vec2(
      browserEvent.offsetX - size.width / 2,
      size.height / 2 - browserEvent.offsetY);
  var theta = Math.atan2(delta.y, delta.x);
  // FIXME this should use map.withFrozenRendering but an assertion fails :-(
  this.rotate(map, this.startRotation_, -theta);
  var resolution = this.startRatio_ * delta.magnitude();
  this.setResolution(map, resolution);
};


/**
 * @inheritDoc
 */
ol.interaction.ShiftDragRotateAndZoom.prototype.handleDragStart =
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
    return true;
  } else {
    return false;
  }
};
