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

goog.provide('ol.pointer.PointerEventHandler');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.events.EventTarget');

goog.require('ol.has');
goog.require('ol.pointer.EventType');
goog.require('ol.pointer.MouseSource');
goog.require('ol.pointer.MsSource');
goog.require('ol.pointer.NativeSource');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.pointer.TouchSource');


/**
 * @constructor
 * @extends {ol.events.EventTarget}
 * @param {Element|HTMLDocument} element Viewport element.
 */
ol.pointer.PointerEventHandler = function(element) {
  ol.events.EventTarget.call(this);

  /**
   * @const
   * @private
   * @type {Element|HTMLDocument}
   */
  this.element_ = element;

  /**
   * @const
   * @type {!Object.<string, Event|Object>}
   */
  this.pointerMap = {};

  /**
   * @type {Object.<string, function(Event)>}
   * @private
   */
  this.eventMap_ = {};

  /**
   * @type {Array.<ol.pointer.EventSource>}
   * @private
   */
  this.eventSourceList_ = [];

  this.registerSources();
};
ol.inherits(ol.pointer.PointerEventHandler, ol.events.EventTarget);


/**
 * Set up the event sources (mouse, touch and native pointers)
 * that generate pointer events.
 */
ol.pointer.PointerEventHandler.prototype.registerSources = function() {
  if (ol.has.POINTER) {
    this.registerSource('native', new ol.pointer.NativeSource(this));
  } else if (ol.has.MSPOINTER) {
    this.registerSource('ms', new ol.pointer.MsSource(this));
  } else {
    var mouseSource = new ol.pointer.MouseSource(this);
    this.registerSource('mouse', mouseSource);

    if (ol.has.TOUCH) {
      this.registerSource('touch',
          new ol.pointer.TouchSource(this, mouseSource));
    }
  }

  // register events on the viewport element
  this.register_();
};


/**
 * Add a new event source that will generate pointer events.
 *
 * @param {string} name A name for the event source
 * @param {ol.pointer.EventSource} source The source event.
 */
ol.pointer.PointerEventHandler.prototype.registerSource = function(name, source) {
  var s = source;
  var newEvents = s.getEvents();

  if (newEvents) {
    newEvents.forEach(function(e) {
      var handler = s.getHandlerForEvent(e);

      if (handler) {
        this.eventMap_[e] = handler.bind(s);
      }
    }, this);
    this.eventSourceList_.push(s);
  }
};


/**
 * Set up the events for all registered event sources.
 * @private
 */
ol.pointer.PointerEventHandler.prototype.register_ = function() {
  var l = this.eventSourceList_.length;
  var eventSource;
  for (var i = 0; i < l; i++) {
    eventSource = this.eventSourceList_[i];
    this.addEvents_(eventSource.getEvents());
  }
};


/**
 * Remove all registered events.
 * @private
 */
ol.pointer.PointerEventHandler.prototype.unregister_ = function() {
  var l = this.eventSourceList_.length;
  var eventSource;
  for (var i = 0; i < l; i++) {
    eventSource = this.eventSourceList_[i];
    this.removeEvents_(eventSource.getEvents());
  }
};


/**
 * Calls the right handler for a new event.
 * @private
 * @param {Event} inEvent Browser event.
 */
ol.pointer.PointerEventHandler.prototype.eventHandler_ = function(inEvent) {
  var type = inEvent.type;
  var handler = this.eventMap_[type];
  if (handler) {
    handler(inEvent);
  }
};


/**
 * Setup listeners for the given events.
 * @private
 * @param {Array.<string>} events List of events.
 */
ol.pointer.PointerEventHandler.prototype.addEvents_ = function(events) {
  events.forEach(function(eventName) {
    ol.events.listen(this.element_, eventName, this.eventHandler_, this);
  }, this);
};


/**
 * Unregister listeners for the given events.
 * @private
 * @param {Array.<string>} events List of events.
 */
ol.pointer.PointerEventHandler.prototype.removeEvents_ = function(events) {
  events.forEach(function(e) {
    ol.events.unlisten(this.element_, e, this.eventHandler_, this);
  }, this);
};


/**
 * Returns a snapshot of inEvent, with writable properties.
 *
 * @param {Event} event Browser event.
 * @param {Event|Touch} inEvent An event that contains
 *    properties to copy.
 * @return {Object} An object containing shallow copies of
 *    `inEvent`'s properties.
 */
