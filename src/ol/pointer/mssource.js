goog.provide('ol.pointer.MsSource');

goog.require('ol.pointer.EventSource');



/**
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @constructor
 * @extends {ol.pointer.EventSource}
 */
ol.pointer.MsSource = function(dispatcher) {
  goog.base(this, dispatcher);

  this.pointerMap = dispatcher.pointerMap;

  this.HAS_BITMAP_TYPE = this.hasBitmapType();

  this.events = [
    'MSPointerDown',
    'MSPointerMove',
    'MSPointerUp',
    'MSPointerOut',
    'MSPointerOver',
    'MSPointerCancel',
    'MSGotPointerCapture',
    'MSLostPointerCapture'
  ];
  this.mapping = {
    'MSPointerDown': this.msPointerDown,
    'MSPointerMove': this.msPointerMove,
    'MSPointerUp': this.msPointerUp,
    'MSPointerOut': this.msPointerOut,
    'MSPointerOver': this.msPointerOver,
    'MSPointerCancel': this.msPointerCancel,
    'MSGotPointerCapture': this.msGotPointerCapture,
    'MSLostPointerCapture': this.msLostPointerCapture
  };

  this.POINTER_TYPES = [
    '',
    'unavailable',
    'touch',
    'pen',
    'mouse'
  ];
};
goog.inherits(ol.pointer.MsSource, ol.pointer.EventSource);


/** @inheritDoc */
ol.pointer.MsSource.prototype.getEvents = function() {
  return this.events;
};


/** @inheritDoc */
ol.pointer.MsSource.prototype.getMapping = function() {
  return this.mapping;
};


/**
 * @suppress {missingProperties}
 * @return {boolean}
 */
ol.pointer.MsSource.prototype.hasBitmapType = function() {
  return window['MSPointerEvent'] &&
      typeof window['MSPointerEvent']['MSPOINTER_TYPE_MOUSE'] === 'number';
};


/**
 * Creates a copy of the original event that will be used
 * for the fake pointer event.
 *
 * @private
 * @param {goog.events.BrowserEvent} inEvent
 * @return {Object}
 */
ol.pointer.MsSource.prototype.prepareEvent_ = function(inEvent) {
  var e = inEvent;
  if (this.HAS_BITMAP_TYPE) {
    e = this.dispatcher.cloneEvent(inEvent);
    e.pointerType = this.POINTER_TYPES[inEvent.pointerType];
  }

  return e;
};


/**
 * Remove the mouse from the list of active pointers.
 * @param {number} pointerId
 */
ol.pointer.MsSource.prototype.cleanup = function(pointerId) {
  this.pointerMap.remove(pointerId);
};


/**
 * Handler for `msPointerDown`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerDown = function(inEvent) {
  this.pointerMap.set(inEvent.pointerId, inEvent);
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.down(e);
};


/**
 * Handler for `msPointerMove`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerMove = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.move(e);
};


/**
 * Handler for `msPointerUp`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerUp = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.up(e);
  this.cleanup(inEvent.pointerId);
};


/**
 * Handler for `msPointerOut`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerOut = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.leaveOut(e);
};


/**
 * Handler for `msPointerOver`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerOver = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.enterOver(e);
};


/**
 * Handler for `msPointerCancel`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerCancel = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.cancel(e);
  this.cleanup(inEvent.pointerId);
};


/**
 * Handler for `msLostPointerCapture`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msLostPointerCapture = function(inEvent) {
  var e = this.dispatcher.makeEvent('lostpointercapture', inEvent);
  this.dispatcher.dispatchEvent(e);
};


/**
 * Handler for `msGotPointerCapture`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msGotPointerCapture = function(inEvent) {
  var e = this.dispatcher.makeEvent('gotpointercapture', inEvent);
  this.dispatcher.dispatchEvent(e);
};
