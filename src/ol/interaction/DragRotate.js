/**
 * @module ol/interaction/DragRotate
 */
import {inherits} from '../util.js';
import {disable} from '../rotationconstraint.js';
import ViewHint from '../ViewHint.js';
import {altShiftKeysOnly, mouseOnly, mouseActionButton} from '../events/condition.js';
import {FALSE} from '../functions.js';
import {rotate, rotateWithoutConstraints} from '../interaction/Interaction.js';
import PointerInteraction from '../interaction/Pointer.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/events/condition~Condition} [condition] A function that takes an
 * {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition~altShiftKeysOnly}.
 * @property {number} [duration=250] Animation duration in milliseconds.
 */


/**
 * @classdesc
 * Allows the user to rotate the map by clicking and dragging on the map,
 * normally combined with an {@link module:ol/events/condition} that limits
 * it to when the alt and shift keys are held down.
 *
 * This interaction is only supported for mouse devices.
 *
 * @constructor
 * @extends {module:ol/interaction/Pointer}
 * @param {module:ol/interaction/DragRotate~Options=} opt_options Options.
 * @api
 */
const DragRotate = function(opt_options) {

  const options = opt_options ? opt_options : {};

  PointerInteraction.call(this, {
    handleDownEvent: handleDownEvent,
    handleDragEvent: handleDragEvent,
    handleUpEvent: handleUpEvent
  });

  /**
   * @private
   * @type {module:ol/events/condition~Condition}
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
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {module:ol/interaction/DragRotate}
 */
function handleDragEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return;
  }

  const map = mapBrowserEvent.map;
  const view = map.getView();
  if (view.getConstraints().rotation === disable) {
    return;
  }
  const size = map.getSize();
  const offset = mapBrowserEvent.pixel;
  const theta =
      Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
  if (this.lastAngle_ !== undefined) {
    const delta = theta - this.lastAngle_;
    const rotation = view.getRotation();
    rotateWithoutConstraints(view, rotation - delta);
  }
  this.lastAngle_ = theta;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/DragRotate}
 */
function handleUpEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return true;
  }

  const map = mapBrowserEvent.map;
  const view = map.getView();
  view.setHint(ViewHint.INTERACTING, -1);
  const rotation = view.getRotation();
  rotate(view, rotation, undefined, this.duration_);
  return false;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/DragRotate}
 */
function handleDownEvent(mapBrowserEvent) {
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
}


/**
 * @inheritDoc
 */
DragRotate.prototype.shouldStopEvent = FALSE;
export default DragRotate;
