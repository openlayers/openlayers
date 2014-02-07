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


goog.require('goog.debug.Console');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.structs.Map');

goog.require('ol.pointer.MouseSource');
goog.require('ol.pointer.MsSource');
goog.require('ol.pointer.NativeSource');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.pointer.TouchSource');
goog.require('ol.structs.WeakMap');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Element} element Viewport element.
 */
ol.pointer.PointerEventHandler = function(element) {
  goog.base(this);

  /**
   * @const
   * @private
   * @type {Element}
   */
  this.element_ = element;

  /**
   * @const
   * @type {goog.structs.Map}
   */
  this.pointerMap = new goog.structs.Map();


  /**
   * @const
   * @type {ol.structs.WeakMap}
   */
  this.targets = new ol.structs.WeakMap();

  /**
   * @const
   * @type {ol.structs.WeakMap}
   */
  this.handledEvents = new ol.structs.WeakMap();

  this.eventMap = {};

  // Scope objects for native events.
  // This exists for ease of testing.
  this.eventSources = {};
  this.eventSourceList = [];

  this.boundHandler_ = goog.bind(this.eventHandler_, this);

  this.registerSources();
};
goog.inherits(ol.pointer.PointerEventHandler, goog.events.EventTarget);


/**
 * Set up the event sources (mouse, touch and native pointers)
 * that generate pointer events.
 */
ol.pointer.PointerEventHandler.prototype.registerSources = function() {
  if (this.isPointerEnabled_()) {
    this.registerSource('native', new ol.pointer.NativeSource(this));
  } else if (this.isMsPointerEnabled_()) {
    this.registerSource('ms', new ol.pointer.MsSource(this));
  } else {
    var mouseSource = new ol.pointer.MouseSource(this);
    this.registerSource('mouse', mouseSource);

    if (this.isTouchDefined_()) {
      this.registerSource('touch',
          new ol.pointer.TouchSource(this, mouseSource));
    }
  }

  // register events on the viewport element
  this.register_();
};


/**
 * @private
 * @return {boolean} Returns true if the browser supports
 *    native pointer events.
 */
ol.pointer.PointerEventHandler.prototype.isPointerEnabled_ = function() {
  /* TODO navigation.pointerEnabled is actually not part of the
   * spec: https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890#c3
   */
  return window.navigator['pointerEnabled'] !== undefined;
};


/**
 * @private
 * @return {boolean} Returns true if the browser supports
 *    ms pointer events (IE10).
 */
ol.pointer.PointerEventHandler.prototype.isMsPointerEnabled_ = function() {
  return window.navigator['msPointerEnabled'] !== undefined;
};


/**
 * @private
 * @return {boolean} Returns true if the browser supports
 *    touch events.
 */
ol.pointer.PointerEventHandler.prototype.isTouchDefined_ = function() {
  return window['ontouchstart'] !== undefined;
};


/**
 * Add a new event source that will generate pointer events.
 *
 * @param {string} name A name for the event source
 * @param {ol.pointer.EventSource} source
 */
ol.pointer.PointerEventHandler.prototype.registerSource =
    function(name, source) {
  var s = source;
  var newEvents = s.getEvents();

  if (newEvents) {
    newEvents.forEach(function(e) {
      var handler = s.getHandlerForEvent(e);

      if (handler) {
        this.eventMap[e] = goog.bind(handler, s);
      }
    }, this);
    this.eventSources[name] = s;
    this.eventSourceList.push(s);
  }
};


/**
 * @suppress {undefinedVars}
 */
ol.pointer.PointerEventHandler.prototype.log = function(obj) {
  console.log(obj);
};


/**
 * Set up the events for all registered event sources.
 * @private
 */
ol.pointer.PointerEventHandler.prototype.register_ = function() {
  var l = this.eventSourceList.length;
  for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
    this.addEvents_(es.getEvents());
  }
};


/**
 * Remove all registered events.
 * @private
 */
ol.pointer.PointerEventHandler.prototype.unregister_ = function() {
  var l = this.eventSourceList.length;
  for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
    this.removeEvents_(es.getEvents());
  }
};


/**
 * Calls the right handler for a new event.
 * @private
 * @param {goog.events.BrowserEvent} inEvent Browser event.
 */
ol.pointer.PointerEventHandler.prototype.eventHandler_ = function(inEvent) {
  // This is used to prevent multiple dispatch of pointerevents from
  // platform events. This can happen when two elements in different scopes
  // are set up to create pointer events, which is relevant to Shadow DOM.
  if (this.handledEvents['get'](inEvent)) {
    return;
  }

  var type = inEvent.type;
  var handler = this.eventMap[type];
  if (handler) {
    handler(inEvent);
  }
  this.handledEvents['set'](inEvent, true);
};


/**
 * Setup listeners for the given events.
 * @private
 * @param {Array.<string>} events List of events.
 */
ol.pointer.PointerEventHandler.prototype.addEvents_ = function(events) {
  events.forEach(function(eventName) {
    goog.events.listen(this.element_, eventName,
        this.boundHandler_);
  }, this);
};


/**
 * Unregister listeners for the given events.
 * @private
 * @param {Array.<string>} events List of events.
 */
ol.pointer.PointerEventHandler.prototype.removeEvents_ = function(events) {
  events.forEach(function(e) {
    goog.events.unlisten(this.element_, e,
        this.boundHandler_);
  }, this);
};


/**
 * Returns a snapshot of inEvent, with writable properties.
 *
 * @param {Event|Touch} inEvent An event that contains
 *    properties to copy.
 * @return {Object} An object containing shallow copies of
 *    `inEvent`'s properties.
 */
