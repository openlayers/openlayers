/**
 * @module ol/pointer/PointerEventHandler
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

import {listen, unlisten} from '../events.js';
import EventTarget from '../events/Target.js';
import {POINTER, MSPOINTER, TOUCH} from '../has.js';
import PointerEventType from './EventType.js';
import MouseSource, {prepareEvent as prepareMouseEvent} from './MouseSource.js';
import MsSource from './MsSource.js';
import NativeSource from './NativeSource.js';
import PointerEvent from './PointerEvent.js';
import TouchSource from './TouchSource.js';


/**
 * Properties to copy when cloning an event, with default values.
 * @type {Array<Array>}
 */
const CLONE_PROPS = [
  // MouseEvent
  ['bubbles', false],
  ['cancelable', false],
  ['view', null],
  ['detail', null],
  ['screenX', 0],
  ['screenY', 0],
  ['clientX', 0],
  ['clientY', 0],
  ['ctrlKey', false],
  ['altKey', false],
  ['shiftKey', false],
  ['metaKey', false],
  ['button', 0],
  ['relatedTarget', null],
  // DOM Level 3
  ['buttons', 0],
  // PointerEvent
  ['pointerId', 0],
  ['width', 0],
  ['height', 0],
  ['pressure', 0],
  ['tiltX', 0],
  ['tiltY', 0],
  ['pointerType', ''],
  ['hwTimestamp', 0],
  ['isPrimary', false],
  // event instance
  ['type', ''],
  ['target', null],
  ['currentTarget', null],
  ['which', 0]
];


class PointerEventHandler extends EventTarget {

  /**
   * @param {Element|HTMLDocument} element Viewport element.
   */
  constructor(element) {
    super();

    /**
     * @const
     * @private
     * @type {Element|HTMLDocument}
     */
    this.element_ = element;

    /**
     * @const
     * @type {!Object<string, Event|Object>}
     */
    this.pointerMap = {};

    /**
     * @type {Object<string, function(Event): void>}
     * @private
     */
    this.eventMap_ = {};

    /**
     * @type {Array<import("./EventSource.js").default>}
     * @private
     */
    this.eventSourceList_ = [];

    this.registerSources();
  }

  /**
   * Set up the event sources (mouse, touch and native pointers)
   * that generate pointer events.
   */
  registerSources() {
    if (POINTER) {
      this.registerSource('native', new NativeSource(this));
    } else if (MSPOINTER) {
      this.registerSource('ms', new MsSource(this));
    } else {
      const mouseSource = new MouseSource(this);
      this.registerSource('mouse', mouseSource);

      if (TOUCH) {
        this.registerSource('touch', new TouchSource(this, mouseSource));
      }
    }

    // register events on the viewport element
    this.register_();
  }

  /**
   * Add a new event source that will generate pointer events.
   *
   * @param {string} name A name for the event source
   * @param {import("./EventSource.js").default} source The source event.
   */
  registerSource(name, source) {
    const s = source;
    const newEvents = s.getEvents();

    if (newEvents) {
      newEvents.forEach(function(e) {
        const handler = s.getHandlerForEvent(e);

        if (handler) {
          this.eventMap_[e] = handler.bind(s);
        }
      }.bind(this));
      this.eventSourceList_.push(s);
    }
  }

  /**
   * Set up the events for all registered event sources.
   * @private
   */
  register_() {
    const l = this.eventSourceList_.length;
    for (let i = 0; i < l; i++) {
      const eventSource = this.eventSourceList_[i];
      this.addEvents_(eventSource.getEvents());
    }
  }

  /**
   * Remove all registered events.
   * @private
   */
  unregister_() {
    const l = this.eventSourceList_.length;
    for (let i = 0; i < l; i++) {
      const eventSource = this.eventSourceList_[i];
      this.removeEvents_(eventSource.getEvents());
    }
  }

  /**
   * Calls the right handler for a new event.
   * @private
   * @param {Event} inEvent Browser event.
   */
  eventHandler_(inEvent) {
    const type = inEvent.type;
    const handler = this.eventMap_[type];
    if (handler) {
      handler(inEvent);
    }
  }

  /**
   * Setup listeners for the given events.
   * @private
   * @param {Array<string>} events List of events.
   */
  addEvents_(events) {
    events.forEach(function(eventName) {
      listen(this.element_, eventName, this.eventHandler_, this);
    }.bind(this));
  }

