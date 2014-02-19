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


goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.structs.Map');

goog.require('ol.BrowserFeature');
goog.require('ol.pointer.MouseSource');
goog.require('ol.pointer.MsSource');
goog.require('ol.pointer.NativeSource');
goog.require('ol.pointer.PointerEvent');
goog.require('ol.pointer.TouchSource');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Element|HTMLDocument} element Viewport element.
 */
ol.pointer.PointerEventHandler = function(element) {
  goog.base(this);

  /**
   * @const
   * @private
   * @type {Element|HTMLDocument}
   */
  this.element_ = element;

  /**
   * @const
   * @type {goog.structs.Map}
   */
  this.pointerMap = new goog.structs.Map();

  /**
   * @type {Object.<string, function(goog.events.BrowserEvent)>}
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
goog.inherits(ol.pointer.PointerEventHandler, goog.events.EventTarget);


/**
 * Set up the event sources (mouse, touch and native pointers)
 * that generate pointer events.
 */
ol.pointer.PointerEventHandler.prototype.registerSources = function() {
  if (ol.BrowserFeature.HAS_POINTER) {
    this.registerSource('native', new ol.pointer.NativeSource(this));
  } else if (ol.BrowserFeature.HAS_MSPOINTER) {
    this.registerSource('ms', new ol.pointer.MsSource(this));
  } else {
    var mouseSource = new ol.pointer.MouseSource(this);
    this.registerSource('mouse', mouseSource);

    if (ol.BrowserFeature.HAS_TOUCH) {
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
 * @param {ol.pointer.EventSource} source
 */
ol.pointer.PointerEventHandler.prototype.registerSource =
    function(name, source) {
  var s = source;
  var newEvents = s.getEvents();

  if (newEvents) {
    goog.array.forEach(newEvents, function(e) {
      var handler = s.getHandlerForEvent(e);

      if (handler) {
        this.eventMap_[e] = goog.bind(handler, s);
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
  for (var i = 0, es; (i < l) && (es = this.eventSourceList_[i]); i++) {
    this.addEvents_(es.getEvents());
  }
};


/**
 * Remove all registered events.
 * @private
 */
ol.pointer.PointerEventHandler.prototype.unregister_ = function() {
  var l = this.eventSourceList_.length;
  for (var i = 0, es; (i < l) && (es = this.eventSourceList_[i]); i++) {
    this.removeEvents_(es.getEvents());
  }
};


/**
 * Calls the right handler for a new event.
 * @private
 * @param {goog.events.BrowserEvent} inEvent Browser event.
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
  goog.array.forEach(events, function(eventName) {
    goog.events.listen(this.element_, eventName,
        this.eventHandler_, false, this);
  }, this);
};


/**
 * Unregister listeners for the given events.
 * @private
 * @param {Array.<string>} events List of events.
 */
ol.pointer.PointerEventHandler.prototype.removeEvents_ = function(events) {
  goog.array.forEach(events, function(e) {
    goog.events.unlisten(this.element_, e,
        this.eventHandler_, false, this);
  }, this);
};


/**
 * Returns a snapshot of inEvent, with writable properties.
 *
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {Event|Touch} inEvent An event that contains
 *    properties to copy.
 * @return {Object} An object containing shallow copies of
 *    `inEvent`'s properties.
 */
ol.pointer.PointerEventHandler.prototype.cloneEvent =
    function(browserEvent, inEvent) {
  var eventCopy = {}, p;
  for (var i = 0; i < ol.pointer.CLONE_PROPS.length; i++) {
    p = ol.pointer.CLONE_PROPS[i];
    eventCopy[p] =
        browserEvent[p] ||
        inEvent[p] ||
        ol.pointer.CLONE_DEFAULTS[i];
  }

  // keep the semantics of preventDefault
  if (browserEvent.preventDefault) {
    eventCopy.preventDefault = function() {
      browserEvent.preventDefault();
    };
  }

  return eventCopy;
};


// EVENTS


/**
 * Triggers a 'pointerdown' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.down =
    function(pointerEventData, browserEvent) {
  this.fireEvent('pointerdown', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointermove' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.move =
    function(pointerEventData, browserEvent) {
  this.fireEvent('pointermove', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointerup' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.up =
    function(pointerEventData, browserEvent) {
  this.fireEvent('pointerup', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointerenter' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.enter =
    function(pointerEventData, browserEvent) {
  pointerEventData.bubbles = false;
  this.fireEvent('pointerenter', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointerleave' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.leave =
    function(pointerEventData, browserEvent) {
  pointerEventData.bubbles = false;
  this.fireEvent('pointerleave', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointerover' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.over =
    function(pointerEventData, browserEvent) {
  pointerEventData.bubbles = true;
  this.fireEvent('pointerover', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointerout' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.out =
    function(pointerEventData, browserEvent) {
  pointerEventData.bubbles = true;
  this.fireEvent('pointerout', pointerEventData, browserEvent);
};


/**
 * Triggers a 'pointercancel' event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.cancel =
    function(pointerEventData, browserEvent) {
  this.fireEvent('pointercancel', pointerEventData, browserEvent);
};


/**
 * Triggers a combination of 'pointerout' and 'pointerleave' events.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.leaveOut =
    function(pointerEventData, browserEvent) {
  this.out(pointerEventData, browserEvent);
  if (!this.contains_(
      pointerEventData.target,
      pointerEventData.relatedTarget)) {
    this.leave(pointerEventData, browserEvent);
  }
};


/**
 * Triggers a combination of 'pointerover' and 'pointerevents' events.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.enterOver =
    function(pointerEventData, browserEvent) {
  this.over(pointerEventData, browserEvent);
  if (!this.contains_(
      pointerEventData.target,
      pointerEventData.relatedTarget)) {
    this.enter(pointerEventData, browserEvent);
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
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 * @return {ol.pointer.PointerEvent} A PointerEvent of type `inType`.
 */
ol.pointer.PointerEventHandler.prototype.makeEvent =
    function(inType, pointerEventData, browserEvent) {
  // relatedTarget must be null if pointer is captured
  if (this.captureInfo) {
    pointerEventData.relatedTarget = null;
  }

  var e = new ol.pointer.PointerEvent(inType, browserEvent, pointerEventData);
  if (pointerEventData.preventDefault) {
    e.preventDefault = pointerEventData.preventDefault;
  }

  return e;
};


/**
 * Make and dispatch an event in one call.
 * @param {string} inType A string representing the type of event.
 * @param {Object} pointerEventData
 * @param {goog.events.BrowserEvent } browserEvent
 */
ol.pointer.PointerEventHandler.prototype.fireEvent =
    function(inType, pointerEventData, browserEvent) {
  var e = this.makeEvent(inType, pointerEventData, browserEvent);
  this.dispatchEvent(e);
};


/**
 * Creates a pointer event from a native pointer event
 * and dispatches this event.
 * @param {goog.events.BrowserEvent} nativeEvent A platform event with a target.
 */
ol.pointer.PointerEventHandler.prototype.fireNativeEvent =
    function(nativeEvent) {
  var e = this.makeEvent(nativeEvent.type, nativeEvent.getBrowserEvent(),
      nativeEvent);
  this.dispatchEvent(e);
};


/**
 * @inheritDoc
 */
ol.pointer.PointerEventHandler.prototype.disposeInternal = function() {
  this.unregister_();
  goog.base(this, 'disposeInternal');
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
