/**
 * @module ol/interaction/DragRotateAndZoom
 */
import {inherits} from '../index.js';
import RotationConstraint from '../RotationConstraint.js';
import ViewHint from '../ViewHint.js';
import {shiftKeyOnly, mouseOnly} from '../events/condition.js';
import Interaction from '../interaction/Interaction.js';
import PointerInteraction from '../interaction/Pointer.js';

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
const DragRotateAndZoom = function(opt_options) {

  const options = opt_options ? opt_options : {};

  PointerInteraction.call(this, {
    handleDownEvent: DragRotateAndZoom.handleDownEvent_,
    handleDragEvent: DragRotateAndZoom.handleDragEvent_,
    handleUpEvent: DragRotateAndZoom.handleUpEvent_
  });

  /**
   * @private
   * @type {ol.EventsConditionType}
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
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragRotateAndZoom}
 * @private
 */
DragRotateAndZoom.handleDragEvent_ = function(mapBrowserEvent) {
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
  if (view.getConstraints().rotation !== RotationConstraint.disable && this.lastAngle_ !== undefined) {
    const angleDelta = theta - this.lastAngle_;
    Interaction.rotateWithoutConstraints(
      view, view.getRotation() - angleDelta);
  }
  this.lastAngle_ = theta;
  if (this.lastMagnitude_ !== undefined) {
    const resolution = this.lastMagnitude_ * (view.getResolution() / magnitude);
    Interaction.zoomWithoutConstraints(view, resolution);
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
DragRotateAndZoom.handleUpEvent_ = function(mapBrowserEvent) {
  if (!mouseOnly(mapBrowserEvent)) {
    return true;
  }

  const map = mapBrowserEvent.map;
  const view = map.getView();
  view.setHint(ViewHint.INTERACTING, -1);
  const direction = this.lastScaleDelta_ - 1;
  Interaction.rotate(view, view.getRotation());
  Interaction.zoom(view, view.getResolution(),
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
DragRotateAndZoom.handleDownEvent_ = function(mapBrowserEvent) {
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
};
export default DragRotateAndZoom;
