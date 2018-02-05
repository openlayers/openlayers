/**
 * @module ol/interaction/DragRotate
 */
import {inherits} from '../index.js';
import RotationConstraint from '../RotationConstraint.js';
import ViewHint from '../ViewHint.js';
import {altShiftKeysOnly, mouseOnly, mouseActionButton} from '../events/condition.js';
import {FALSE} from '../functions.js';
import Interaction from '../interaction/Interaction.js';
import PointerInteraction from '../interaction/Pointer.js';

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
const DragRotate = function(opt_options) {

  const options = opt_options ? opt_options : {};

  PointerInteraction.call(this, {
    handleDownEvent: DragRotate.handleDownEvent_,
    handleDragEvent: DragRotate.handleDragEvent_,
    handleUpEvent: DragRotate.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ? options.condition : altShiftKeysOnly;

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

inherits(DragRotate, PointerInteraction);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotate}
 * @private
 */
DragRotate.handleDragEvent_ = function(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return;
  }

  const map = mapBrowserEvent.map;
  const view = map.getView();
  if (view.getConstraints().rotation === RotationConstraint.disable) {
    return;
  }
  const size = map.getSize();
  const offset = mapBrowserEvent.pixel;
  const theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (this.lastAngle_ !== undefined) {
    const delta = theta - this.lastAngle_;
    const rotation = view.getRotation();
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
  if (!mouseOnly(mapBrowserEvent)) {
    return true;
  }

  const map = mapBrowserEvent.map;
  const view = map.getView();
  view.setHint(ViewHint.INTERACTING, -1);
  const rotation = view.getRotation();
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
  if (!mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (mouseActionButton(mapBrowserEvent) && this.condition_(mapBrowserEvent)) {
    const map = mapBrowserEvent.map;
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
