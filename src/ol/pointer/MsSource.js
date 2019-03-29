/**
 * @module ol/pointer/MsSource
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

import EventSource from './EventSource.js';


/**
 * @const
 * @type {Array<string>}
 */
const POINTER_TYPES = [
  '',
  'unavailable',
  'touch',
  'pen',
  'mouse'
];

/**
 * Handler for `msPointerDown`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msPointerDown(inEvent) {
  this.pointerMap[inEvent.pointerId.toString()] = inEvent;
  const e = this.prepareEvent_(inEvent);
  this.dispatcher.down(e, inEvent);
}

/**
 * Handler for `msPointerMove`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msPointerMove(inEvent) {
  const e = this.prepareEvent_(inEvent);
  this.dispatcher.move(e, inEvent);
}

/**
 * Handler for `msPointerUp`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msPointerUp(inEvent) {
  const e = this.prepareEvent_(inEvent);
  this.dispatcher.up(e, inEvent);
  this.cleanup(inEvent.pointerId);
}

/**
 * Handler for `msPointerOut`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msPointerOut(inEvent) {
  const e = this.prepareEvent_(inEvent);
  this.dispatcher.leaveOut(e, inEvent);
}

/**
 * Handler for `msPointerOver`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msPointerOver(inEvent) {
  const e = this.prepareEvent_(inEvent);
  this.dispatcher.enterOver(e, inEvent);
}

/**
 * Handler for `msPointerCancel`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msPointerCancel(inEvent) {
  const e = this.prepareEvent_(inEvent);
  this.dispatcher.cancel(e, inEvent);
  this.cleanup(inEvent.pointerId);
}

/**
 * Handler for `msLostPointerCapture`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msLostPointerCapture(inEvent) {
  const e = this.dispatcher.makeEvent('lostpointercapture', inEvent, inEvent);
  this.dispatcher.dispatchEvent(e);
}

/**
 * Handler for `msGotPointerCapture`.
 *
 * @this {MsSource}
 * @param {MSPointerEvent} inEvent The in event.
 */
function msGotPointerCapture(inEvent) {
  const e = this.dispatcher.makeEvent('gotpointercapture', inEvent, inEvent);
  this.dispatcher.dispatchEvent(e);
}

class MsSource extends EventSource {

  /**
   * @param {import("./PointerEventHandler.js").default} dispatcher Event handler.
   */
  constructor(dispatcher) {
    const mapping = {
      'MSPointerDown': msPointerDown,
      'MSPointerMove': msPointerMove,
      'MSPointerUp': msPointerUp,
      'MSPointerOut': msPointerOut,
      'MSPointerOver': msPointerOver,
      'MSPointerCancel': msPointerCancel,
      'MSGotPointerCapture': msGotPointerCapture,
      'MSLostPointerCapture': msLostPointerCapture
    };
    super(dispatcher, mapping);

    /**
     * @const
     * @type {!Object<string, MSPointerEvent|Object>}
     */
    this.pointerMap = dispatcher.pointerMap;
  }

  /**
   * Creates a copy of the original event that will be used
   * for the fake pointer event.
   *
   * @private
   * @param {MSPointerEvent} inEvent The in event.
   * @return {Object} The copied event.
   */
  prepareEvent_(inEvent) {
    /** @type {MSPointerEvent|Object} */
    let e = inEvent;
    if (typeof inEvent.pointerType === 'number') {
      e = this.dispatcher.cloneEvent(inEvent, inEvent);
      e.pointerType = POINTER_TYPES[inEvent.pointerType];
    }

    return e;
  }

  /**
   * Remove this pointer from the list of active pointers.
   * @param {number} pointerId Pointer identifier.
   */
  cleanup(pointerId) {
    delete this.pointerMap[pointerId.toString()];
  }

}

export default MsSource;
