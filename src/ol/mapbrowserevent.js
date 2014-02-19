goog.provide('ol.MapBrowserEvent');
goog.provide('ol.MapBrowserEvent.EventType');
goog.provide('ol.MapBrowserEventHandler');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.object');

goog.require('ol.Coordinate');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.pointer.PointerEventHandler');



/**
 * @constructor
 * @extends {ol.MapEvent}
 * @implements {oli.MapBrowserEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {?oli.FrameState=} opt_frameState Frame state.
 * @todo stability experimental
 */
ol.MapBrowserEvent = function(type, map, browserEvent, opt_frameState) {

  goog.base(this, type, map, opt_frameState);

  /**
   * @const
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  /**
   * @const
   * @type {Event}
   */
  this.originalEvent = browserEvent.getBrowserEvent();

  /**
   * @type {ol.Coordinate}
   */
  this.coordinate = map.getEventCoordinate(this.originalEvent);

  /**
   * @type {ol.Pixel}
   */
  this.pixel = map.getEventPixel(this.originalEvent);

};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * Prevents the default browser action.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/event.preventDefault
 * @override
 * @todo stability experimental
 */
ol.MapBrowserEvent.prototype.preventDefault = function() {
  goog.base(this, 'preventDefault');
  this.browserEvent.preventDefault();
};


/**
 * Prevents further propagation of the current event.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/event.stopPropagation
 * @override
 * @todo stability experimental
 */
ol.MapBrowserEvent.prototype.stopPropagation = function() {
  goog.base(this, 'stopPropagation');
  this.browserEvent.stopPropagation();
};



/**
 * @constructor
 * @extends {ol.MapBrowserEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @param {?ol.FrameState=} opt_frameState Frame state.
 * @todo stability experimental
 */
ol.MapBrowserPointerEvent = function(type, map, pointerEvent, opt_frameState) {

  goog.base(this, type, map, pointerEvent.browserEvent, opt_frameState);

  /**
   * @const
   * @type {ol.pointer.PointerEvent}
   */
  this.pointerEvent = pointerEvent;

};
goog.inherits(ol.MapBrowserPointerEvent, ol.MapBrowserEvent);



/**
 * @param {ol.Map} map The map with the viewport to listen to events on.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ol.MapBrowserEventHandler = function(map) {

  goog.base(this);

  /**
   * This is the element that we will listen to the real events on.
   * @type {ol.Map}
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
  this.dragged_ = false;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.dragListenerKeys_ = null;

  /**
   * @type {goog.events.Key}
   * @private
   */
  this.pointerdownListenerKey_ = null;

  /**
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
   * @type {Object.<number, boolean>}
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

  this.pointerdownListenerKey_ = goog.events.listen(this.pointerEventHandler_,
      ol.pointer.EventType.POINTERDOWN,
      this.handlePointerDown_, false, this);
};
goog.inherits(ol.MapBrowserEventHandler, goog.events.EventTarget);


/**
 * Get the last "down" type event. This will be set on pointerdown.
 * @return {ol.pointer.PointerEvent} The most recent "down" type event (or null
 * if none have occurred).
 */
