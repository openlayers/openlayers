/**
 * @module ol/interaction/Pointer
 */
import {FALSE, VOID} from '../functions.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MapBrowserPointerEvent from '../MapBrowserPointerEvent.js';
import Interaction from '../interaction/Interaction.js';
import {getValues} from '../obj.js';


/**
 * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
 * @this {import("./Pointer.js").default}
 */
const handleDragEvent = VOID;


/**
 * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
 * @return {boolean} Capture dragging.
 * @this {import("./Pointer.js").default}
 */
const handleUpEvent = FALSE;


/**
 * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
 * @return {boolean} Capture dragging.
 * @this {import("./Pointer.js").default}
 */
const handleDownEvent = FALSE;


/**
 * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
 * @this {import("./Pointer.js").default}
 */
const handleMoveEvent = VOID;


/**
 * @typedef {Object} Options
 * @property {function(import("../MapBrowserPointerEvent.js").default):boolean} [handleDownEvent]
 * Function handling "down" events. If the function returns `true` then a drag
 * sequence is started.
 * @property {function(import("../MapBrowserPointerEvent.js").default)} [handleDragEvent]
 * Function handling "drag" events. This function is called on "move" events
 * during a drag sequence.
 * @property {function(import("../MapBrowserEvent.js").default):boolean} [handleEvent]
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. The function may return `false` to prevent the
 * propagation of the event to other interactions in the map's interactions
 * chain.
 * @property {function(import("../MapBrowserPointerEvent.js").default)} [handleMoveEvent]
 * Function handling "move" events. This function is called on "move" events,
 * also during a drag sequence (so during a drag sequence both the
 * `handleDragEvent` function and this function are called).
 * @property {function(import("../MapBrowserPointerEvent.js").default):boolean} [handleUpEvent]
 *  Function handling "up" events. If the function returns `false` then the
 * current drag sequence is stopped.
 * @property {function(boolean):boolean} stopDown
 * Should the down event be propagated to other interactions, or should be
 * stopped?
 */


/**
 * @classdesc
 * Base class that calls user-defined functions on `down`, `move` and `up`
 * events. This class also manages "drag sequences".
 *
 * When the `handleDownEvent` user function returns `true` a drag sequence is
 * started. During a drag sequence the `handleDragEvent` user function is
 * called on `move` events. The drag sequence ends when the `handleUpEvent`
 * user function is called and returns `false`.
 * @api
 */
class PointerInteraction extends Interaction {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    super({
      handleEvent: options.handleEvent || handleEvent
    });

    /**
     * @type {function(import("../MapBrowserPointerEvent.js").default):boolean}
     * @private
     */
    this.handleDownEvent_ = options.handleDownEvent ?
      options.handleDownEvent : handleDownEvent;

    /**
     * @type {function(import("../MapBrowserPointerEvent.js").default)}
     * @private
     */
    this.handleDragEvent_ = options.handleDragEvent ?
      options.handleDragEvent : handleDragEvent;

    /**
     * @type {function(import("../MapBrowserPointerEvent.js").default)}
     * @private
     */
    this.handleMoveEvent_ = options.handleMoveEvent ?
      options.handleMoveEvent : handleMoveEvent;

    /**
     * @type {function(import("../MapBrowserPointerEvent.js").default):boolean}
     * @private
     */
    this.handleUpEvent_ = options.handleUpEvent ?
      options.handleUpEvent : handleUpEvent;

    /**
     * @type {boolean}
     * @protected
     */
    this.handlingDownUpSequence = false;

    /**
     * This function is used to determine if "down" events should be propagated
     * to other interactions or should be stopped.
     * @type {function(boolean):boolean}
     * @protected
     */
    this.stopDown = options.stopDown ? options.stopDown : stopDown;

    /**
     * @type {!Object<string, import("../pointer/PointerEvent.js").default>}
     * @private
     */
    this.trackedPointers_ = {};

    /**
     * @type {Array<import("../pointer/PointerEvent.js").default>}
     * @protected
     */
    this.targetPointers = [];

  }

  /**
   * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
   * @private
   */
  updateTrackedPointers_(mapBrowserEvent) {
    if (isPointerDraggingEvent(mapBrowserEvent)) {
      const event = mapBrowserEvent.pointerEvent;

      const id = event.pointerId.toString();
      if (mapBrowserEvent.type == MapBrowserEventType.POINTERUP) {
        delete this.trackedPointers_[id];
      } else if (mapBrowserEvent.type ==
          MapBrowserEventType.POINTERDOWN) {
        this.trackedPointers_[id] = event;
      } else if (id in this.trackedPointers_) {
        // update only when there was a pointerdown event for this pointer
        this.trackedPointers_[id] = event;
      }
      this.targetPointers = getValues(this.trackedPointers_);
    }
  }

}


/**
 * @param {Array<import("../pointer/PointerEvent.js").default>} pointerEvents List of events.
 * @return {import("../pixel.js").Pixel} Centroid pixel.
 */
export function centroid(pointerEvents) {
  const length = pointerEvents.length;
  let clientX = 0;
  let clientY = 0;
  for (let i = 0; i < length; i++) {
    clientX += pointerEvents[i].clientX;
    clientY += pointerEvents[i].clientY;
  }
  return [clientX / length, clientY / length];
}


/**
 * @param {import("../MapBrowserPointerEvent.js").default} mapBrowserEvent Event.
 * @return {boolean} Whether the event is a pointerdown, pointerdrag
 *     or pointerup event.
 */
function isPointerDraggingEvent(mapBrowserEvent) {
  const type = mapBrowserEvent.type;
  return type === MapBrowserEventType.POINTERDOWN ||
    type === MapBrowserEventType.POINTERDRAG ||
    type === MapBrowserEventType.POINTERUP;
}


/**
 * Handles the {@link module:ol/MapBrowserEvent map browser event} and may call into
 * other functions, if event sequences like e.g. 'drag' or 'down-up' etc. are
 * detected.
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {import("./Pointer.js").default}
 * @api
 */
export function handleEvent(mapBrowserEvent) {
  if (!(mapBrowserEvent instanceof MapBrowserPointerEvent)) {
    return true;
  }

  let stopEvent = false;
  this.updateTrackedPointers_(mapBrowserEvent);
  if (this.handlingDownUpSequence) {
    if (mapBrowserEvent.type == MapBrowserEventType.POINTERDRAG) {
      this.handleDragEvent_(mapBrowserEvent);
    } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERUP) {
      const handledUp = this.handleUpEvent_(mapBrowserEvent);
      this.handlingDownUpSequence = handledUp && this.targetPointers.length > 0;
    }
  } else {
    if (mapBrowserEvent.type == MapBrowserEventType.POINTERDOWN) {
      const handled = this.handleDownEvent_(mapBrowserEvent);
      if (handled) {
        mapBrowserEvent.preventDefault();
      }
      this.handlingDownUpSequence = handled;
      stopEvent = this.stopDown(handled);
    } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE) {
      this.handleMoveEvent_(mapBrowserEvent);
    }
  }
  return !stopEvent;
}


export default PointerInteraction;

/**
 * @param {boolean} handled Was the event handled by the interaction?
 * @return {boolean} Should the `down` event be stopped?
 */
function stopDown(handled) {
  return handled;
}
