goog.provide('ol.interaction.DragRotate');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.events.condition');
goog.require('ol.functions');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.Pointer');


/**
 * @classdesc
 * Allows the user to rotate the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when the alt and shift keys are held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.DragRotateOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragRotate = function(opt_options) {

  var options = opt_options ? opt_options : {};

  ol.interaction.Pointer.call(this, {
    handleDownEvent: ol.interaction.DragRotate.handleDownEvent_,
    handleDragEvent: ol.interaction.DragRotate.handleDragEvent_,
    handleUpEvent: ol.interaction.DragRotate.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
      options.condition : ol.events.condition.altShiftKeysOnly;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;
};
ol.inherits(ol.interaction.DragRotate, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotate}
 * @private
 */
ol.interaction.DragRotate.handleDragEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return;
  }

  var map = mapBrowserEvent.map;
  var size = map.getSize();
  var offset = mapBrowserEvent.pixel;
  var theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (this.lastAngle_ !== undefined) {
    var delta = theta - this.lastAngle_;
    var view = map.getView();
    var rotation = view.getRotation();
    ol.interaction.Interaction.rotateWithoutConstraints(
        map, view, rotation - delta);
  }
  this.lastAngle_ = theta;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragRotate}
 * @private
 */
ol.interaction.DragRotate.handleUpEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ol.View.Hint.INTERACTING, -1);
  var rotation = view.getRotation();
  ol.interaction.Interaction.rotate(map, view, rotation,
      undefined, this.duration_);
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragRotate}
 * @private
 */
ol.interaction.DragRotate.handleDownEvent_ = function(mapBrowserEvent) {
  if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (ol.events.condition.mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    map.getView().setHint(ol.View.Hint.INTERACTING, 1);
    this.lastAngle_ = undefined;
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
ol.interaction.DragRotate.prototype.shouldStopEvent = ol.functions.FALSE;
