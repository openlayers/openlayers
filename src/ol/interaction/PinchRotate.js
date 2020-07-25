/**
 * @module ol/interaction/PinchRotate
 */
import PointerInteraction, {
  centroid as centroidFromPointers,
} from './Pointer.js';
import {FALSE} from '../functions.js';
import {disable} from '../rotationconstraint.js';

/**
 * @typedef {Object} Options
 * @property {number} [duration=250] The duration of the animation in
 * milliseconds.
 * @property {number} [threshold=0.3] Minimal angle in radians to start a rotation.
 */

/**
 * @classdesc
 * Allows the user to rotate the map by twisting with two fingers
 * on a touch screen.
 * @api
 */
class PinchRotate extends PointerInteraction {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    const pointerOptions = /** @type {import("./Pointer.js").Options} */ (options);

    if (!pointerOptions.stopDown) {
      pointerOptions.stopDown = FALSE;
    }

    super(pointerOptions);

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate}
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
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   */
  handleDragEvent(mapBrowserEvent) {
    let rotationDelta = 0.0;

    const touch0 = this.targetPointers[0];
    const touch1 = this.targetPointers[1];

    // angle between touches
    const angle = Math.atan2(
      touch1.clientY - touch0.clientY,
      touch1.clientX - touch0.clientX
    );

    if (this.lastAngle_ !== undefined) {
      const delta = angle - this.lastAngle_;
      this.rotationDelta_ += delta;
      if (!this.rotating_ && Math.abs(this.rotationDelta_) > this.threshold_) {
        this.rotating_ = true;
      }
      rotationDelta = delta;
    }
    this.lastAngle_ = angle;

    const map = mapBrowserEvent.map;
    const view = map.getView();
    if (view.getConstraints().rotation === disable) {
      return;
    }

    // rotate anchor point.
    // FIXME: should be the intersection point between the lines:
    //     touch0,touch1 and previousTouch0,previousTouch1
    const viewportPosition = map.getViewport().getBoundingClientRect();
    const centroid = centroidFromPointers(this.targetPointers);
    centroid[0] -= viewportPosition.left;
    centroid[1] -= viewportPosition.top;
    this.anchor_ = map.getCoordinateFromPixelInternal(centroid);

    // rotate
    if (this.rotating_) {
      map.render();
      view.adjustRotationInternal(rotationDelta, this.anchor_);
    }
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleUpEvent(mapBrowserEvent) {
    if (this.targetPointers.length < 2) {
      const map = mapBrowserEvent.map;
      const view = map.getView();
      view.endInteraction(this.duration_);
      return false;
    } else {
      return true;
    }
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleDownEvent(mapBrowserEvent) {
    if (this.targetPointers.length >= 2) {
      const map = mapBrowserEvent.map;
      this.anchor_ = null;
      this.lastAngle_ = undefined;
      this.rotating_ = false;
      this.rotationDelta_ = 0.0;
      if (!this.handlingDownUpSequence) {
        map.getView().beginInteraction();
      }
      return true;
    } else {
      return false;
    }
  }
}

export default PinchRotate;
