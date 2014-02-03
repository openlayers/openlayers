goog.provide('ol.pointer.NativeSource');

goog.require('ol.pointer.EventSource');



/**
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @constructor
 * @extends {ol.pointer.EventSource}
 */
ol.pointer.NativeSource = function(dispatcher) {
  goog.base(this, dispatcher);

  this.pointerMap = dispatcher.pointerMap;

  this.events = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointerout',
    'pointerover',
    'pointercancel',
    'gotpointercapture',
    'lostpointercapture'
  ];
  this.mapping = {
    'pointerdown': this.pointerDown,
    'pointermove': this.pointerMove,
    'pointerup': this.pointerUp,
    'pointerout': this.pointerOut,
    'pointerover': this.pointerOver,
    'pointercancel': this.pointerCancel,
    'gotpointercapture': this.gotPointerCapture,
    'lostpointercapture': this.lostPointerCapture
  };
};
goog.inherits(ol.pointer.NativeSource, ol.pointer.EventSource);


/** @inheritDoc */
ol.pointer.NativeSource.prototype.getEvents = function() {
  return this.events;
};


/** @inheritDoc */
ol.pointer.NativeSource.prototype.getMapping = function() {
  return this.mapping;
};


/**
 * Handler for `pointerdown`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.pointerDown = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointermove`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.pointerMove = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointerup`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.pointerUp = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointerout`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.pointerOut = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointerover`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.pointerOver = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointercancel`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.pointerCancel = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `lostpointercapture`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.lostPointerCapture = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `gotpointercapture`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.NativeSource.prototype.gotPointerCapture = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};
