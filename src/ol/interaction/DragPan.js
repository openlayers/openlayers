/**
 * @module ol/interaction/DragPan
 */
import PointerInteraction, {
  centroid as centroidFromPointers,
} from './Pointer.js';
import {FALSE} from '../functions.js';
import {
  all,
  focusWithTabindex,
  noModifierKeys,
  primaryAction,
} from '../events/condition.js';
import {easeOut} from '../easing.js';
import {
  rotate as rotateCoordinate,
  scale as scaleCoordinate,
} from '../coordinate.js';

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition.noModifierKeys} and {@link module:ol/events/condition.primaryAction}.
 * @property {boolean} [onFocusOnly=false] When the map's target has a `tabindex` attribute set,
 * the interaction will only handle events when the map has the focus.
 * @property {import("../Kinetic.js").default} [kinetic] Kinetic inertia to apply to the pan.
 */

/**
 * @classdesc
 * Allows the user to pan the map by dragging the map.
 * @api
 */
class DragPan extends PointerInteraction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super({
      stopDown: FALSE,
    });

    options = options ? options : {};

    /**
     * @private
     * @type {import("../Kinetic.js").default|undefined}
     */
    this.kinetic_ = options.kinetic;

    /**
     * @type {import("../pixel.js").Pixel}
     */
    this.lastCentroid = null;

    /**
     * @type {number}
     */
    this.lastPointersCount_;

    /**
     * @type {boolean}
     */
    this.panning_ = false;

    const condition = options.condition
      ? options.condition
      : all(noModifierKeys, primaryAction);

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.onFocusOnly
      ? all(focusWithTabindex, condition)
      : condition;

    /**
     * @private
     * @type {boolean}
     */
    this.noKinetic_ = false;
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   */
  handleDragEvent(mapBrowserEvent) {
    if (!this.panning_) {
      this.panning_ = true;
      this.getMap().getView().beginInteraction();
    }
    const targetPointers = this.targetPointers;
    const centroid = centroidFromPointers(targetPointers);
    if (targetPointers.length == this.lastPointersCount_) {
      if (this.kinetic_) {
        this.kinetic_.update(centroid[0], centroid[1]);
      }
      if (this.lastCentroid) {
        const delta = [
          this.lastCentroid[0] - centroid[0],
          centroid[1] - this.lastCentroid[1],
        ];
        const map = mapBrowserEvent.map;
        const view = map.getView();
        scaleCoordinate(delta, view.getResolution());
        rotateCoordinate(delta, view.getRotation());
        view.adjustCenterInternal(delta);
      }
    } else if (this.kinetic_) {
      // reset so we don't overestimate the kinetic energy after
      // after one finger down, tiny drag, second finger down
      this.kinetic_.begin();
    }
    this.lastCentroid = centroid;
    this.lastPointersCount_ = targetPointers.length;
    mapBrowserEvent.originalEvent.preventDefault();
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleUpEvent(mapBrowserEvent) {
    const map = mapBrowserEvent.map;
    const view = map.getView();
    if (this.targetPointers.length === 0) {
      if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
        const distance = this.kinetic_.getDistance();
        const angle = this.kinetic_.getAngle();
        const center = view.getCenterInternal();
        const centerpx = map.getPixelFromCoordinateInternal(center);
        const dest = map.getCoordinateFromPixelInternal([
          centerpx[0] - distance * Math.cos(angle),
          centerpx[1] - distance * Math.sin(angle),
        ]);
        view.animateInternal({
          center: view.getConstrainedCenter(dest),
          duration: 500,
          easing: easeOut,
        });
      }
      if (this.panning_) {
        this.panning_ = false;
        view.endInteraction();
      }
      return false;
    }
    if (this.kinetic_) {
      // reset so we don't overestimate the kinetic energy after
      // after one finger up, tiny drag, second finger up
      this.kinetic_.begin();
    }
    this.lastCentroid = null;
    return true;
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleDownEvent(mapBrowserEvent) {
    if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
      const map = mapBrowserEvent.map;
      const view = map.getView();
      this.lastCentroid = null;
      // stop any current animation
      if (view.getAnimating()) {
        view.cancelAnimations();
      }
      if (this.kinetic_) {
        this.kinetic_.begin();
      }
      // No kinetic as soon as more than one pointer on the screen is
      // detected. This is to prevent nasty pans after pinch.
      this.noKinetic_ = this.targetPointers.length > 1;
      return true;
    }
    return false;
  }
}

export default DragPan;
