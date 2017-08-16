goog.provide('ol.MapBrowserEventHandler');

goog.require('ol');
goog.require('ol.has');
goog.require('ol.MapBrowserEventType');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.events');
goog.require('ol.events.EventTarget');
goog.require('ol.pointer.EventType');
goog.require('ol.pointer.PointerEventHandler');


/**
 * @param {ol.PluggableMap} map The map with the viewport to listen to events on.
 * @param {number|undefined} moveTolerance The minimal distance the pointer must travel to trigger a move.
 * @constructor
 * @extends {ol.events.EventTarget}
 */
ol.MapBrowserEventHandler = function(map, moveTolerance) {

  ol.events.EventTarget.call(this);

  /**
   * This is the element that we will listen to the real events on.
   * @type {ol.PluggableMap}
   * @private
   */
  this.map_ = map;

  /**
   * @type {number}
   * @private
   */
  this.clickTimeoutId_ = 0;

  /**
   * @type {boolean}
   * @private
   */
  this.dragging_ = false;

  /**
   * @type {!Array.<ol.EventsKey>}
   * @private
   */
  this.dragListenerKeys_ = [];

  /**
   * @type {number}
   * @private
   */
  this.moveTolerance_ = moveTolerance ?
    moveTolerance * ol.has.DEVICE_PIXEL_RATIO : ol.has.DEVICE_PIXEL_RATIO;

  /**
   * The most recent "down" type event (or null if none have occurred).
   * Set on pointerdown.
   * @type {ol.pointer.PointerEvent}
   * @private
   */
  this.down_ = null;

  var element = this.map_.getViewport();

  /**
   * @type {number}
   * @private
   */
  this.activePointers_ = 0;

  /**
   * @type {!Object.<number, boolean>}
   * @private
   */
  this.trackedTouches_ = {};

  /**
   * Event handler which generates pointer events for
   * the viewport element.
   *
   * @type {ol.pointer.PointerEventHandler}
   * @private
   */
  this.pointerEventHandler_ = new ol.pointer.PointerEventHandler(element);

  /**
   * Event handler which generates pointer events for
   * the document (used when dragging).
   *
   * @type {ol.pointer.PointerEventHandler}
   * @private
   */
  this.documentPointerEventHandler_ = null;

  /**
   * @type {?ol.EventsKey}
   * @private
   */
  this.pointerdownListenerKey_ = ol.events.listen(this.pointerEventHandler_,
      ol.pointer.EventType.POINTERDOWN,
      this.handlePointerDown_, this);

  /**
   * @type {?ol.EventsKey}
   * @private
   */
  this.relayedListenerKey_ = ol.events.listen(this.pointerEventHandler_,
      ol.pointer.EventType.POINTERMOVE,
      this.relayEvent_, this);

};
ol.inherits(ol.MapBrowserEventHandler, ol.events.EventTarget);


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.emulateClick_ = function(pointerEvent) {
  var newEvent = new ol.MapBrowserPointerEvent(
      ol.MapBrowserEventType.CLICK, this.map_, pointerEvent);
  this.dispatchEvent(newEvent);
  if (this.clickTimeoutId_ !== 0) {
    // double-click
    clearTimeout(this.clickTimeoutId_);
    this.clickTimeoutId_ = 0;
    newEvent = new ol.MapBrowserPointerEvent(
        ol.MapBrowserEventType.DBLCLICK, this.map_, pointerEvent);
    this.dispatchEvent(newEvent);
  } else {
    // click
    this.clickTimeoutId_ = setTimeout(function() {
      this.clickTimeoutId_ = 0;
      var newEvent = new ol.MapBrowserPointerEvent(
          ol.MapBrowserEventType.SINGLECLICK, this.map_, pointerEvent);
      this.dispatchEvent(newEvent);
    }.bind(this), 250);
  }
};


