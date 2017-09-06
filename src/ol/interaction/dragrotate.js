import _ol_ from '../index';
import _ol_RotationConstraint_ from '../rotationconstraint';
import _ol_ViewHint_ from '../viewhint';
import _ol_events_condition_ from '../events/condition';
import _ol_functions_ from '../functions';
import _ol_interaction_Interaction_ from '../interaction/interaction';
import _ol_interaction_Pointer_ from '../interaction/pointer';

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
 * @api
 */
var _ol_interaction_DragRotate_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_DragRotate_.handleDownEvent_,
    handleDragEvent: _ol_interaction_DragRotate_.handleDragEvent_,
    handleUpEvent: _ol_interaction_DragRotate_.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : _ol_events_condition_.altShiftKeysOnly;

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

_ol_.inherits(_ol_interaction_DragRotate_, _ol_interaction_Pointer_);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotate}
 * @private
 */
_ol_interaction_DragRotate_.handleDragEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (view.getConstraints().rotation === _ol_RotationConstraint_.disable) {
    return;
  }
  var size = map.getSize();
  var offset = mapBrowserEvent.pixel;
  var theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (this.lastAngle_ !== undefined) {
    var delta = theta - this.lastAngle_;
    var rotation = view.getRotation();
    _ol_interaction_Interaction_.rotateWithoutConstraints(
        view, rotation - delta);
  }
  this.lastAngle_ = theta;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragRotate}
 * @private
 */
_ol_interaction_DragRotate_.handleUpEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(_ol_ViewHint_.INTERACTING, -1);
  var rotation = view.getRotation();
  _ol_interaction_Interaction_.rotate(view, rotation,
      undefined, this.duration_);
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragRotate}
 * @private
 */
_ol_interaction_DragRotate_.handleDownEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (_ol_events_condition_.mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    map.getView().setHint(_ol_ViewHint_.INTERACTING, 1);
    this.lastAngle_ = undefined;
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_DragRotate_.prototype.shouldStopEvent = _ol_functions_.FALSE;
export default _ol_interaction_DragRotate_;