ol.MapBrowserEventHandler.prototype.getDown = function() {
  return this.down_;
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.emulateClick_ = function(pointerEvent) {
  if (this.clickTimeoutId_ !== 0) {
    // double-click
    goog.global.clearTimeout(this.clickTimeoutId_);
    this.clickTimeoutId_ = 0;
    var newEvent = new ol.MapBrowserPointerEvent(
        ol.MapBrowserEvent.EventType.DBLCLICK, this.map_, pointerEvent);
    this.dispatchEvent(newEvent);
  } else {
    // click
    this.clickTimeoutId_ = goog.global.setTimeout(goog.bind(function() {
      this.clickTimeoutId_ = 0;
      var newEvent = new ol.MapBrowserPointerEvent(
          ol.MapBrowserEvent.EventType.SINGLECLICK, this.map_, pointerEvent);
      this.dispatchEvent(newEvent);
    }, this), 250);
  }
};


/**
 * Keeps track on how many pointers are currently active.
 *
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.updateActivePointers_ =
    function(pointerEvent) {
  var event = pointerEvent;

  if (event.type == ol.MapBrowserEvent.EventType.POINTERUP ||
      event.type == ol.MapBrowserEvent.EventType.POINTERCANCEL) {
    delete this.trackedTouches_[event.pointerId];
  } else if (event.type == ol.MapBrowserEvent.EventType.POINTERDOWN) {
    this.trackedTouches_[event.pointerId] = true;
  }
  this.activePointers_ = goog.object.getCount(this.trackedTouches_);
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerUp_ = function(pointerEvent) {
  this.updateActivePointers_(pointerEvent);
  var newEvent = new ol.MapBrowserPointerEvent(
      ol.MapBrowserEvent.EventType.POINTERUP, this.map_, pointerEvent);
  this.dispatchEvent(newEvent);

  if (this.activePointers_ <= 0) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
    this.documentPointerEventHandler_.dispose();
    this.documentPointerEventHandler_ = null;
  }

  // We emulate click event on left mouse button click, touch contact, and pen
  // contact. isMouseActionButton returns true in these cases (evt.button is set
  // to 0).
  // See http://www.w3.org/TR/pointerevents/#button-states .
  if (!this.dragged_ && pointerEvent.button == 0) {
    goog.asserts.assert(!goog.isNull(this.down_));
    this.emulateClick_(this.down_);
  }
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerDown_ =
    function(pointerEvent) {
  this.updateActivePointers_(pointerEvent);
  var newEvent = new ol.MapBrowserPointerEvent(
      ol.MapBrowserEvent.EventType.POINTERDOWN, this.map_, pointerEvent);
  this.dispatchEvent(newEvent);

  this.down_ = pointerEvent;
  this.dragged_ = false;

  if (goog.isNull(this.dragListenerKeys_)) {
    /* Set up a pointer event handler on the `document`,
     * which is required when the pointer is moved outside
     * the viewport when dragging.
     */
    this.documentPointerEventHandler_ =
        new ol.pointer.PointerEventHandler(document);

    this.dragListenerKeys_ = [
      goog.events.listen(this.documentPointerEventHandler_,
          ol.MapBrowserEvent.EventType.POINTERMOVE,
          this.handlePointerMove_, false, this),
      goog.events.listen(this.documentPointerEventHandler_,
          ol.MapBrowserEvent.EventType.POINTERUP,
          this.handlePointerUp_, false, this),
      goog.events.listen(this.pointerEventHandler_,
          ol.MapBrowserEvent.EventType.POINTERCANCEL,
          this.handlePointerUp_, false, this)
    ];
  }

  // FIXME check if/when this is necessary
  // prevent context menu
  pointerEvent.preventDefault();
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent Pointer event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerMove_ =
    function(pointerEvent) {
  // Fix IE10 on windows Surface : When you tap the tablet, it triggers
  // multiple pointermove events between pointerdown and pointerup with
  // the exact same coordinates of the pointerdown event. To avoid a
  // 'false' touchmove event to be dispatched , we test if the pointer
  // effectively moved.
  if (pointerEvent.clientX != this.down_.clientX ||
      pointerEvent.clientY != this.down_.clientY) {
    this.dragged_ = true;
    var newEvent = new ol.MapBrowserPointerEvent(
        ol.MapBrowserEvent.EventType.POINTERMOVE, this.map_, pointerEvent);
    this.dispatchEvent(newEvent);
  }

  // Some native android browser triggers mousemove events during small period
  // of time. See: https://code.google.com/p/android/issues/detail?id=5491 or
  // https://code.google.com/p/android/issues/detail?id=19827
  // ex: Galaxy Tab P3110 + Android 4.1.1
  pointerEvent.preventDefault();
};


/**
 * @inheritDoc
 */
ol.MapBrowserEventHandler.prototype.disposeInternal = function() {
  if (!goog.isNull(this.pointerdownListenerKey_)) {
    goog.events.unlistenByKey(this.pointerdownListenerKey_);
    this.pointerdownListenerKey_ = null;
  }
  if (!goog.isNull(this.dragListenerKeys_)) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
  }
  if (!goog.isNull(this.documentPointerEventHandler_)) {
    this.documentPointerEventHandler_.dispose();
    this.documentPointerEventHandler_ = null;
  }
  if (!goog.isNull(this.pointerEventHandler_)) {
    this.pointerEventHandler_.dispose();
    this.pointerEventHandler_ = null;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * Constants for event names.
 * @enum {string}
 */
ol.MapBrowserEvent.EventType = {
  CLICK: goog.events.EventType.CLICK,
  DBLCLICK: goog.events.EventType.DBLCLICK,
  DRAGSTART: 'dragstart',
  DRAG: 'drag',
  DRAGEND: 'dragend',
  DOWN: 'down',

  MOUSEMOVE: goog.events.EventType.MOUSEMOVE,
  SINGLECLICK: 'singleclick',
  TOUCHSTART: goog.events.EventType.TOUCHSTART,
  TOUCHMOVE: goog.events.EventType.TOUCHMOVE,
  TOUCHEND: goog.events.EventType.TOUCHEND,

  POINTERMOVE: 'pointermove',
  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  POINTEROVER: 'pointerover',
  POINTEROUT: 'pointerout',
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  POINTERCANCEL: 'pointercancel'
};
