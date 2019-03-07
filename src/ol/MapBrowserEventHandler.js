/**
 * @module ol/MapBrowserEventHandler
 */
import {DEVICE_PIXEL_RATIO} from './has.js';
import MapBrowserEventType from './MapBrowserEventType.js';
import MapBrowserPointerEvent from './MapBrowserPointerEvent.js';
import {listen, unlistenByKey} from './events.js';
import EventTarget from './events/Target.js';
import PointerEventType from './pointer/EventType.js';
import PointerEventHandler from './pointer/PointerEventHandler.js';

class MapBrowserEventHandler extends EventTarget {

  /**
   * @param {import("./PluggableMap.js").default} map The map with the viewport to listen to events on.
   * @param {number=} moveTolerance The minimal distance the pointer must travel to trigger a move.
   */
  constructor(map, moveTolerance) {

    super();

    /**
     * This is the element that we will listen to the real events on.
     * @type {import("./PluggableMap.js").default}
     * @private
     */
    this.map_ = map;

    /**
     * @type {any}
     * @private
     */
    this.clickTimeoutId_;

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
    this.moveTolerance_ = moveTolerance ?
      moveTolerance * DEVICE_PIXEL_RATIO : DEVICE_PIXEL_RATIO;

    /**
     * The most recent "down" type event (or null if none have occurred).
     * Set on pointerdown.
     * @type {import("./pointer/PointerEvent.js").default}
     * @private
     */
    this.down_ = null;

    const element = this.map_.getViewport();

    /**
     * @type {number}
     * @private
     */
    this.activePointers_ = 0;

    /**
     * @type {!Object<number, boolean>}
     * @private
     */
    this.trackedTouches_ = {};

    /**
     * Event handler which generates pointer events for
     * the viewport element.
     *
     * @type {PointerEventHandler}
     * @private
     */
    this.pointerEventHandler_ = new PointerEventHandler(element);

    /**
     * Event handler which generates pointer events for
     * the document (used when dragging).
     *
     * @type {PointerEventHandler}
     * @private
     */
    this.documentPointerEventHandler_ = null;

    /**
     * @type {?import("./events.js").EventsKey}
     * @private
     */
    this.pointerdownListenerKey_ = listen(this.pointerEventHandler_,
      PointerEventType.POINTERDOWN,
      this.handlePointerDown_, this);

    /**
     * @type {?import("./events.js").EventsKey}
     * @private
     */
    this.relayedListenerKey_ = listen(this.pointerEventHandler_,
      PointerEventType.POINTERMOVE,
      this.relayEvent_, this);

  }

  /**
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @private
   */
  emulateClick_(pointerEvent) {
    let newEvent = new MapBrowserPointerEvent(
      MapBrowserEventType.CLICK, this.map_, pointerEvent);
    this.dispatchEvent(newEvent);
    if (this.clickTimeoutId_ !== undefined) {
      // double-click
      clearTimeout(this.clickTimeoutId_);
      this.clickTimeoutId_ = undefined;
      newEvent = new MapBrowserPointerEvent(
        MapBrowserEventType.DBLCLICK, this.map_, pointerEvent);
      this.dispatchEvent(newEvent);
    } else {
      // click
      this.clickTimeoutId_ = setTimeout(function() {
        this.clickTimeoutId_ = undefined;
        const newEvent = new MapBrowserPointerEvent(
          MapBrowserEventType.SINGLECLICK, this.map_, pointerEvent);
        this.dispatchEvent(newEvent);
      }.bind(this), 250);
    }
  }

  /**
   * Keeps track on how many pointers are currently active.
   *
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @private
   */
  updateActivePointers_(pointerEvent) {
    const event = pointerEvent;

    if (event.type == MapBrowserEventType.POINTERUP ||
        event.type == MapBrowserEventType.POINTERCANCEL) {
      delete this.trackedTouches_[event.pointerId];
    } else if (event.type == MapBrowserEventType.POINTERDOWN) {
      this.trackedTouches_[event.pointerId] = true;
    }
    this.activePointers_ = Object.keys(this.trackedTouches_).length;
  }

