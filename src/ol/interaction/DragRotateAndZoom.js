/**
 * @module ol/interaction/DragRotateAndZoom
 */
import {inherits} from '../util.js';
import {disable} from '../rotationconstraint.js';
import ViewHint from '../ViewHint.js';
import {shiftKeyOnly, mouseOnly} from '../events/condition.js';
import {rotate, rotateWithoutConstraints, zoom, zoomWithoutConstraints} from '../interaction/Interaction.js';
import PointerInteraction from '../interaction/Pointer.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/events/condition~Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition~shiftKeyOnly}.
 * @property {number} [duration=400] Animation duration in milliseconds.
 */


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
 * @extends {module:ol/interaction/Pointer}
 * @param {module:ol/interaction/DragRotateAndZoom~Options=} opt_options Options.
 * @api
 */
const DragRotateAndZoom = function(opt_options) {

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
  this.condition_ = options.condition ? options.condition : shiftKeyOnly;

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

inherits(DragRotateAndZoom, PointerInteraction);


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {module:ol/interaction/DragRotateAndZoom}
 */
function handleDragEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return;
  }

  const map = mapBrowserEvent.map;
  const size = map.getSize();
  const offset = mapBrowserEvent.pixel;
  const deltaX = offset[0] - size[0] / 2;
  const deltaY = size[1] / 2 - offset[1];
  const theta = Math.atan2(deltaY, deltaX);
  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const view = map.getView();
  if (view.getConstraints().rotation !== disable && this.lastAngle_ !== undefined) {
    const angleDelta = theta - this.lastAngle_;
    rotateWithoutConstraints(view, view.getRotation() - angleDelta);
  }
  this.lastAngle_ = theta;
  if (this.lastMagnitude_ !== undefined) {
    const resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    zoomWithoutConstraints(view, resolution);
  }
  if (this.lastMagnitude_ !== undefined) {
    this.lastScaleDelta_ = this.lastMagnitude_ / magnitude;
  }
  this.lastMagnitude_ = magnitude;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/DragRotateAndZoom}
 */
function handleUpEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return true;
  }

  const map = mapBrowserEvent.map;
  const view = map.getView();
  view.setHint(ViewHint.INTERACTING, -1);
  const direction = this.lastScaleDelta_ - 1;
  rotate(view, view.getRotation());
  zoom(view, view.getResolution(), undefined, this.duration_, direction);
  this.lastScaleDelta_ = 0;
  return false;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/DragRotateAndZoom}
 */
function handleDownEvent(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return false;
  }

  if (this.condition_(mapBrowserEvent)) {
    mapBrowserEvent.map.getView().setHint(ViewHint.INTERACTING, 1);
    this.lastAngle_ = undefined;
    this.lastMagnitude_ = undefined;
    return true;
  } else {
    return false;
  }
}

export default DragRotateAndZoom;
