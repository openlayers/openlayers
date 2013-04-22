// FIXME works for View2D only

goog.provide('ol.interaction.DragRotateAndZoom');

goog.require('goog.asserts');
goog.require('goog.math.Vec2');
goog.require('ol.interaction.ConditionType');
goog.require('ol.interaction.Drag');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.condition');


/**
 * @define {number} Animation duration.
 */
ol.interaction.DRAGROTATEANDZOOM_ANIMATION_DURATION = 400;



/**
 * @constructor
 * @extends {ol.interaction.Drag}
 * @param {ol.interaction.DragRotateAndZoomOptions=} opt_options Options.
 */
ol.interaction.DragRotateAndZoom = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {ol.interaction.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ?
      options.condition : ol.interaction.condition.shiftKeyOnly;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastMagnitude_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.lastScaleDelta_ = 0;

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
  var view = map.getView().getView2D();
  map.requestRenderFrame();
  if (goog.isDef(this.lastAngle_)) {
    var angleDelta = theta - this.lastAngle_;
    ol.interaction.Interaction.rotateWithoutConstraints(
        map, view, view.getRotation() - angleDelta);
  }
  this.lastAngle_ = theta;
  if (goog.isDef(this.lastMagnitude_)) {
    var resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    ol.interaction.Interaction.zoomWithoutConstraints(map, view, resolution);
  }
  if (goog.isDef(this.lastMagnitude_)) {
    this.lastScaleDelta_ = this.lastMagnitude_ / magnitude;
  }
  this.lastMagnitude_ = magnitude;
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotateAndZoom.prototype.handleDragEnd =
    function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView().getView2D();
  var direction = this.lastScaleDelta_ - 1;
  map.withFrozenRendering(function() {
    ol.interaction.Interaction.rotate(map, view, view.getRotation());
    ol.interaction.Interaction.zoom(map, view, view.getResolution(), undefined,
        ol.interaction.DRAGROTATEANDZOOM_ANIMATION_DURATION, direction);
  });
  this.lastScaleDelta_ = 0;
  return true;
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
