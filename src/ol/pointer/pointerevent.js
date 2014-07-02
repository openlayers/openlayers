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

goog.provide('ol.pointer.PointerEvent');


goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.object');



/**
 * A class for pointer events.
 *
 * This class is used as an abstraction for mouse events,
 * touch events and even native pointer events.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type The type of the event to create.
 * @param {goog.events.BrowserEvent} browserEvent
 * @param {Object.<string, ?>=} opt_eventDict An optional dictionary of
 *    initial event properties.
 */
ol.pointer.PointerEvent = function(type, browserEvent, opt_eventDict) {
  goog.base(this, type);

  /**
   * @const
   * @type {goog.events.BrowserEvent}
   */
  this.browserEvent = browserEvent;

  var eventDict = goog.isDef(opt_eventDict) ? opt_eventDict : {};

  /**
   * @type {number}
   */
  this.buttons = this.getButtons_(eventDict);

  /**
   * @type {number}
   */
  this.pressure = this.getPressure_(eventDict, this.buttons);

  // MouseEvent related properties

  /**
   * @type {boolean}
   */
  this.bubbles = goog.object.get(eventDict, 'bubbles', false);

  /**
   * @type {boolean}
   */
  this.cancelable = goog.object.get(eventDict, 'cancelable', false);

  /**
   * @type {Object}
   */
  this.view = goog.object.get(eventDict, 'view', null);

  /**
   * @type {number}
   */
  this.detail = goog.object.get(eventDict, 'detail', null);

  /**
   * @type {number}
   */
  this.screenX = goog.object.get(eventDict, 'screenX', 0);

  /**
   * @type {number}
   */
  this.screenY = goog.object.get(eventDict, 'screenY', 0);

  /**
   * @type {number}
   */
  this.clientX = goog.object.get(eventDict, 'clientX', 0);

  /**
   * @type {number}
   */
  this.clientY = goog.object.get(eventDict, 'clientY', 0);

  /**
   * @type {boolean}
   */
  this.ctrlKey = goog.object.get(eventDict, 'ctrlKey', false);

  /**
   * @type {boolean}
   */
  this.altKey = goog.object.get(eventDict, 'altKey', false);

  /**
   * @type {boolean}
   */
  this.shiftKey = goog.object.get(eventDict, 'shiftKey', false);

  /**
   * @type {boolean}
   */
  this.metaKey = goog.object.get(eventDict, 'metaKey', false);

  /**
   * @type {number}
   */
  this.button = goog.object.get(eventDict, 'button', 0);

  /**
   * @type {Node}
   */
  this.relatedTarget = goog.object.get(eventDict, 'relatedTarget', null);

  // PointerEvent related properties

  /**
   * @const
   * @type {number}
   */
  this.pointerId = goog.object.get(eventDict, 'pointerId', 0);

  /**
   * @type {number}
   */
  this.width = goog.object.get(eventDict, 'width', 0);

  /**
   * @type {number}
   */
  this.height = goog.object.get(eventDict, 'height', 0);

  /**
   * @type {number}
   */
  this.tiltX = goog.object.get(eventDict, 'tiltX', 0);

  /**
   * @type {number}
   */
  this.tiltY = goog.object.get(eventDict, 'tiltY', 0);

  /**
   * @type {string}
   */
  this.pointerType = goog.object.get(eventDict, 'pointerType', '');

  /**
   * @type {number}
   */
  this.hwTimestamp = goog.object.get(eventDict, 'hwTimestamp', 0);

  /**
   * @type {boolean}
   */
  this.isPrimary = goog.object.get(eventDict, 'isPrimary', false);

  // keep the semantics of preventDefault
  if (browserEvent.preventDefault) {
    this.preventDefault = function() {
      browserEvent.preventDefault();
    };
  }
};
goog.inherits(ol.pointer.PointerEvent, goog.events.Event);


/**
 * @private
 * @param {Object.<string, ?>} eventDict
 * @return {number}
 */
ol.pointer.PointerEvent.prototype.getButtons_ = function(eventDict) {
  // According to the w3c spec,
  // http://www.w3.org/TR/DOM-Level-3-Events/#events-MouseEvent-button
  // MouseEvent.button == 0 can mean either no mouse button depressed, or the
  // left mouse button depressed.
  //
  // As of now, the only way to distinguish between the two states of
  // MouseEvent.button is by using the deprecated MouseEvent.which property, as
  // this maps mouse buttons to positive integers > 0, and uses 0 to mean that
  // no mouse button is held.
  //
  // MouseEvent.which is derived from MouseEvent.button at MouseEvent creation,
  // but initMouseEvent does not expose an argument with which to set
  // MouseEvent.which. Calling initMouseEvent with a buttonArg of 0 will set
  // MouseEvent.button == 0 and MouseEvent.which == 1, breaking the expectations
  // of app developers.
  //
  // The only way to propagate the correct state of MouseEvent.which and
  // MouseEvent.button to a new MouseEvent.button == 0 and MouseEvent.which == 0
  // is to call initMouseEvent with a buttonArg value of -1.
  //
  // This is fixed with DOM Level 4's use of buttons
  var buttons;
  if (eventDict.buttons || ol.pointer.PointerEvent.HAS_BUTTONS) {
    buttons = eventDict.buttons;
  } else {
    switch (eventDict.which) {
      case 1: buttons = 1; break;
      case 2: buttons = 4; break;
      case 3: buttons = 2; break;
      default: buttons = 0;
    }
  }
  return buttons;
};


/**
 * @private
 * @param {Object.<string, ?>} eventDict
 * @param {number} buttons
 * @return {number}
 */
ol.pointer.PointerEvent.prototype.getPressure_ = function(eventDict, buttons) {
  // Spec requires that pointers without pressure specified use 0.5 for down
  // state and 0 for up state.
  var pressure = 0;
  if (eventDict.pressure) {
    pressure = eventDict.pressure;
  } else {
    pressure = buttons ? 0.5 : 0;
  }
  return pressure;
};


/**
 * Is the `buttons` property supported?
 * @type {boolean}
 */
ol.pointer.PointerEvent.HAS_BUTTONS = false;


/**
 * Checks if the `buttons` property is supported.
 */
(function() {
  try {
    var ev = new MouseEvent('click', {buttons: 1});
    ol.pointer.PointerEvent.HAS_BUTTONS = ev.buttons === 1;
  } catch (e) {
  }
})();
