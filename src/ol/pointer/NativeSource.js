/**
 * @module ol/pointer/NativeSource
 */
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

import {inherits} from '../util.js';
import EventSource from '../pointer/EventSource.js';

/**
 * @param {module:ol/pointer/PointerEventHandler} dispatcher Event handler.
 * @constructor
 * @extends {module:ol/pointer/EventSource}
 */
const NativeSource = function(dispatcher) {
  const mapping = {
    'pointerdown': this.pointerDown,
    'pointermove': this.pointerMove,
    'pointerup': this.pointerUp,
    'pointerout': this.pointerOut,
    'pointerover': this.pointerOver,
    'pointercancel': this.pointerCancel,
    'gotpointercapture': this.gotPointerCapture,
    'lostpointercapture': this.lostPointerCapture
  };
  EventSource.call(this, dispatcher, mapping);
};

inherits(NativeSource, EventSource);


/**
 * Handler for `pointerdown`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.pointerDown = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointermove`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.pointerMove = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointerup`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.pointerUp = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointerout`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.pointerOut = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointerover`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.pointerOver = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `pointercancel`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.pointerCancel = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `lostpointercapture`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.lostPointerCapture = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};


/**
 * Handler for `gotpointercapture`.
 *
 * @param {Event} inEvent The in event.
 */
NativeSource.prototype.gotPointerCapture = function(inEvent) {
  this.dispatcher.fireNativeEvent(inEvent);
};
export default NativeSource;
