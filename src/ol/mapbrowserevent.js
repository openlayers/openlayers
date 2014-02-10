goog.provide('ol.MapBrowserEvent');
goog.provide('ol.MapBrowserEvent.EventType');
goog.provide('ol.MapBrowserEventHandler');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');

goog.require('ol.Coordinate');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');
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

  this.down_ = null;

  var element = this.map_.getViewport();

  /**
   * @type {number}
   * @private
   */
  this.activePointers_ = 0;
  this.trackedTouches_ = {};

  /**
   * @type {ol.pointer.PointerEventHandler}
   * @private
   */
  this.pointerEventHandler_ = new ol.pointer.PointerEventHandler(element);
  this.pointerdownListenerKey_ = goog.events.listen(this.pointerEventHandler_,
      ol.pointer.EventType.POINTERDOWN,
      this.handlePointerDown_, false, this);
};
goog.inherits(ol.MapBrowserEventHandler, goog.events.EventTarget);


/**
 * Get the last "down" type event.  This will be set on mousedown,
 * touchstart, and pointerdown.
 * @return {goog.events.BrowserEvent} The most recent "down" type event (or null
 * if none have occurred).
 */
ol.MapBrowserEventHandler.prototype.getDown = function() {
  return this.down_;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.emulateClick_ = function(browserEvent) {
  if (this.clickTimeoutId_ !== 0) {
    // double-click
    goog.global.clearTimeout(this.clickTimeoutId_);
    this.clickTimeoutId_ = 0;
    var newEvent = new ol.MapBrowserEvent(
        ol.MapBrowserEvent.EventType.DBLCLICK, this.map_, browserEvent);
    this.dispatchEvent(newEvent);
  } else {
    // click

    if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
      // In IE 7-8, referring to the original event object after the current
      // call stack causes "member not found" exceptions, such as in the timeout
      // we use here.
      var ev = /** @type {Event} */ (
          goog.object.clone(browserEvent.getBrowserEvent()));
      this.clickTimeoutId_ = goog.global.setTimeout(goog.bind(function() {
        this.clickTimeoutId_ = 0;
        var newEvent = new ol.MapBrowserEvent(
            ol.MapBrowserEvent.EventType.SINGLECLICK, this.map_,
            new goog.events.BrowserEvent(ev, browserEvent.currentTarget));
        this.dispatchEvent(newEvent);
      }, this), 250);
    } else {
      this.clickTimeoutId_ = goog.global.setTimeout(goog.bind(function() {
        this.clickTimeoutId_ = 0;
        var newEvent = new ol.MapBrowserEvent(
            ol.MapBrowserEvent.EventType.SINGLECLICK, this.map_, browserEvent);
        this.dispatchEvent(newEvent);
      }, this), 250);
    }
  }
};


/**
 * Keeps track on how many pointers are currently active.
 *
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.updateActivePointers_ =
    function(browserEvent) {
  var event = browserEvent.getBrowserEvent();

  if (event.type == ol.MapBrowserEvent.EventType.POINTERUP ||
      event.type == ol.MapBrowserEvent.EventType.POINTERCANCEL) {
    delete this.trackedTouches_[event.pointerId];
  } else if (event.type == ol.MapBrowserEvent.EventType.POINTERDOWN) {
    this.trackedTouches_[event.pointerId] = true;
  }
  this.activePointers_ = goog.object.getCount(this.trackedTouches_);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerUp_ = function(browserEvent) {
  this.updateActivePointers_(browserEvent);
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.POINTERUP, this.map_, browserEvent);
  this.dispatchEvent(newEvent);

  if (this.activePointers_ <= 0) {
    this.pointerEventHandler_.unlistenOnDocument(
        ol.MapBrowserEvent.EventType.POINTERMOVE,
        this.handlePointerMove_, false, this);
    this.pointerEventHandler_.unlistenOnDocument(
        ol.MapBrowserEvent.EventType.POINTERUP,
        this.handlePointerUp_, false, this);
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
  }

  // We emulate click event on left mouse button click, touch contact, and pen
  // contact. isMouseActionButton returns true in these cases (evt.button is set
  // to 0).
  // See http://www.w3.org/TR/pointerevents/#button-states .
  if (!this.dragged_ && browserEvent.isMouseActionButton()) {
    goog.asserts.assert(!goog.isNull(this.down_));
    this.emulateClick_(this.down_);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerDown_ =
    function(browserEvent) {
  this.updateActivePointers_(browserEvent);
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.POINTERDOWN, this.map_, browserEvent);
  this.dispatchEvent(newEvent);

  this.down_ = browserEvent;
  this.dragged_ = false;

  if (goog.isNull(this.dragListenerKeys_)) {
    this.pointerEventHandler_.listenOnDocument(
        ol.MapBrowserEvent.EventType.POINTERMOVE,
        this.handlePointerMove_, false, this);
    this.pointerEventHandler_.listenOnDocument(
        ol.MapBrowserEvent.EventType.POINTERUP,
        this.handlePointerUp_, false, this);

    this.dragListenerKeys_ = [
      goog.events.listen(this.pointerEventHandler_,
          [ol.MapBrowserEvent.EventType.POINTERCANCEL],
          this.handlePointerUp_, false, this)
    ];
  }

  // FIXME check if/when this is necessary
  // prevent context menu
  browserEvent.preventDefault();
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerMove_ =
    function(browserEvent) {
  // Fix IE10 on windows Surface : When you tap the tablet, it triggers
  // multiple pointermove events between pointerdown and pointerup with
  // the exact same coordinates of the pointerdown event. To avoid a
  // 'false' touchmove event to be dispatched , we test if the pointer
  // effectively moved.
  if (browserEvent.clientX != this.down_.clientX ||
      browserEvent.clientY != this.down_.clientY) {
    this.dragged_ = true;
    var newEvent = new ol.MapBrowserEvent(
        ol.MapBrowserEvent.EventType.POINTERMOVE, this.map_, browserEvent);
    this.dispatchEvent(newEvent);
  }

  // Some native android browser triggers mousemove events during small period
  // of time. See: https://code.google.com/p/android/issues/detail?id=5491 or
  // https://code.google.com/p/android/issues/detail?id=19827
  // ex: Galaxy Tab P3110 + Android 4.1.1
  browserEvent.preventDefault();
};


/**
 * FIXME empty description for jsdoc
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
  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE &&
      !goog.isNull(this.ieDblclickListenerKey_)) {
    goog.events.unlistenByKey(this.ieDblclickListenerKey_);
    this.ieDblclickListenerKey_ = null;
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
