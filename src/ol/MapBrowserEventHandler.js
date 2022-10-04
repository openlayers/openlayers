/**
 * @module ol/MapBrowserEventHandler
 */

import EventType from './events/EventType.js';
import MapBrowserEvent from './MapBrowserEvent.js';
import MapBrowserEventType from './MapBrowserEventType.js';
import PointerEventType from './pointer/EventType.js';
import Target from './events/Target.js';
import {PASSIVE_EVENT_LISTENERS} from './has.js';
import {VOID} from './functions.js';
import {listen, unlistenByKey} from './events.js';

class MapBrowserEventHandler extends Target {
  /**
   * @param {import("./Map.js").default} map The map with the viewport to listen to events on.
   * @param {number} [moveTolerance] The minimal distance the pointer must travel to trigger a move.
   */
  constructor(map, moveTolerance) {
    super(map);

    /**
     * This is the element that we will listen to the real events on.
     * @type {import("./Map.js").default}
     * @private
     */
    this.map_ = map;

    /**
     * @type {any}
     * @private
     */
    this.clickTimeoutId_;

    /**
     * Emulate dblclick and singleclick. Will be true when only one pointer is active.
     * @type {boolean}
     */
    this.emulateClicks_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.dragging_ = false;

    /**
     * @type {!Array<import("./events.js").EventsKey>}
     * @private
     */
    this.dragListenerKeys_ = [];

    /**
     * @type {number}
     * @private
     */
    this.moveTolerance_ = moveTolerance === undefined ? 1 : moveTolerance;

    /**
     * The most recent "down" type event (or null if none have occurred).
     * Set on pointerdown.
     * @type {PointerEvent|null}
     * @private
     */
    this.down_ = null;

    const element = this.map_.getViewport();

    /**
     * @type {Array<PointerEvent>}
     * @private
     */
    this.activePointers_ = [];

    /**
     * @type {!Object<number, Event>}
     * @private
     */
    this.trackedTouches_ = {};

    this.element_ = element;

    /**
     * @type {?import("./events.js").EventsKey}
     * @private
     */
    this.pointerdownListenerKey_ = listen(
      element,
      PointerEventType.POINTERDOWN,
      this.handlePointerDown_,
      this
    );

    /**
     * @type {PointerEvent}
     * @private
     */
    this.originalPointerMoveEvent_;

    /**
     * @type {?import("./events.js").EventsKey}
     * @private
     */
    this.relayedListenerKey_ = listen(
      element,
      PointerEventType.POINTERMOVE,
      this.relayMoveEvent_,
      this
    );

    /**
     * @private
     */
    this.boundHandleTouchMove_ = this.handleTouchMove_.bind(this);

    this.element_.addEventListener(
      EventType.TOUCHMOVE,
      this.boundHandleTouchMove_,
      PASSIVE_EVENT_LISTENERS ? {passive: false} : false
    );
  }

  /**
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @private
   */
  emulateClick_(pointerEvent) {
    let newEvent = new MapBrowserEvent(
      MapBrowserEventType.CLICK,
      this.map_,
      pointerEvent
    );
    this.dispatchEvent(newEvent);
    if (this.clickTimeoutId_ !== undefined) {
      // double-click
      clearTimeout(this.clickTimeoutId_);
      this.clickTimeoutId_ = undefined;
      newEvent = new MapBrowserEvent(
        MapBrowserEventType.DBLCLICK,
        this.map_,
        pointerEvent
      );
      this.dispatchEvent(newEvent);
    } else {
      // click
      this.clickTimeoutId_ = setTimeout(() => {
        this.clickTimeoutId_ = undefined;
        const newEvent = new MapBrowserEvent(
          MapBrowserEventType.SINGLECLICK,
          this.map_,
          pointerEvent
        );
        this.dispatchEvent(newEvent);
      }, 250);
    }
  }

  /**
   * Keeps track on how many pointers are currently active.
   *
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @private
   */
  updateActivePointers_(pointerEvent) {
    const event = pointerEvent;
    const id = event.pointerId;

    if (
      event.type == MapBrowserEventType.POINTERUP ||
      event.type == MapBrowserEventType.POINTERCANCEL
    ) {
      delete this.trackedTouches_[id];
      for (const pointerId in this.trackedTouches_) {
        if (this.trackedTouches_[pointerId].target !== event.target) {
          // Some platforms assign a new pointerId when the target changes.
          // If this happens, delete one tracked pointer. If there is more
          // than one tracked pointer for the old target, it will be cleared
          // by subsequent POINTERUP events from other pointers.
          delete this.trackedTouches_[pointerId];
          break;
        }
      }
    } else if (
      event.type == MapBrowserEventType.POINTERDOWN ||
      event.type == MapBrowserEventType.POINTERMOVE
    ) {
      this.trackedTouches_[id] = event;
    }
    this.activePointers_ = Object.values(this.trackedTouches_);
  }

  /**
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @private
   */
  handlePointerUp_(pointerEvent) {
    this.updateActivePointers_(pointerEvent);
    const newEvent = new MapBrowserEvent(
      MapBrowserEventType.POINTERUP,
      this.map_,
      pointerEvent,
      undefined,
      undefined,
      this.activePointers_
    );
    this.dispatchEvent(newEvent);

    // We emulate click events on left mouse button click, touch contact, and pen
    // contact. isMouseActionButton returns true in these cases (evt.button is set
    // to 0).
    // See http://www.w3.org/TR/pointerevents/#button-states
    // We only fire click, singleclick, and doubleclick if nobody has called
    // event.preventDefault().
    if (
      this.emulateClicks_ &&
      !newEvent.defaultPrevented &&
      !this.dragging_ &&
      this.isMouseActionButton_(pointerEvent)
    ) {
      this.emulateClick_(this.down_);
    }

    if (this.activePointers_.length === 0) {
      this.dragListenerKeys_.forEach(unlistenByKey);
      this.dragListenerKeys_.length = 0;
      this.dragging_ = false;
      this.down_ = null;
    }
  }

