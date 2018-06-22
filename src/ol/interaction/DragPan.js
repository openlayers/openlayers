/**
 * @module ol/interaction/DragPan
 */
import {inherits} from '../util.js';
import ViewHint from '../ViewHint.js';
import {scale as scaleCoordinate, rotate as rotateCoordinate, add as addCoordinate} from '../coordinate.js';
import {easeOut} from '../easing.js';
import {noModifierKeys} from '../events/condition.js';
import {FALSE} from '../functions.js';
import PointerInteraction, {centroid as centroidFromPointers} from '../interaction/Pointer.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/events/condition~Condition} [condition] A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition~noModifierKeys}.
 * @property {module:ol/Kinetic} [kinetic] Kinetic inertia to apply to the pan.
 */


/**
 * @classdesc
 * Allows the user to pan the map by dragging the map.
 *
 * @constructor
 * @extends {module:ol/interaction/Pointer}
 * @param {module:ol/interaction/DragPan~Options=} opt_options Options.
 * @api
 */
const DragPan = function(opt_options) {

  PointerInteraction.call(this, {
    handleDownEvent: handleDownEvent,
    handleDragEvent: handleDragEvent,
    handleUpEvent: handleUpEvent
  });

  const options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {module:ol/Kinetic|undefined}
   */
  this.kinetic_ = options.kinetic;

  /**
   * @type {module:ol~Pixel}
   */
  this.lastCentroid = null;

  /**
   * @type {number}
   */
  this.lastPointersCount_;

  /**
   * @private
   * @type {module:ol/events/condition~Condition}
   */
  this.condition_ = options.condition ? options.condition : noModifierKeys;

  /**
   * @private
   * @type {boolean}
   */
  this.noKinetic_ = false;

};

inherits(DragPan, PointerInteraction);


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {module:ol/interaction/DragPan}
 */
function handleDragEvent(mapBrowserEvent) {
  const targetPointers = this.targetPointers;
  const centroid = centroidFromPointers(targetPointers);
  if (targetPointers.length == this.lastPointersCount_) {
    if (this.kinetic_) {
      this.kinetic_.update(centroid[0], centroid[1]);
    }
    if (this.lastCentroid) {
      const deltaX = this.lastCentroid[0] - centroid[0];
      const deltaY = centroid[1] - this.lastCentroid[1];
      const map = mapBrowserEvent.map;
      const view = map.getView();
      let center = [deltaX, deltaY];
      scaleCoordinate(center, view.getResolution());
      rotateCoordinate(center, view.getRotation());
      addCoordinate(center, view.getCenter());
      center = view.constrainCenter(center);
      view.setCenter(center);
    }
  } else if (this.kinetic_) {
    // reset so we don't overestimate the kinetic energy after
    // after one finger down, tiny drag, second finger down
    this.kinetic_.begin();
  }
  this.lastCentroid = centroid;
  this.lastPointersCount_ = targetPointers.length;
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {module:ol/interaction/DragPan}
 */
function handleUpEvent(mapBrowserEvent) {
  const map = mapBrowserEvent.map;
  const view = map.getView();
  if (this.targetPointers.length === 0) {
    if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
      const distance = this.kinetic_.getDistance();
      const angle = this.kinetic_.getAngle();
      const center = /** @type {!module:ol/coordinate~Coordinate} */ (view.getCenter());
      const centerpx = map.getPixelFromCoordinate(center);
      const dest = map.getCoordinateFromPixel([
        centerpx[0] - distance * Math.cos(angle),
        centerpx[1] - distance * Math.sin(angle)
      ]);
      view.animate({
        center: view.constrainCenter(dest),
        duration: 500,
        easing: easeOut
      });
    }
    view.setHint(ViewHint.INTERACTING, -1);
    return false;
  } else {
    if (this.kinetic_) {
      // reset so we don't overestimate the kinetic energy after
      // after one finger up, tiny drag, second finger up
      this.kinetic_.begin();
    }
    this.lastCentroid = null;
    return true;
  }
}


/**
 * @param {module:ol/MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {module:ol/interaction/DragPan}
 */
function handleDownEvent(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
    const map = mapBrowserEvent.map;
    const view = map.getView();
    this.lastCentroid = null;
    if (!this.handlingDownUpSequence) {
      view.setHint(ViewHint.INTERACTING, 1);
    }
    // stop any current animation
    if (view.getAnimating()) {
      view.setCenter(mapBrowserEvent.frameState.viewState.center);
    }
    if (this.kinetic_) {
      this.kinetic_.begin();
    }
    // No kinetic as soon as more than one pointer on the screen is
    // detected. This is to prevent nasty pans after pinch.
    this.noKinetic_ = this.targetPointers.length > 1;
    return true;
  } else {
    return false;
  }
}


/**
 * @inheritDoc
 */
DragPan.prototype.shouldStopEvent = FALSE;
export default DragPan;
