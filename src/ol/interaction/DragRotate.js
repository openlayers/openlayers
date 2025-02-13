/**
 * @module ol/interaction/DragRotate
 */
import {
  altShiftKeysOnly,
  mouseActionButton,
  mouseOnly,
} from '../events/condition.js';
import {FALSE} from '../functions.js';
import {disable} from '../rotationconstraint.js';
import PointerInteraction from './Pointer.js';

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [condition] A function that takes a
 * {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link module:ol/events/condition.altShiftKeysOnly}.
 * @property {number} [duration=250] Animation duration in milliseconds.
 */

/**
 * @classdesc
 * Allows the user to rotate the map by clicking and dragging on the map,
 * normally combined with a {@link module:ol/events/condition} that limits
 * it to when the alt and shift keys are held down.
 *
 * This interaction is only supported for mouse devices.
 * @api
 */
class DragRotate extends PointerInteraction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {};

    super({
      stopDown: FALSE,
    });

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
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
  }

  /**
   * Handle pointer drag events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @override
   */
  handleDragEvent(mapBrowserEvent) {
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
    const theta = Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
    if (this.lastAngle_ !== undefined) {
      const delta = theta - this.lastAngle_;
      view.adjustRotationInternal(-delta);
    }
    this.lastAngle_ = theta;
  }

  /**
   * Handle pointer up events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleUpEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return true;
    }

    const map = mapBrowserEvent.map;
    const view = map.getView();
    view.endInteraction(this.duration_);
    return false;
  }

  /**
   * Handle pointer down events.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   * @override
   */
  handleDownEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return false;
    }

    if (
      mouseActionButton(mapBrowserEvent) &&
      this.condition_(mapBrowserEvent)
    ) {
      const map = mapBrowserEvent.map;
      map.getView().beginInteraction();
      this.lastAngle_ = undefined;
      return true;
    }
    return false;
  }
}

export default DragRotate;
