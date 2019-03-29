/**
 * @module ol/pointer/MouseSource
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
 * @type {number}
 */
export const POINTER_ID = 1;


/**
 * @type {string}
 */
export const POINTER_TYPE = 'mouse';


/**
 * Radius around touchend that swallows mouse events.
 *
 * @type {number}
 */
const DEDUP_DIST = 25;

/**
 * Handler for `mousedown`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mousedown(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    // TODO(dfreedman) workaround for some elements not sending mouseup
    // http://crbug/149091
    if (POINTER_ID.toString() in this.pointerMap) {
      this.cancel(inEvent);
    }
    const e = prepareEvent(inEvent, this.dispatcher);
    this.pointerMap[POINTER_ID.toString()] = inEvent;
    this.dispatcher.down(e, inEvent);
  }
}

/**
 * Handler for `mousemove`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mousemove(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    const e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.move(e, inEvent);
  }
}

/**
 * Handler for `mouseup`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mouseup(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    const p = this.pointerMap[POINTER_ID.toString()];

    if (p && p.button === inEvent.button) {
      const e = prepareEvent(inEvent, this.dispatcher);
      this.dispatcher.up(e, inEvent);
      this.cleanupMouse();
    }
  }
}

/**
 * Handler for `mouseover`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mouseover(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    const e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.enterOver(e, inEvent);
  }
}

/**
 * Handler for `mouseout`.
 *
 * @this {MouseSource}
 * @param {MouseEvent} inEvent The in event.
 */
function mouseout(inEvent) {
  if (!this.isEventSimulatedFromTouch_(inEvent)) {
    const e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.leaveOut(e, inEvent);
  }
}


class MouseSource extends EventSource {

  /**
   * @param {import("./PointerEventHandler.js").default} dispatcher Event handler.
   */
  constructor(dispatcher) {
    const mapping = {
      'mousedown': mousedown,
      'mousemove': mousemove,
      'mouseup': mouseup,
      'mouseover': mouseover,
      'mouseout': mouseout
    };
    super(dispatcher, mapping);

    /**
     * @const
     * @type {!Object<string, Event|Object>}
     */
    this.pointerMap = dispatcher.pointerMap;

    /**
     * @const
     * @type {Array<import("../pixel.js").Pixel>}
     */
    this.lastTouches = [];
  }

  /**
   * Detect if a mouse event was simulated from a touch by
   * checking if previously there was a touch event at the
   * same position.
   *
   * FIXME - Known problem with the native Android browser on
   * Samsung GT-I9100 (Android 4.1.2):
   * In case the page is scrolled, this function does not work
   * correctly when a canvas is used (WebGL or canvas renderer).
   * Mouse listeners on canvas elements (for this browser), create
   * two mouse events: One 'good' and one 'bad' one (on other browsers or
   * when a div is used, there is only one event). For the 'bad' one,
   * clientX/clientY and also pageX/pageY are wrong when the page
   * is scrolled. Because of that, this function can not detect if
   * the events were simulated from a touch event. As result, a
   * pointer event at a wrong position is dispatched, which confuses
   * the map interactions.
   * It is unclear, how one can get the correct position for the event
   * or detect that the positions are invalid.
   *
   * @private
   * @param {MouseEvent} inEvent The in event.
   * @return {boolean} True, if the event was generated by a touch.
   */
  isEventSimulatedFromTouch_(inEvent) {
    const lts = this.lastTouches;
    const x = inEvent.clientX;
    const y = inEvent.clientY;
    for (let i = 0, l = lts.length, t; i < l && (t = lts[i]); i++) {
      // simulated mouse events will be swallowed near a primary touchend
      const dx = Math.abs(x - t[0]);
      const dy = Math.abs(y - t[1]);
      if (dx <= DEDUP_DIST && dy <= DEDUP_DIST) {
        return true;
      }
    }
    return false;
  }

  /**
   * Dispatches a `pointercancel` event.
   *
   * @param {Event} inEvent The in event.
   */
  cancel(inEvent) {
    const e = prepareEvent(inEvent, this.dispatcher);
    this.dispatcher.cancel(e, inEvent);
    this.cleanupMouse();
  }

  /**
   * Remove the mouse from the list of active pointers.
   */
  cleanupMouse() {
    delete this.pointerMap[POINTER_ID.toString()];
  }
}


/**
 * Creates a copy of the original event that will be used
 * for the fake pointer event.
 *
 * @param {Event} inEvent The in event.
 * @param {import("./PointerEventHandler.js").default} dispatcher Event handler.
 * @return {Object} The copied event.
 */
export function prepareEvent(inEvent, dispatcher) {
  const e = dispatcher.cloneEvent(inEvent, inEvent);

  // forward mouse preventDefault
  const pd = e.preventDefault;
  e.preventDefault = function() {
    inEvent.preventDefault();
    pd();
  };

  e.pointerId = POINTER_ID;
  e.isPrimary = true;
  e.pointerType = POINTER_TYPE;

  return e;
}


export default MouseSource;
