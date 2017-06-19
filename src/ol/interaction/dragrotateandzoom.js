goog.provide('ol.interaction.DragRotateAndZoom');

goog.require('ol');
goog.require('ol.RotationConstraint');
goog.require('ol.ViewHint');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Pointer');


/**
 * @classdesc
 * Allows the user to zoom and rotate the map by clicking and dragging
 * on the map.  By default, this interaction is limited to when the shift
 * key is held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * And this interaction is not included in the default interactions.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.DragRotateAndZoomOptions=} opt_options Options.
 * @api
 */
ol.interaction.DragRotateAndZoom = function(opt_options) {

  var options = opt_options ? opt_options : {};

  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.DragRotateAndZoom.handleDownEvent_,
    handleDragEvent: ol.interaction.DragRotateAndZoom.handleDragEvent_,
    handleUpEvent: ol.interaction.DragRotateAndZoom.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : ol.events.condition.shiftKeyOnly;

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

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 400;

};
ol.inherits(ol.interaction.DragRotateAndZoom, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotateAndZoom}
 * @private
 */
ol.interaction.DragRotateAndZoom.handleDragEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return;
  }

  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.pixel;
  var deltaX = offset[0] - size[0] / 2;
  var deltaY = size[1] / 2 - offset[1];
  var theta = Math.atan2(deltaY, deltaX);
  var magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  var view = map.getView();
  if (view.getConstraints().rotation !== ol.RotationConstraint.disable && this.lastAngle_ !== undefined) {
    var angleDelta = theta - this.lastAngle_;
    ol.interaction.Interaction.rotateWithoutConstraints(
        view, view.getRotation() - angleDelta);
  }
  this.lastAngle_ = theta;
  if (this.lastMagnitude_ !== undefined) {
    var resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    ol.interaction.Interaction.zoomWithoutConstraints(view, resolution);
  }
  if (this.lastMagnitude_ !== undefined) {
    this.lastScaleDelta_ = this.lastMagnitude_ / magnitude;
  }
  this.lastMagnitude_ = magnitude;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragRotateAndZoom}
 * @private
 */
ol.interaction.DragRotateAndZoom.handleUpEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ol.ViewHint.INTERACTING, -1);
  var direction = this.lastScaleDelta_ - 1;
  ol.interaction.Interaction.rotate(view, view.getRotation());
  ol.interaction.Interaction.zoom(view, view.getResolution(),
      undefined, this.duration_, direction);
  this.lastScaleDelta_ = 0;
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragRotateAndZoom}
 * @private
 */
ol.interaction.DragRotateAndZoom.handleDownEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (this.condition_(mapBrowserEvent)) {
    mapBrowserEvent.map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    this.lastAngle_ = undefined;
    this.lastMagnitude_ = undefined;
    return true;
  } else {
    return false;
  }
};
