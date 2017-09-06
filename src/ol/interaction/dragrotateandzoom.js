import _ol_ from '../index';
import _ol_RotationConstraint_ from '../rotationconstraint';
import _ol_ViewHint_ from '../viewhint';
import _ol_events_condition_ from '../events/condition';
import _ol_interaction_Interaction_ from '../interaction/interaction';
import _ol_interaction_Pointer_ from '../interaction/pointer';

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
var _ol_interaction_DragRotateAndZoom_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_DragRotateAndZoom_.handleDownEvent_,
    handleDragEvent: _ol_interaction_DragRotateAndZoom_.handleDragEvent_,
    handleUpEvent: _ol_interaction_DragRotateAndZoom_.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : _ol_events_condition_.shiftKeyOnly;

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

_ol_.inherits(_ol_interaction_DragRotateAndZoom_, _ol_interaction_Pointer_);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotateAndZoom}
 * @private
 */
_ol_interaction_DragRotateAndZoom_.handleDragEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
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
  if (view.getConstraints().rotation !== _ol_RotationConstraint_.disable && this.lastAngle_ !== undefined) {
    var angleDelta = theta - this.lastAngle_;
    _ol_interaction_Interaction_.rotateWithoutConstraints(
        view, view.getRotation() - angleDelta);
  }
  this.lastAngle_ = theta;
  if (this.lastMagnitude_ !== undefined) {
    var resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    _ol_interaction_Interaction_.zoomWithoutConstraints(view, resolution);
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
_ol_interaction_DragRotateAndZoom_.handleUpEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(_ol_ViewHint_.INTERACTING, -1);
  var direction = this.lastScaleDelta_ - 1;
  _ol_interaction_Interaction_.rotate(view, view.getRotation());
  _ol_interaction_Interaction_.zoom(view, view.getResolution(),
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
_ol_interaction_DragRotateAndZoom_.handleDownEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (this.condition_(mapBrowserEvent)) {
    mapBrowserEvent.map.getView().setHint(_ol_ViewHint_.INTERACTING, 1);
    this.lastAngle_ = undefined;
    this.lastMagnitude_ = undefined;
    return true;
  } else {
    return false;
  }
};
export default _ol_interaction_DragRotateAndZoom_;
