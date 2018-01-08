/**
 * @module ol/interaction/DragRotate
 */
import {inherits} from '../index.js';
import RotationConstraint from '../RotationConstraint.js';
import ViewHint from '../ViewHint.js';
import _ol_events_condition_ from '../events/condition.js';
import {FALSE} from '../functions.js';
import Interaction from '../interaction/Interaction.js';
import _ol_interaction_Pointer_ from '../interaction/Pointer.js';

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
var DragRotate = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: DragRotate.handleDownEvent_,
    handleDragEvent: DragRotate.handleDragEvent_,
    handleUpEvent: DragRotate.handleUpEvent_
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

inherits(DragRotate, _ol_interaction_Pointer_);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotate}
 * @private
 */
DragRotate.handleDragEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (view.getConstraints().rotation === RotationConstraint.disable) {
    return;
  }
  var size = map.getSize();
  var offset = mapBrowserEvent.pixel;
  var theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (this.lastAngle_ !== undefined) {
    var delta = theta - this.lastAngle_;
    var rotation = view.getRotation();
    Interaction.rotateWithoutConstraints(
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
DragRotate.handleUpEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return true;
  }

  var map = mapBrowserEvent.map;
  var view = map.getView();
  view.setHint(ViewHint.INTERACTING, -1);
  var rotation = view.getRotation();
  Interaction.rotate(view, rotation,
      undefined, this.duration_);
  return false;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragRotate}
 * @private
 */
DragRotate.handleDownEvent_ = function(mapBrowserEvent) {
  if (!_ol_events_condition_.mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (_ol_events_condition_.mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    map.getView().setHint(ViewHint.INTERACTING, 1);
    this.lastAngle_ = undefined;
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
DragRotate.prototype.shouldStopEvent = FALSE;
export default DragRotate;
