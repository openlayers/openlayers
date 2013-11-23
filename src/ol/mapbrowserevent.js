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
goog.require('ol.FrameState');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');



/**
 * @constructor
 * @extends {ol.MapEvent}
 * @param {string} type Event type.
 * @param {ol.Map} map Map.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {?ol.FrameState=} opt_frameState Frame state.
 * @todo stability experimental
 */
ol.MapBrowserEvent = function(type, map, browserEvent, opt_frameState) {

  goog.base(this, type, map, opt_frameState);

  /**
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.coordinate_ = null;

  /**
   * @private
   * @type {ol.Pixel}
   */
  this.pixel_ = null;

};
goog.inherits(ol.MapBrowserEvent, ol.MapEvent);


/**
 * @return {ol.Coordinate} Coordinate.
 * @todo stability experimental
 */
ol.MapBrowserEvent.prototype.getCoordinate = function() {
  if (goog.isNull(this.coordinate_)) {
    this.coordinate_ = this.map.getEventCoordinate(
        this.browserEvent.getBrowserEvent());
  }
  return this.coordinate_;
};


/**
 * Get pixel offset of the event from the top-left corner of the map viewport.
 * @return {ol.Pixel} Pixel offset.
 * @todo stability experimental
 */
ol.MapBrowserEvent.prototype.getPixel = function() {
  if (goog.isNull(this.pixel_)) {
    this.pixel_ = this.map.getEventPixel(this.browserEvent.getBrowserEvent());
  }
  return this.pixel_;
};


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
  this.mousedownListenerKey_ = null;

  /**
   * @type {goog.events.Key}
   * @private
   */
  this.pointerdownListenerKey_ = null;

  /**
   * @type {goog.events.Key}
   * @private
   */
  this.touchstartListenerKey_ = null;

  /**
   * @type {goog.events.BrowserEvent}
   * @private
   */
  this.down_ = null;

  var element = this.map_.getViewport();

  this.relayedListenerKeys_ = [
    goog.events.listen(element,
        goog.events.EventType.MOUSEMOVE,
        this.relayEvent_, false, this),
    goog.events.listen(element,
        goog.events.EventType.CLICK,
        this.relayEvent_, false, this)
  ];

  this.mousedownListenerKey_ = goog.events.listen(element,
      goog.events.EventType.MOUSEDOWN,
      this.handleMouseDown_, false, this);

  this.pointerdownListenerKey_ = goog.events.listen(element,
      goog.events.EventType.MSPOINTERDOWN,
      this.handlePointerDown_, false, this);

  this.touchstartListenerKey_ = goog.events.listen(element,
      goog.events.EventType.TOUCHSTART,
      this.handleTouchStart_, false, this);

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
    this.clickTimeoutId_ = goog.global.setTimeout(goog.bind(function() {
      this.clickTimeoutId_ = 0;
      var newEvent = new ol.MapBrowserEvent(
          ol.MapBrowserEvent.EventType.SINGLECLICK, this.map_, browserEvent);
      this.dispatchEvent(newEvent);
    }, this), 250);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleMouseUp_ = function(browserEvent) {
  if (this.down_) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
    if (this.dragged_) {
      var newEvent = new ol.MapBrowserEvent(
          ol.MapBrowserEvent.EventType.DRAGEND, this.map_, browserEvent);
      this.dispatchEvent(newEvent);
    } else if (browserEvent.isMouseActionButton()) {
      this.emulateClick_(browserEvent);
    }
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleMouseDown_ = function(browserEvent) {
  if (!goog.isNull(this.pointerdownListenerKey_)) {
    // mouse device detected - unregister the pointerdown and touchstart
    // listeners
    goog.events.unlistenByKey(this.pointerdownListenerKey_);
    this.pointerdownListenerKey_ = null;

    goog.asserts.assert(!goog.isNull(this.touchstartListenerKey_));
    goog.events.unlistenByKey(this.touchstartListenerKey_);
    this.touchstartListenerKey_ = null;
  }

  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.DOWN, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
  this.down_ = browserEvent;
  this.dragged_ = false;
  this.dragListenerKeys_ = [
    goog.events.listen(goog.global.document, goog.events.EventType.MOUSEMOVE,
        this.handleMouseMove_, false, this),
    goog.events.listen(goog.global.document, goog.events.EventType.MOUSEUP,
        this.handleMouseUp_, false, this)
  ];
  // prevent browser image dragging with the dom renderer
  browserEvent.preventDefault();
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleMouseMove_ = function(browserEvent) {
  var newEvent;
  if (!this.dragged_) {
    this.dragged_ = true;
    newEvent = new ol.MapBrowserEvent(
        ol.MapBrowserEvent.EventType.DRAGSTART, this.map_, this.down_);
    this.dispatchEvent(newEvent);
  }
  newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.DRAG, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerDown_ =
    function(browserEvent) {
  if (!goog.isNull(this.mousedownListenerKey_)) {
    // pointer device detected - unregister the mousedown and touchstart
    // listeners
    goog.events.unlistenByKey(this.mousedownListenerKey_);
    this.mousedownListenerKey_ = null;

    goog.asserts.assert(!goog.isNull(this.touchstartListenerKey_));
    goog.events.unlistenByKey(this.touchstartListenerKey_);
    this.touchstartListenerKey_ = null;
  }

  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.TOUCHSTART, this.map_, browserEvent);
  this.dispatchEvent(newEvent);

  this.down_ = browserEvent;
  this.dragged_ = false;
  this.dragListenerKeys_ = [
    goog.events.listen(goog.global.document,
        goog.events.EventType.MSPOINTERMOVE,
        this.handlePointerMove_, false, this),
    goog.events.listen(goog.global.document, goog.events.EventType.MSPOINTERUP,
        this.handlePointerUp_, false, this)
  ];

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
        ol.MapBrowserEvent.EventType.TOUCHMOVE, this.map_, browserEvent);
    this.dispatchEvent(newEvent);
  }
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerUp_ = function(browserEvent) {
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.TOUCHEND, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
  goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);

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
ol.MapBrowserEventHandler.prototype.handleTouchStart_ = function(browserEvent) {
  if (!goog.isNull(this.mousedownListenerKey_)) {
    // touch device detected - unregister the mousedown and pointerdown
    // listeners
    goog.events.unlistenByKey(this.mousedownListenerKey_);
    this.mousedownListenerKey_ = null;

    goog.asserts.assert(!goog.isNull(this.pointerdownListenerKey_));
    goog.events.unlistenByKey(this.pointerdownListenerKey_);
    this.pointerdownListenerKey_ = null;
  }

  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.TOUCHSTART, this.map_, browserEvent);
  this.dispatchEvent(newEvent);

  this.down_ = browserEvent;
  this.dragged_ = false;
  this.dragListenerKeys_ = [
    goog.events.listen(goog.global.document, goog.events.EventType.TOUCHMOVE,
        this.handleTouchMove_, false, this),
    goog.events.listen(goog.global.document, goog.events.EventType.TOUCHEND,
        this.handleTouchEnd_, false, this)
  ];

  // FIXME check if/when this is necessary
  browserEvent.preventDefault();
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleTouchMove_ = function(browserEvent) {
  this.dragged_ = true;
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.TOUCHMOVE, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handleTouchEnd_ = function(browserEvent) {
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.TOUCHEND, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
  goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
  if (!this.dragged_) {
    goog.asserts.assert(!goog.isNull(this.down_));
    this.emulateClick_(this.down_);
  }
};


/**
 * FIXME empty description for jsdoc
 */
ol.MapBrowserEventHandler.prototype.disposeInternal = function() {
  if (!goog.isNull(this.relayedListenerKeys_)) {
    goog.array.forEach(this.relayedListenerKeys_, goog.events.unlistenByKey);
    this.relayedListenerKeys_ = null;
  }
  if (!goog.isNull(this.mousedownListenerKey_)) {
    goog.events.unlistenByKey(this.mousedownListenerKey_);
    this.mousedownListenerKey_ = null;
  }
  if (!goog.isNull(this.pointerdownListenerKey_)) {
    goog.events.unlistenByKey(this.pointerdownListenerKey_);
    this.pointerdownListenerKey_ = null;
  }
  if (!goog.isNull(this.touchstartListenerKey_)) {
    goog.events.unlistenByKey(this.touchstartListenerKey_);
    this.touchstartListenerKey_ = null;
  }
  if (!goog.isNull(this.dragListenerKeys_)) {
    goog.array.forEach(this.dragListenerKeys_, goog.events.unlistenByKey);
    this.dragListenerKeys_ = null;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * Wrap and relay a browser event.  Note that this requires that the type
 * string for the MapBrowserEvent matches the BrowserEvent type.
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.relayEvent_ = function(browserEvent) {
  this.dispatchEvent(new ol.MapBrowserEvent(
      browserEvent.type, this.map_, browserEvent));
};


/**
 * Constants for event names.
 * @enum {string}
 */
ol.MapBrowserEvent.EventType = {
  CLICK: goog.events.EventType.CLICK,
  DBLCLICK: goog.events.EventType.DBLCLICK,
  MOUSEMOVE: goog.events.EventType.MOUSEMOVE,
  DOWN: 'down',
  DRAGSTART: 'dragstart',
  DRAG: 'drag',
  DRAGEND: 'dragend',
  SINGLECLICK: 'singleclick',
  TOUCHSTART: goog.events.EventType.TOUCHSTART,
  TOUCHMOVE: goog.events.EventType.TOUCHMOVE,
  TOUCHEND: goog.events.EventType.TOUCHEND
};
