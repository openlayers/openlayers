/**
 * @module ol/interaction/Pointer
 */
import {inherits, nullFunction} from '../index.js';
import {FALSE} from '../functions.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import MapBrowserPointerEvent from '../MapBrowserPointerEvent.js';
import Interaction from '../interaction/Interaction.js';
import {getValues} from '../obj.js';

/**
 * @classdesc
 * Base class that calls user-defined functions on `down`, `move` and `up`
 * events. This class also manages "drag sequences".
 *
 * When the `handleDownEvent` user function returns `true` a drag sequence is
 * started. During a drag sequence the `handleDragEvent` user function is
 * called on `move` events. The drag sequence ends when the `handleUpEvent`
 * user function is called and returns `false`.
 *
 * @constructor
 * @param {olx.interaction.PointerOptions=} opt_options Options.
 * @extends {ol.interaction.Interaction}
 * @api
 */
const PointerInteraction = function(opt_options) {

  const options = opt_options ? opt_options : {};

  const handleEvent = options.handleEvent ?
    options.handleEvent : PointerInteraction.handleEvent;

  Interaction.call(this, {
    handleEvent: handleEvent
  });

  /**
   * @type {function(ol.MapBrowserPointerEvent):boolean}
   * @private
   */
  this.handleDownEvent_ = options.handleDownEvent ?
    options.handleDownEvent : PointerInteraction.handleDownEvent;

  /**
   * @type {function(ol.MapBrowserPointerEvent)}
   * @private
   */
  this.handleDragEvent_ = options.handleDragEvent ?
    options.handleDragEvent : PointerInteraction.handleDragEvent;

  /**
   * @type {function(ol.MapBrowserPointerEvent)}
   * @private
   */
  this.handleMoveEvent_ = options.handleMoveEvent ?
    options.handleMoveEvent : PointerInteraction.handleMoveEvent;

  /**
   * @type {function(ol.MapBrowserPointerEvent):boolean}
   * @private
   */
  this.handleUpEvent_ = options.handleUpEvent ?
    options.handleUpEvent : PointerInteraction.handleUpEvent;

  /**
   * @type {boolean}
   * @protected
   */
  this.handlingDownUpSequence = false;

  /**
   * @type {Object.<string, ol.pointer.PointerEvent>}
   * @private
   */
  this.trackedPointers_ = {};

  /**
   * @type {Array.<ol.pointer.PointerEvent>}
   * @protected
   */
  this.targetPointers = [];

};

inherits(PointerInteraction, Interaction);


/**
 * @param {Array.<ol.pointer.PointerEvent>} pointerEvents List of events.
 * @return {ol.Pixel} Centroid pixel.
 */
PointerInteraction.centroid = function(pointerEvents) {
  const length = pointerEvents.length;
  let clientX = 0;
  let clientY = 0;
  for (let i = 0; i < length; i++) {
    clientX += pointerEvents[i].clientX;
    clientY += pointerEvents[i].clientY;
  }
  return [clientX / length, clientY / length];
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Whether the event is a pointerdown, pointerdrag
 *     or pointerup event.
 * @private
 */
PointerInteraction.prototype.isPointerDraggingEvent_ = function(mapBrowserEvent) {
  const type = mapBrowserEvent.type;
  return type === MapBrowserEventType.POINTERDOWN ||
    type === MapBrowserEventType.POINTERDRAG ||
    type === MapBrowserEventType.POINTERUP;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @private
 */
PointerInteraction.prototype.updateTrackedPointers_ = function(mapBrowserEvent) {
  if (this.isPointerDraggingEvent_(mapBrowserEvent)) {
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
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.Pointer}
 */
PointerInteraction.handleDragEvent = nullFunction;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Capture dragging.
 * @this {ol.interaction.Pointer}
 */
PointerInteraction.handleUpEvent = FALSE;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Capture dragging.
 * @this {ol.interaction.Pointer}
 */
PointerInteraction.handleDownEvent = FALSE;


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.Pointer}
 */
PointerInteraction.handleMoveEvent = nullFunction;


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} and may call into
 * other functions, if event sequences like e.g. 'drag' or 'down-up' etc. are
 * detected.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.Pointer}
 * @api
 */
PointerInteraction.handleEvent = function(mapBrowserEvent) {
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
      this.handlingDownUpSequence = handled;
      stopEvent = this.shouldStopEvent(handled);
    } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERMOVE) {
      this.handleMoveEvent_(mapBrowserEvent);
    }
  }
  return !stopEvent;
};


/**
 * This method is used to determine if "down" events should be propagated to
 * other interactions or should be stopped.
 *
 * The method receives the return code of the "handleDownEvent" function.
 *
 * By default this function is the "identity" function. It's overidden in
 * child classes.
 *
 * @param {boolean} handled Was the event handled by the interaction?
 * @return {boolean} Should the event be stopped?
 * @protected
 */
PointerInteraction.prototype.shouldStopEvent = function(handled) {
  return handled;
};

export default PointerInteraction;
