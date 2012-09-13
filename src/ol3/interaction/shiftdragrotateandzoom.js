goog.provide('ol3.interaction.ShiftDragRotateAndZoom');

goog.require('goog.math.Vec2');
goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Constraints');
goog.require('ol3.interaction.Drag');



/**
 * @constructor
 * @extends {ol3.interaction.Drag}
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.interaction.ShiftDragRotateAndZoom = function(constraints) {

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
goog.inherits(ol3.interaction.ShiftDragRotateAndZoom, ol3.interaction.Drag);


/**
 * @inheritDoc
 */
ol3.interaction.ShiftDragRotateAndZoom.prototype.handleDrag =
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
ol3.interaction.ShiftDragRotateAndZoom.prototype.handleDragStart =
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
