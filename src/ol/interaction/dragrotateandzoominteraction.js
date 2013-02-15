// FIXME works for View2D only

goog.provide('ol.interaction.DragRotateAndZoom');

goog.require('goog.math.Vec2');
goog.require('ol.View2D');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.ConditionType} condition Condition.
 */
ol.interaction.DragRotateAndZoom = function(condition) {

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = condition;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastMagnitude_;

};
goog.inherits(ol.interaction.DragRotateAndZoom, ol.interaction.Drag);


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handleDrag =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var delta = new goog.math.Vec2(
      browserEvent.offsetX - size.width / 2,
      size.height / 2 - browserEvent.offsetY);
  var theta = Math.atan2(delta.y, delta.x);
  var magnitude = delta.magnitude();
  // FIXME works for View2D only
  var view = map.getView();
  goog.asserts.assert(view instanceof ol.View2D);
  map.requestRenderFrame();
  // FIXME the calls to map.rotate and map.zoomToResolution should use
  // map.withFrozenRendering but an assertion fails :-(
  if (goog.isDef(this.lastAngle_)) {
    var angleDelta = theta - this.lastAngle_;
    view.rotate(map, view.getRotation() - angleDelta);
  }
  this.lastAngle_ = theta;
  if (goog.isDef(this.lastMagnitude_)) {
    var resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    view.zoomToResolution(map, resolution);
  }
  this.lastMagnitude_ = magnitude;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handleDragStart =
    function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  if (this.condition_(browserEvent)) {
    this.lastAngle_ = undefined;
    this.lastMagnitude_ = undefined;
    return true;
  } else {
    return false;
  }
};