  /**
   * Unregister listeners for the given events.
   * @private
   * @param {Array<string>} events List of events.
   */
  removeEvents_(events) {
    events.forEach(function(e) {
      unlisten(this.element_, e, this.eventHandler_, this);
    }.bind(this));
  }

  /**
   * Returns a snapshot of inEvent, with writable properties.
   *
   * @param {Event} event Browser event.
   * @param {Event|Touch} inEvent An event that contains
   *    properties to copy.
   * @return {Object} An object containing shallow copies of
   *    `inEvent`'s properties.
   */
  cloneEvent(event, inEvent) {
    const eventCopy = {};
    for (let i = 0, ii = CLONE_PROPS.length; i < ii; i++) {
      const p = CLONE_PROPS[i][0];
      eventCopy[p] = event[p] || inEvent[p] || CLONE_PROPS[i][1];
    }

    return eventCopy;
  }

  // EVENTS


  /**
   * Triggers a 'pointerdown' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  down(data, event) {
    this.fireEvent(PointerEventType.POINTERDOWN, data, event);
  }

  /**
   * Triggers a 'pointermove' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  move(data, event) {
    this.fireEvent(PointerEventType.POINTERMOVE, data, event);
  }

  /**
   * Triggers a 'pointerup' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  up(data, event) {
    this.fireEvent(PointerEventType.POINTERUP, data, event);
  }

  /**
   * Triggers a 'pointerenter' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  enter(data, event) {
    data.bubbles = false;
    this.fireEvent(PointerEventType.POINTERENTER, data, event);
  }

  /**
   * Triggers a 'pointerleave' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  leave(data, event) {
    data.bubbles = false;
    this.fireEvent(PointerEventType.POINTERLEAVE, data, event);
  }

  /**
   * Triggers a 'pointerover' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  over(data, event) {
    data.bubbles = true;
    this.fireEvent(PointerEventType.POINTEROVER, data, event);
  }

  /**
   * Triggers a 'pointerout' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  out(data, event) {
    data.bubbles = true;
    this.fireEvent(PointerEventType.POINTEROUT, data, event);
  }

  /**
   * Triggers a 'pointercancel' event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  cancel(data, event) {
    this.fireEvent(PointerEventType.POINTERCANCEL, data, event);
  }

  /**
   * Triggers a combination of 'pointerout' and 'pointerleave' events.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  leaveOut(data, event) {
    this.out(data, event);
    if (!this.contains_(data.target, data.relatedTarget)) {
      this.leave(data, event);
    }
  }

  /**
   * Triggers a combination of 'pointerover' and 'pointerevents' events.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  enterOver(data, event) {
    this.over(data, event);
    if (!this.contains_(data.target, data.relatedTarget)) {
      this.enter(data, event);
    }
  }

  /**
   * @private
   * @param {Element} container The container element.
   * @param {Element} contained The contained element.
   * @return {boolean} Returns true if the container element
   *   contains the other element.
   */
  contains_(container, contained) {
    if (!container || !contained) {
      return false;
    }
    return container.contains(contained);
  }

  // EVENT CREATION AND TRACKING
  /**
   * Creates a new Event of type `inType`, based on the information in
   * `data`.
   *
   * @param {string} inType A string representing the type of event to create.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   * @return {PointerEvent} A PointerEvent of type `inType`.
   */
  makeEvent(inType, data, event) {
    return new PointerEvent(inType, event, data);
  }

  /**
   * Make and dispatch an event in one call.
   * @param {string} inType A string representing the type of event.
   * @param {Object} data Pointer event data.
   * @param {Event} event The event.
   */
  fireEvent(inType, data, event) {
    const e = this.makeEvent(inType, data, event);
    this.dispatchEvent(e);
  }

  /**
   * Creates a pointer event from a native pointer event
   * and dispatches this event.
   * @param {Event} event A platform event with a target.
   */
  fireNativeEvent(event) {
    const e = this.makeEvent(event.type, event, event);
    this.dispatchEvent(e);
  }

  /**
   * Wrap a native mouse event into a pointer event.
   * This proxy method is required for the legacy IE support.
   * @param {string} eventType The pointer event type.
   * @param {Event} event The event.
   * @return {PointerEvent} The wrapped event.
   */
  wrapMouseEvent(eventType, event) {
    const pointerEvent = this.makeEvent(
      eventType, prepareMouseEvent(event, this), event);
    return pointerEvent;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.unregister_();
    super.disposeInternal();
  }
}

export default PointerEventHandler;