  /**
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @return {boolean} If the left mouse button was pressed.
   * @private
   */
  isMouseActionButton_(pointerEvent) {
    return pointerEvent.button === 0;
  }

  /**
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @private
   */
  handlePointerDown_(pointerEvent) {
    this.emulateClicks_ = this.activePointers_.length === 0;
    this.updateActivePointers_(pointerEvent);
    const newEvent = new MapBrowserEvent(
      MapBrowserEventType.POINTERDOWN,
      this.map_,
      pointerEvent,
      undefined,
      undefined,
      this.activePointers_
    );
    this.dispatchEvent(newEvent);

    // Store a copy of the down event
    this.down_ = /** @type {PointerEvent} */ ({});
    for (const property in pointerEvent) {
      const value = pointerEvent[property];
      this.down_[property] = typeof value === 'function' ? VOID : value;
    }

    if (this.dragListenerKeys_.length === 0) {
      const doc = this.map_.getOwnerDocument();
      this.dragListenerKeys_.push(
        listen(
          doc,
          MapBrowserEventType.POINTERMOVE,
          this.handlePointerMove_,
          this
        ),
        listen(doc, MapBrowserEventType.POINTERUP, this.handlePointerUp_, this),
        /* Note that the listener for `pointercancel is set up on
         * `pointerEventHandler_` and not `documentPointerEventHandler_` like
         * the `pointerup` and `pointermove` listeners.
         *
         * The reason for this is the following: `TouchSource.vacuumTouches_()`
         * issues `pointercancel` events, when there was no `touchend` for a
         * `touchstart`. Now, let's say a first `touchstart` is registered on
         * `pointerEventHandler_`. The `documentPointerEventHandler_` is set up.
         * But `documentPointerEventHandler_` doesn't know about the first
         * `touchstart`. If there is no `touchend` for the `touchstart`, we can
         * only receive a `touchcancel` from `pointerEventHandler_`, because it is
         * only registered there.
         */
        listen(
          this.element_,
          MapBrowserEventType.POINTERCANCEL,
          this.handlePointerUp_,
          this
        )
      );
      if (this.element_.getRootNode && this.element_.getRootNode() !== doc) {
        this.dragListenerKeys_.push(
          listen(
            this.element_.getRootNode(),
            MapBrowserEventType.POINTERUP,
            this.handlePointerUp_,
            this
          )
        );
      }
    }
  }

  /**
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @private
   */
  handlePointerMove_(pointerEvent) {
    // Between pointerdown and pointerup, pointermove events are triggered.
    // To avoid a 'false' touchmove event to be dispatched, we test if the pointer
    // moved a significant distance.
    if (this.isMoving_(pointerEvent)) {
      this.updateActivePointers_(pointerEvent);
      this.dragging_ = true;
      const newEvent = new MapBrowserEvent(
        MapBrowserEventType.POINTERDRAG,
        this.map_,
        pointerEvent,
        this.dragging_,
        undefined,
        this.activePointers_
      );
      this.dispatchEvent(newEvent);
    }
  }

  /**
   * Wrap and relay a pointermove event.
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @private
   */
  relayMoveEvent_(pointerEvent) {
    this.originalPointerMoveEvent_ = pointerEvent;
    const dragging = !!(this.down_ && this.isMoving_(pointerEvent));
    this.dispatchEvent(
      new MapBrowserEvent(
        MapBrowserEventType.POINTERMOVE,
        this.map_,
        pointerEvent,
        dragging
      )
    );
  }

  /**
   * Flexible handling of a `touch-action: none` css equivalent: because calling
   * `preventDefault()` on a `pointermove` event does not stop native page scrolling
   * and zooming, we also listen for `touchmove` and call `preventDefault()` on it
   * when an interaction (currently `DragPan` handles the event.
   * @param {TouchEvent} event Event.
   * @private
   */
  handleTouchMove_(event) {
    // Due to https://github.com/mpizenberg/elm-pep/issues/2, `this.originalPointerMoveEvent_`
    // may not be initialized yet when we get here on a platform without native pointer events.
    const originalEvent = this.originalPointerMoveEvent_;
    if (
      (!originalEvent || originalEvent.defaultPrevented) &&
      (typeof event.cancelable !== 'boolean' || event.cancelable === true)
    ) {
      event.preventDefault();
    }
  }

  /**
   * @param {PointerEvent} pointerEvent Pointer
   * event.
   * @return {boolean} Is moving.
   * @private
   */
  isMoving_(pointerEvent) {
    return (
      this.dragging_ ||
      Math.abs(pointerEvent.clientX - this.down_.clientX) >
        this.moveTolerance_ ||
      Math.abs(pointerEvent.clientY - this.down_.clientY) > this.moveTolerance_
    );
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    if (this.relayedListenerKey_) {
      unlistenByKey(this.relayedListenerKey_);
      this.relayedListenerKey_ = null;
    }
    this.element_.removeEventListener(
      EventType.TOUCHMOVE,
      this.boundHandleTouchMove_
    );

    if (this.pointerdownListenerKey_) {
      unlistenByKey(this.pointerdownListenerKey_);
      this.pointerdownListenerKey_ = null;
    }

    this.dragListenerKeys_.forEach(unlistenByKey);
    this.dragListenerKeys_.length = 0;

    this.element_ = null;
    super.disposeInternal();
  }
}

export default MapBrowserEventHandler;
