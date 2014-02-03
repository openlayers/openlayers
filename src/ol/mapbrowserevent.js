goog.provide('ol.MapBrowserEvent');
goog.provide('ol.MapBrowserEvent.EventType');
goog.provide('ol.MapBrowserEventHandler');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');

goog.require('ol.pointer.PointerEventHandler');
goog.require('ol.Coordinate');
goog.require('ol.MapEvent');
goog.require('ol.Pixel');



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

  /**
   * @type {goog.events.BrowserEvent}
   * @private
   */
  this.down_ = null;

  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
    /**
     * @type {goog.events.Key}
     * @private
     */
    this.ieDblclickListenerKey_ = null;
  }

  /**
   * @type {ol.pointer.PointerEventHandler}
   * @private
   */
  this.PointerEventHandler_ = null;

  var element = this.map_.getViewport();

  this.pointerEventHandler_ = new ol.pointer.PointerEventHandler(element);
  this.pointerdownListenerKey_ = goog.events.listen(this.pointerEventHandler_,
      ol.pointer.EventType.POINTERDOWN,
      this.handlePointerDown_, false, this);

  this.relayedListenerKeys_ = [
    goog.events.listen(this.pointerEventHandler_,
        ol.pointer.EventType.POINTERMOVE,
        this.relayEvent_, false, this)
  ];
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
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerUp_ = function(browserEvent) {
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
ol.MapBrowserEventHandler.prototype.handlePointerDown_ = function(browserEvent) {
  var newEvent = new ol.MapBrowserEvent(
      ol.MapBrowserEvent.EventType.DOWN, this.map_, browserEvent);
  this.dispatchEvent(newEvent);
  this.down_ = browserEvent;
  this.dragged_ = false;
  this.dragListenerKeys_ = [
    goog.events.listen(this.pointerEventHandler_, ol.MapBrowserEvent.EventType.POINTERMOVE,
        this.handlePointerMove_, false, this),
    goog.events.listen(this.pointerEventHandler_, ol.MapBrowserEvent.EventType.POINTERUP,
        this.handlePointerUp_, false, this)
  ];
  // prevent browser image dragging with the dom renderer
  browserEvent.preventDefault();
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.MapBrowserEventHandler.prototype.handlePointerMove_ = function(browserEvent) {
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
  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE &&
      !goog.isNull(this.ieDblclickListenerKey_)) {
    goog.events.unlistenByKey(this.ieDblclickListenerKey_);
    this.ieDblclickListenerKey_ = null;
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
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  POINTERCANCEL: 'pointercancel'
};