/**
 * Keeps track on how many pointers are currently active.
 *
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.updateActivePointers_ = function(pointerEvent) {
  var event = pointerEvent;

  if (event.type == ol.MapBrowserEventType.POINTERUP ||
      event.type == ol.MapBrowserEventType.POINTERCANCEL) {
    delete this.trackedTouches_[event.pointerId];
  } else if (event.type == ol.MapBrowserEventType.POINTERDOWN) {
    this.trackedTouches_[event.pointerId] = true;
  }
  this.activePointers_ = Object.keys(this.trackedTouches_).length;
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerUp_ = function(pointerEvent) {
  this.updateActivePointers_(pointerEvent);
  var newEvent = new ol.MapBrowserPointerEvent(
      ol.MapBrowserEventType.POINTERUP, this.map_, pointerEvent);
  this.dispatchEvent(newEvent);

  // We emulate click events on left mouse button click, touch contact, and pen
  // contact. isMouseActionButton returns true in these cases (evt.button is set
  // to 0).
  // See http://www.w3.org/TR/pointerevents/#button-states
  if (!this.dragging_ && this.isMouseActionButton_(pointerEvent)) {
    this.emulateClick_(this.down_);
  }

  if (this.activePointers_ === 0) {
    this.dragListenerKeys_.forEach(ol.events.unlistenByKey);
    this.dragListenerKeys_.length = 0;
    this.dragging_ = false;
    this.down_ = null;
    this.documentPointerEventHandler_.dispose();
    this.documentPointerEventHandler_ = null;
  }
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @return {boolean} If the left mouse button was pressed.
 * @private
 */
ol.MapBrowserEventHandler.prototype.isMouseActionButton_ = function(pointerEvent) {
  return pointerEvent.button === 0;
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerDown_ = function(pointerEvent) {
  this.updateActivePointers_(pointerEvent);
  var newEvent = new ol.MapBrowserPointerEvent(
      ol.MapBrowserEventType.POINTERDOWN, this.map_, pointerEvent);
  this.dispatchEvent(newEvent);

  this.down_ = pointerEvent;

  if (this.dragListenerKeys_.length === 0) {
    /* Set up a pointer event handler on the `document`,
     * which is required when the pointer is moved outside
     * the viewport when dragging.
     */
    this.documentPointerEventHandler_ =
        new ol.pointer.PointerEventHandler(document);

    this.dragListenerKeys_.push(
        ol.events.listen(this.documentPointerEventHandler_,
            ol.MapBrowserEventType.POINTERMOVE,
            this.handlePointerMove_, this),
        ol.events.listen(this.documentPointerEventHandler_,
            ol.MapBrowserEventType.POINTERUP,
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
        ol.events.listen(this.pointerEventHandler_,
            ol.MapBrowserEventType.POINTERCANCEL,
            this.handlePointerUp_, this)
    );
  }
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerMove_ = function(pointerEvent) {
  // Between pointerdown and pointerup, pointermove events are triggered.
  // To avoid a 'false' touchmove event to be dispatched, we test if the pointer
  // moved a significant distance.
  if (this.isMoving_(pointerEvent)) {
    this.dragging_ = true;
    var newEvent = new ol.MapBrowserPointerEvent(
        ol.MapBrowserEventType.POINTERDRAG, this.map_, pointerEvent,
        this.dragging_);
    this.dispatchEvent(newEvent);
  }

  // Some native android browser triggers mousemove events during small period
  // of time. See: https://code.google.com/p/android/issues/detail?id=5491 or
  // https://code.google.com/p/android/issues/detail?id=19827
  // ex: Galaxy Tab P3110 + Android 4.1.1
  pointerEvent.preventDefault();
};


/**
 * Wrap and relay a pointer event.  Note that this requires that the type
 * string for the MapBrowserPointerEvent matches the PointerEvent type.
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.relayEvent_ = function(pointerEvent) {
  var dragging = !!(this.down_ && this.isMoving_(pointerEvent));
  this.dispatchEvent(new ol.MapBrowserPointerEvent(
      pointerEvent.type, this.map_, pointerEvent, dragging));
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @return {boolean} Is moving.
 * @private
 */
ol.MapBrowserEventHandler.prototype.isMoving_ = function(pointerEvent) {
  return Math.abs(pointerEvent.clientX - this.down_.clientX) > this.moveTolerance_ ||
      Math.abs(pointerEvent.clientY - this.down_.clientY) > this.moveTolerance_;
};


/**
 * @inheritDoc
 */
ol.MapBrowserEventHandler.prototype.disposeInternal = function() {
  if (this.relayedListenerKey_) {
    ol.events.unlistenByKey(this.relayedListenerKey_);
    this.relayedListenerKey_ = null;
  }
  if (this.pointerdownListenerKey_) {
    ol.events.unlistenByKey(this.pointerdownListenerKey_);
    this.pointerdownListenerKey_ = null;
  }

  this.dragListenerKeys_.forEach(ol.events.unlistenByKey);
  this.dragListenerKeys_.length = 0;

  if (this.documentPointerEventHandler_) {
    this.documentPointerEventHandler_.dispose();
    this.documentPointerEventHandler_ = null;
  }
  if (this.pointerEventHandler_) {
    this.pointerEventHandler_.dispose();
    this.pointerEventHandler_ = null;
  }
  ol.events.EventTarget.prototype.disposeInternal.call(this);
};