ol.pointer.PointerEventHandler.prototype.cloneEvent = function(event, inEvent) {
  var eventCopy = {}, p;
  for (var i = 0, ii = ol.pointer.PointerEventHandler.CLONE_PROPS.length; i < ii; i++) {
    p = ol.pointer.PointerEventHandler.CLONE_PROPS[i][0];
    eventCopy[p] = event[p] || inEvent[p] || ol.pointer.PointerEventHandler.CLONE_PROPS[i][1];
  }

  return eventCopy;
};


// EVENTS


/**
 * Triggers a 'pointerdown' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.down = function(data, event) {
  this.fireEvent(ol.pointer.EventType.POINTERDOWN, data, event);
};


/**
 * Triggers a 'pointermove' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.move = function(data, event) {
  this.fireEvent(ol.pointer.EventType.POINTERMOVE, data, event);
};


/**
 * Triggers a 'pointerup' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.up = function(data, event) {
  this.fireEvent(ol.pointer.EventType.POINTERUP, data, event);
};


/**
 * Triggers a 'pointerenter' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.enter = function(data, event) {
  data.bubbles = false;
  this.fireEvent(ol.pointer.EventType.POINTERENTER, data, event);
};


/**
 * Triggers a 'pointerleave' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.leave = function(data, event) {
  data.bubbles = false;
  this.fireEvent(ol.pointer.EventType.POINTERLEAVE, data, event);
};


/**
 * Triggers a 'pointerover' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.over = function(data, event) {
  data.bubbles = true;
  this.fireEvent(ol.pointer.EventType.POINTEROVER, data, event);
};


/**
 * Triggers a 'pointerout' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.out = function(data, event) {
  data.bubbles = true;
  this.fireEvent(ol.pointer.EventType.POINTEROUT, data, event);
};


/**
 * Triggers a 'pointercancel' event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.cancel = function(data, event) {
  this.fireEvent(ol.pointer.EventType.POINTERCANCEL, data, event);
};


/**
 * Triggers a combination of 'pointerout' and 'pointerleave' events.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.leaveOut = function(data, event) {
  this.out(data, event);
  if (!this.contains_(data.target, data.relatedTarget)) {
    this.leave(data, event);
  }
};


/**
 * Triggers a combination of 'pointerover' and 'pointerevents' events.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.enterOver = function(data, event) {
  this.over(data, event);
  if (!this.contains_(data.target, data.relatedTarget)) {
    this.enter(data, event);
  }
};


/**
 * @private
 * @param {Element} container The container element.
 * @param {Element} contained The contained element.
 * @return {boolean} Returns true if the container element
 *   contains the other element.
 */
ol.pointer.PointerEventHandler.prototype.contains_ = function(container, contained) {
  if (!container || !contained) {
    return false;
  }
  return container.contains(contained);
};


// EVENT CREATION AND TRACKING
/**
 * Creates a new Event of type `inType`, based on the information in
 * `data`.
 *
 * @param {string} inType A string representing the type of event to create.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 * @return {ol.pointer.PointerEvent} A PointerEvent of type `inType`.
 */
ol.pointer.PointerEventHandler.prototype.makeEvent = function(inType, data, event) {
  return new ol.pointer.PointerEvent(inType, event, data);
};


/**
 * Make and dispatch an event in one call.
 * @param {string} inType A string representing the type of event.
 * @param {Object} data Pointer event data.
 * @param {Event} event The event.
 */
ol.pointer.PointerEventHandler.prototype.fireEvent = function(inType, data, event) {
  var e = this.makeEvent(inType, data, event);
  this.dispatchEvent(e);
};


/**
 * Creates a pointer event from a native pointer event
 * and dispatches this event.
 * @param {Event} event A platform event with a target.
 */
ol.pointer.PointerEventHandler.prototype.fireNativeEvent = function(event) {
  var e = this.makeEvent(event.type, event, event);
  this.dispatchEvent(e);
};


/**
 * Wrap a native mouse event into a pointer event.
 * This proxy method is required for the legacy IE support.
 * @param {string} eventType The pointer event type.
 * @param {Event} event The event.
 * @return {ol.pointer.PointerEvent} The wrapped event.
 */
ol.pointer.PointerEventHandler.prototype.wrapMouseEvent = function(eventType, event) {
  var pointerEvent = this.makeEvent(
      eventType, ol.pointer.MouseSource.prepareEvent(event, this), event);
  return pointerEvent;
};


/**
 * @inheritDoc
 */
ol.pointer.PointerEventHandler.prototype.disposeInternal = function() {
  this.unregister_();
  ol.events.EventTarget.prototype.disposeInternal.call(this);
};


/**
 * Properties to copy when cloning an event, with default values.
 * @type {Array.<Array>}
 */
ol.pointer.PointerEventHandler.CLONE_PROPS = [
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
