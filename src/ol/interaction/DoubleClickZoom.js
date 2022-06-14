/**
 * @module ol/interaction/DoubleClickZoom
 */
import Interaction, {zoomByDelta} from './Interaction.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import {getValues} from '../obj.js';

/**
 * @typedef {Object} Options
 * @property {number} [duration=250] Animation duration in milliseconds.
 * @property {number} [delta=1] The zoom delta applied on each double click.
 */

/**
 * @classdesc
 * Allows the user to zoom by double-clicking on the map.
 * @api
 */
class DoubleClickZoom extends Interaction {
  /**
   * @param {Options} [opt_options] Options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    super(
      /** @type {import("./Interaction.js").InteractionOptions} */ (options)
    );

    /**
     * @private
     * @type {number}
     */
    this.delta_ = options.delta ? options.delta : 1;

    /**
     * @private
     * @type {number}
     */
    this.duration_ = options.duration !== undefined ? options.duration : 250;

    /**
     * @type {boolean}
     * @private
     */
    this.handlingDownUpSequence_ = false;

    /**
     * @type {!Object<string, PointerEvent>}
     * @private
     */
    this.trackedPointers_ = {};

    /**
     * @type {Array<PointerEvent>}
     * @protected
     */
    this.targetPointers = [];
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} (if it was a
   * doubleclick) and eventually zooms the map.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   */
  handleEvent(mapBrowserEvent) {
    let stopEvent = false;
    this.updateTrackedPointers_(mapBrowserEvent);

    if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK) {
      const browserEvent = /** @type {MouseEvent} */ (
        mapBrowserEvent.originalEvent
      );
      const map = mapBrowserEvent.map;
      const anchor = mapBrowserEvent.coordinate;
      const delta = browserEvent.shiftKey ? -this.delta_ : this.delta_;
      const view = map.getView();
      zoomByDelta(view, delta, anchor, this.duration_);
      browserEvent.preventDefault();
      stopEvent = true;
      return !stopEvent;
    }

    if (
      mapBrowserEvent.type === MapBrowserEventType.POINTERDRAG ||
      mapBrowserEvent.type === MapBrowserEventType.POINTERMOVE
    ) {
      // If the user drag the map we abort this interaction.
      this.handlingDownUpSequence_ = false;
      stopEvent = false;
      return !stopEvent;
    }

    if (
      this.targetPointers.length === 2 &&
      mapBrowserEvent.type === MapBrowserEventType.POINTERDOWN
    ) {
      this.handlingDownUpSequence_ = true;
      stopEvent = this.stopDown(true);
    } else if (
      this.handlingDownUpSequence_ &&
      mapBrowserEvent.type === MapBrowserEventType.POINTERUP
    ) {
      const handledUp = this.handleUpEvent(mapBrowserEvent);
      this.handlingDownUpSequence_ = false;
      stopEvent = handledUp;
    }
    return !stopEvent;
  }

  /**
   * Handle pointer up events zooming out.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @return {boolean} If the event was consumed.
   */
  handleUpEvent(mapBrowserEvent) {
    const browserEvent = /** @type {MouseEvent} */ (
      mapBrowserEvent.originalEvent
    );
    const {map} = mapBrowserEvent;
    const anchor = mapBrowserEvent.coordinate;
    const delta = browserEvent.shiftKey ? this.delta_ : -this.delta_;
    const view = map.getView();
    zoomByDelta(view, delta, anchor, this.duration_);
    browserEvent.preventDefault();
    return true;
  }

  /**
   * This function is used to determine if "down" events should be propagated
   * to other interactions or should be stopped.
   * @param {boolean} handled Was the event handled by the interaction?
   * @return {boolean} Should the `down` event be stopped?
   */
  stopDown(handled) {
    return handled;
  }

  /**
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
   * @private
   */
  updateTrackedPointers_(mapBrowserEvent) {
    const event = mapBrowserEvent.originalEvent;

    // On some other event, pointerId can be empty.
    if (
      mapBrowserEvent.type === MapBrowserEventType.POINTERUP ||
      mapBrowserEvent.type === MapBrowserEventType.POINTERDOWN
    ) {
      const id = event.pointerId.toString();
      if (mapBrowserEvent.type === MapBrowserEventType.POINTERUP) {
        delete this.trackedPointers_[id];
      } else if (mapBrowserEvent.type === MapBrowserEventType.POINTERDOWN) {
        this.trackedPointers_[id] = event;
      } else if (id in this.trackedPointers_) {
        // update only when there was a pointerdown event for this pointer
        this.trackedPointers_[id] = event;
      }
      this.targetPointers = getValues(this.trackedPointers_);
    }
  }
}

export default DoubleClickZoom;