  /**
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @private
   */
  handlePointerUp_(pointerEvent) {
    this.updateActivePointers_(pointerEvent);
    const newEvent = new MapBrowserPointerEvent(
      MapBrowserEventType.POINTERUP, this.map_, pointerEvent);
    this.dispatchEvent(newEvent);

    // We emulate click events on left mouse button click, touch contact, and pen
    // contact. isMouseActionButton returns true in these cases (evt.button is set
    // to 0).
    // See http://www.w3.org/TR/pointerevents/#button-states
    // We only fire click, singleclick, and doubleclick if nobody has called
    // event.stopPropagation() or event.preventDefault().
    if (!newEvent.propagationStopped && !this.dragging_ && this.isMouseActionButton_(pointerEvent)) {
      this.emulateClick_(this.down_);
    }

    if (this.activePointers_ === 0) {
      this.dragListenerKeys_.forEach(unlistenByKey);
      this.dragListenerKeys_.length = 0;
      this.dragging_ = false;
      this.down_ = null;
      this.documentPointerEventHandler_.dispose();
      this.documentPointerEventHandler_ = null;
    }
  }

  /**
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @return {boolean} If the left mouse button was pressed.
   * @private
   */
  isMouseActionButton_(pointerEvent) {
    return pointerEvent.button === 0;
  }

  /**
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @private
   */
  handlePointerDown_(pointerEvent) {
    this.updateActivePointers_(pointerEvent);
    const newEvent = new MapBrowserPointerEvent(
      MapBrowserEventType.POINTERDOWN, this.map_, pointerEvent);
    this.dispatchEvent(newEvent);

    this.down_ = pointerEvent;

    if (this.dragListenerKeys_.length === 0) {
      /* Set up a pointer event handler on the `document`,
       * which is required when the pointer is moved outside
       * the viewport when dragging.
       */
      this.documentPointerEventHandler_ =
          new PointerEventHandler(document);

      this.dragListenerKeys_.push(
        listen(this.documentPointerEventHandler_,
          MapBrowserEventType.POINTERMOVE,
          this.handlePointerMove_, this),
        listen(this.documentPointerEventHandler_,
          MapBrowserEventType.POINTERUP,
          this.handlePointerUp_, this),
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
        listen(this.pointerEventHandler_,
          MapBrowserEventType.POINTERCANCEL,
          this.handlePointerUp_, this)
      );
    }
  }

  /**
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @private
   */
  handlePointerMove_(pointerEvent) {
    // Between pointerdown and pointerup, pointermove events are triggered.
    // To avoid a 'false' touchmove event to be dispatched, we test if the pointer
    // moved a significant distance.
    if (this.isMoving_(pointerEvent)) {
      this.dragging_ = true;
      const newEvent = new MapBrowserPointerEvent(
        MapBrowserEventType.POINTERDRAG, this.map_, pointerEvent,
        this.dragging_);
      this.dispatchEvent(newEvent);
    }

    // Some native android browser triggers mousemove events during small period
    // of time. See: https://code.google.com/p/android/issues/detail?id=5491 or
    // https://code.google.com/p/android/issues/detail?id=19827
    // ex: Galaxy Tab P3110 + Android 4.1.1
    pointerEvent.preventDefault();
  }

  /**
   * Wrap and relay a pointer event.  Note that this requires that the type
   * string for the MapBrowserPointerEvent matches the PointerEvent type.
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @private
   */
  relayEvent_(pointerEvent) {
    const dragging = !!(this.down_ && this.isMoving_(pointerEvent));
    this.dispatchEvent(new MapBrowserPointerEvent(
      pointerEvent.type, this.map_, pointerEvent, dragging));
  }

  /**
   * @param {import("./pointer/PointerEvent.js").default} pointerEvent Pointer
   * event.
   * @return {boolean} Is moving.
   * @private
   */
  isMoving_(pointerEvent) {
    return this.dragging_ ||
        Math.abs(pointerEvent.clientX - this.down_.clientX) > this.moveTolerance_ ||
        Math.abs(pointerEvent.clientY - this.down_.clientY) > this.moveTolerance_;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.relayedListenerKey_) {
      unlistenByKey(this.relayedListenerKey_);
      this.relayedListenerKey_ = null;
    }
    if (this.pointerdownListenerKey_) {
      unlistenByKey(this.pointerdownListenerKey_);
      this.pointerdownListenerKey_ = null;
    }

    this.dragListenerKeys_.forEach(unlistenByKey);
    this.dragListenerKeys_.length = 0;

    if (this.documentPointerEventHandler_) {
      this.documentPointerEventHandler_.dispose();
      this.documentPointerEventHandler_ = null;
    }
    if (this.pointerEventHandler_) {
      this.pointerEventHandler_.dispose();
      this.pointerEventHandler_ = null;
    }
    super.disposeInternal();
  }
}


export default MapBrowserEventHandler;
