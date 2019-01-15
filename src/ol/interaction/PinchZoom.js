/**
 * @module ol/interaction/PinchZoom
 */
import {FALSE} from '../functions.js';
import PointerInteraction, {centroid as centroidFromPointers} from './Pointer.js';


/**
 * @typedef {Object} Options
 * @property {number} [duration=400] Animation duration in milliseconds.
 */


/**
 * @classdesc
 * Allows the user to zoom the map by pinching with two fingers
 * on a touch screen.
 * @api
 */
class PinchZoom extends PointerInteraction {
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
     * @type {number}
     */
    this.duration_ = options.duration !== undefined ? options.duration : 400;

    /**
     * @private
     * @type {number|undefined}
     */
    this.lastDistance_ = undefined;

    /**
     * @private
     * @type {number}
     */
    this.lastScaleDelta_ = 1;

  }

  /**
   * @inheritDoc
   */
  handleDragEvent(mapBrowserEvent) {
    let scaleDelta = 1.0;

    const touch0 = this.targetPointers[0];
    const touch1 = this.targetPointers[1];
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;

    // distance between touches
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.lastDistance_ !== undefined) {
      scaleDelta = this.lastDistance_ / distance;
    }
    this.lastDistance_ = distance;


    const map = mapBrowserEvent.map;
    const view = map.getView();

    if (scaleDelta != 1.0) {
      this.lastScaleDelta_ = scaleDelta;
    }

    // scale anchor point.
    const viewportPosition = map.getViewport().getBoundingClientRect();
    const centroid = centroidFromPointers(this.targetPointers);
    centroid[0] -= viewportPosition.left;
    centroid[1] -= viewportPosition.top;
    this.anchor_ = map.getCoordinateFromPixel(centroid);

    // scale, bypass the resolution constraint
    map.render();
    view.adjustResolution(scaleDelta, this.anchor_);
  }

  /**
   * @inheritDoc
   */
  handleUpEvent(mapBrowserEvent) {
    if (this.targetPointers.length < 2) {
      const map = mapBrowserEvent.map;
      const view = map.getView();
      const direction = this.lastScaleDelta_ > 1 ? 1 : -1;
      view.endInteraction(this.duration_, direction);
      return false;
    } else {
      return true;
    }
  }

  /**
   * @inheritDoc
   */
  handleDownEvent(mapBrowserEvent) {
    if (this.targetPointers.length >= 2) {
      const map = mapBrowserEvent.map;
      this.anchor_ = null;
      this.lastDistance_ = undefined;
      this.lastScaleDelta_ = 1;
      if (!this.handlingDownUpSequence) {
        map.getView().beginInteraction();
      }
      return true;
    } else {
      return false;
    }
  }
}

export default PinchZoom;