ol.pointer.PointerEventHandler.prototype.cloneEvent = function(inEvent) {
  var eventCopy = {}, p;
  for (var i = 0; i < ol.pointer.CLONE_PROPS.length; i++) {
    p = ol.pointer.CLONE_PROPS[i];
    eventCopy[p] = inEvent[p] || ol.pointer.CLONE_DEFAULTS[i];
  }

  // keep the semantics of preventDefault
  if (inEvent.preventDefault) {
    eventCopy.preventDefault = function() {
      inEvent.preventDefault();
    };
  }

  return eventCopy;
};


// EVENTS


/**
 * Triggers a 'pointerdown' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.down = function(inEvent) {
  this.fireEvent('pointerdown', inEvent);
};


/**
 * Triggers a 'pointermove' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.move = function(inEvent) {
  this.fireEvent('pointermove', inEvent);
};


/**
 * Triggers a 'pointerup' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.up = function(inEvent) {
  this.fireEvent('pointerup', inEvent);
};


/**
 * Triggers a 'pointerenter' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.enter = function(inEvent) {
  inEvent.bubbles = false;
  this.fireEvent('pointerenter', inEvent);
};


/**
 * Triggers a 'pointerleave' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.leave = function(inEvent) {
  inEvent.bubbles = false;
  this.fireEvent('pointerleave', inEvent);
};


/**
 * Triggers a 'pointerover' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.over = function(inEvent) {
  inEvent.bubbles = true;
  this.fireEvent('pointerover', inEvent);
};


/**
 * Triggers a 'pointerout' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.out = function(inEvent) {
  inEvent.bubbles = true;
  this.fireEvent('pointerout', inEvent);
};


/**
 * Triggers a 'pointercancel' event.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.cancel = function(inEvent) {
  this.fireEvent('pointercancel', inEvent);
};


/**
 * Triggers a combination of 'pointerout' and 'pointerleave' events.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.leaveOut = function(inEvent) {
  this.out(inEvent);
  if (!this.contains_(inEvent.target, inEvent.relatedTarget)) {
    this.leave(inEvent);
  }
};


/**
 * Triggers a combination of 'pointerover' and 'pointerevents' events.
 * @param {Object} inEvent
 */
ol.pointer.PointerEventHandler.prototype.enterOver = function(inEvent) {
  this.over(inEvent);
  if (!this.contains_(inEvent.target, inEvent.relatedTarget)) {
    this.enter(inEvent);
  }
};


/**
 * @private
 * @param {Element} container
 * @param {Element} contained
 * @return {boolean} Returns true if the container element
 *   contains the other element.
 */
ol.pointer.PointerEventHandler.prototype.contains_ =
    function(container, contained) {
  return container.contains(contained);
};


// EVENT CREATION AND TRACKING
/**
 * Creates a new Event of type `inType`, based on the information in
 * `inEvent`.
 *
 * @param {string} inType A string representing the type of event to create.
 * @param {Object} inEvent A platform event with a target.
 * @return {ol.pointer.PointerEvent} A PointerEvent of type `inType`.
 */
ol.pointer.PointerEventHandler.prototype.makeEvent = function(inType, inEvent) {
  // relatedTarget must be null if pointer is captured
  if (this.captureInfo) {
    inEvent.relatedTarget = null;
  }

  var e = new ol.pointer.PointerEvent(inType, inEvent);
  if (inEvent.preventDefault) {
    e.preventDefault = inEvent.preventDefault;
  }
  this.targets['set'](e, this.targets['get'](inEvent) || inEvent.target);

  return e;
};


/**
 * Make and dispatch an event in one call.
 * @param {string} inType A string representing the type of event.
 * @param {Object} inEvent A platform event with a target.
 */
ol.pointer.PointerEventHandler.prototype.fireEvent = function(inType, inEvent) {
  var e = this.makeEvent(inType, inEvent);
  var browserEvent = new goog.events.BrowserEvent(e);
  this.dispatchEvent(browserEvent);
};


/**
 * Re-fires a native pointer event.
 * @param {goog.events.BrowserEvent} nativeEvent A platform event with a target.
 */
ol.pointer.PointerEventHandler.prototype.fireNativeEvent =
    function(nativeEvent) {
  this.dispatchEvent(nativeEvent);
};


/**
 * Constants for event names.
 * @enum {string}
 */
ol.pointer.EventType = {
  POINTERMOVE: 'pointermove',
  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  POINTEROVER: 'pointerover',
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  POINTERCANCEL: 'pointercancel'
};


/**
 * List of properties to copy when cloning an event.
 * @type {Array.<string>}
 */
ol.pointer.CLONE_PROPS = [
  // MouseEvent
  'bubbles',
  'cancelable',
  'view',
  'detail',
  'screenX',
  'screenY',
  'clientX',
  'clientY',
  'ctrlKey',
  'altKey',
  'shiftKey',
  'metaKey',
  'button',
  'relatedTarget',
  // DOM Level 3
  'buttons',
  // PointerEvent
  'pointerId',
  'width',
  'height',
  'pressure',
  'tiltX',
  'tiltY',
  'pointerType',
  'hwTimestamp',
  'isPrimary',
  // event instance
  'type',
  'target',
  'currentTarget',
  'which'
];


/**
 * List of default values when cloning an event.
 */
ol.pointer.CLONE_DEFAULTS = [
  // MouseEvent
  false,
  false,
  null,
  null,
  0,
  0,
  0,
  0,
  false,
  false,
  false,
  false,
  0,
  null,
  // DOM Level 3
  0,
  // PointerEvent
  0,
  0,
  0,
  0,
  0,
  0,
  '',
  0,
  false,
  // event instance
  '',
  null,
  null,
  0
];
