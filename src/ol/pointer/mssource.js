// Based on https://github.com/Polymer/PointerEvents

// Copyright (c) 2013 The Polymer Authors. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
// * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
// * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

goog.provide('ol.pointer.MsSource');

goog.require('ol.pointer.EventSource');



/**
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @constructor
 * @extends {ol.pointer.EventSource}
 */
ol.pointer.MsSource = function(dispatcher) {
  var mapping = {
    'MSPointerDown': this.msPointerDown,
    'MSPointerMove': this.msPointerMove,
    'MSPointerUp': this.msPointerUp,
    'MSPointerOut': this.msPointerOut,
    'MSPointerOver': this.msPointerOver,
    'MSPointerCancel': this.msPointerCancel,
    'MSGotPointerCapture': this.msGotPointerCapture,
    'MSLostPointerCapture': this.msLostPointerCapture
  };
  goog.base(this, dispatcher, mapping);

  /**
   * @const
   * @type {Object.<string, goog.events.BrowserEvent|Object>}
   */
  this.pointerMap = dispatcher.pointerMap;

  /**
   * @const
   * @type {Array.<string>}
   */
  this.POINTER_TYPES = [
    '',
    'unavailable',
    'touch',
    'pen',
    'mouse'
  ];
};
goog.inherits(ol.pointer.MsSource, ol.pointer.EventSource);


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
  if (goog.isNumber(inEvent.getBrowserEvent().pointerType)) {
    e = this.dispatcher.cloneEvent(inEvent, inEvent.getBrowserEvent());
    e.pointerType = this.POINTER_TYPES[inEvent.getBrowserEvent().pointerType];
  }

  return e;
};


/**
 * Remove this pointer from the list of active pointers.
 * @param {number} pointerId
 */
ol.pointer.MsSource.prototype.cleanup = function(pointerId) {
  delete this.pointerMap[pointerId.toString()];
};


/**
 * Handler for `msPointerDown`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerDown = function(inEvent) {
  this.pointerMap[inEvent.getBrowserEvent().pointerId.toString()] = inEvent;
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.down(e, inEvent);
};


/**
 * Handler for `msPointerMove`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerMove = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.move(e, inEvent);
};


/**
 * Handler for `msPointerUp`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerUp = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.up(e, inEvent);
  this.cleanup(inEvent.getBrowserEvent().pointerId);
};


/**
 * Handler for `msPointerOut`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerOut = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.leaveOut(e, inEvent);
};


/**
 * Handler for `msPointerOver`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerOver = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.enterOver(e, inEvent);
};


/**
 * Handler for `msPointerCancel`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msPointerCancel = function(inEvent) {
  var e = this.prepareEvent_(inEvent);
  this.dispatcher.cancel(e, inEvent);
  this.cleanup(inEvent.getBrowserEvent().pointerId);
};


/**
 * Handler for `msLostPointerCapture`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msLostPointerCapture = function(inEvent) {
  var e = this.dispatcher.makeEvent('lostpointercapture',
      inEvent.getBrowserEvent(), inEvent);
  this.dispatcher.dispatchEvent(e);
};


/**
 * Handler for `msGotPointerCapture`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.MsSource.prototype.msGotPointerCapture = function(inEvent) {
  var e = this.dispatcher.makeEvent('gotpointercapture',
      inEvent.getBrowserEvent(), inEvent);
  this.dispatcher.dispatchEvent(e);
};
