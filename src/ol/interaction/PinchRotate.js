/**
 * @module ol/interaction/PinchRotate
 */
import {inherits} from '../index.js';
import ViewHint from '../ViewHint.js';
import {FALSE} from '../functions.js';
import Interaction from '../interaction/Interaction.js';
import PointerInteraction from '../interaction/Pointer.js';
import RotationConstraint from '../RotationConstraint.js';

/**
 * @classdesc
 * Allows the user to rotate the map by twisting with two fingers
 * on a touch screen.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.PinchRotateOptions=} opt_options Options.
 * @api
 */
const PinchRotate = function(opt_options) {

  PointerInteraction.call(this, {
    handleDownEvent: PinchRotate.handleDownEvent_,
    handleDragEvent: PinchRotate.handleDragEvent_,
    handleUpEvent: PinchRotate.handleUpEvent_
  });

  const options = opt_options || {};

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastAngle_ = undefined;

  /**
   * @private
   * @type {boolean}
   */
  this.rotating_ = false;

  /**
   * @private
   * @type {number}
   */
  this.rotationDelta_ = 0.0;

  /**
   * @private
   * @type {number}
   */
  this.threshold_ = options.threshold !== undefined ? options.threshold : 0.3;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

};

inherits(PinchRotate, PointerInteraction);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.PinchRotate}
 * @private
 */
PinchRotate.handleDragEvent_ = function(mapBrowserEvent) {
  let rotationDelta = 0.0;

  const touch0 = this.targetPointers[0];
  const touch1 = this.targetPointers[1];

  // angle between touches
  const angle = Math.atan2(
    touch1.clientY - touch0.clientY,
    touch1.clientX - touch0.clientX);

  if (this.lastAngle_ !== undefined) {
    const delta = angle - this.lastAngle_;
    this.rotationDelta_ += delta;
    if (!this.rotating_ &&
        Math.abs(this.rotationDelta_) > this.threshold_) {
      this.rotating_ = true;
    }
    rotationDelta = delta;
  }
  this.lastAngle_ = angle;

  const map = mapBrowserEvent.map;
  const view = map.getView();
  if (view.getConstraints().rotation === RotationConstraint.disable) {
    return;
  }

  // rotate anchor point.
  // FIXME: should be the intersection point between the lines:
  //     touch0,touch1 and previousTouch0,previousTouch1
  const viewportPosition = map.getViewport().getBoundingClientRect();
  const centroid = PointerInteraction.centroid(this.targetPointers);
  centroid[0] -= viewportPosition.left;
  centroid[1] -= viewportPosition.top;
  this.anchor_ = map.getCoordinateFromPixel(centroid);

  // rotate
  if (this.rotating_) {
    const rotation = view.getRotation();
    map.render();
    Interaction.rotateWithoutConstraints(view,
      rotation + rotationDelta, this.anchor_);
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.PinchRotate}
 * @private
 */
PinchRotate.handleUpEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length < 2) {
    const map = mapBrowserEvent.map;
    const view = map.getView();
    view.setHint(ViewHint.INTERACTING, -1);
    if (this.rotating_) {
      const rotation = view.getRotation();
      Interaction.rotate(
        view, rotation, this.anchor_, this.duration_);
    }
    return false;
  } else {
    return true;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.PinchRotate}
 * @private
 */
PinchRotate.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length >= 2) {
    const map = mapBrowserEvent.map;
    this.anchor_ = null;
    this.lastAngle_ = undefined;
    this.rotating_ = false;
    this.rotationDelta_ = 0.0;
    if (!this.handlingDownUpSequence) {
      map.getView().setHint(ViewHint.INTERACTING, 1);
    }
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
PinchRotate.prototype.shouldStopEvent = FALSE;
export default PinchRotate;
