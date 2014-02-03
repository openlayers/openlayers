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


//goog.require('goog.events.Event');
goog.require('goog.events');



/**
 * This is the constructor for new PointerEvents.
 *
 * New Pointer Events must be given a type, and an optional dictionary of
 * initialization properties.
 *
 * Due to certain platform requirements, events returned from the constructor
 * identify as MouseEvents.
 *
 * @constructor
 * @extends {Event}
 * @param {string} inType The type of the event to create.
 * @param {Object.<string, ?>=} opt_inDict An optional dictionary of
 *    initial event properties.
 */
ol.pointer.PointerEvent = function(inType, opt_inDict) {
  opt_inDict = opt_inDict || {};
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
  if (opt_inDict.buttons || ol.pointer.PointerEvent.HAS_BUTTONS) {
    buttons = opt_inDict.buttons;
  } else {
    switch (opt_inDict.which) {
      case 1: buttons = 1; break;
      case 2: buttons = 4; break;
      case 3: buttons = 2; break;
      default: buttons = 0;
    }
  }

  var e;
  if (ol.pointer.PointerEvent.NEW_MOUSE_EVENT) {
    e = ol.pointer.PointerEvent.createMouseEvent(inType, opt_inDict);
  } else {
    e = document.createEvent('MouseEvent');

    // import values from the given dictionary
    /**
     * @type {Object.<string, ?>}
     */
    var props = {};
    var p;
    for (var i = 0; i < ol.pointer.PointerEvent.MOUSE_PROPS.length; i++) {
      p = ol.pointer.PointerEvent.MOUSE_PROPS[i];
      props[p] = opt_inDict[p] || ol.pointer.PointerEvent.MOUSE_DEFAULTS[i];
    }

    // define the properties inherited from MouseEvent
    e.initMouseEvent(
        inType, props.bubbles, props.cancelable, props.view, props.detail,
        props.screenX, props.screenY, props.clientX, props.clientY,
        props.ctrlKey, props.altKey, props.shiftKey, props.metaKey,
        props.button, props.relatedTarget
    );
  }

  // make the event pass instanceof checks
  e.__proto__ = ol.pointer.PointerEvent.prototype;

  // define the buttons property according to DOM Level 3 spec
  if (!ol.pointer.PointerEvent.HAS_BUTTONS) {
    // IE 10 has buttons on MouseEvent.prototype as a getter w/o any setting
    // mechanism
    Object.defineProperty(e, 'buttons',
        {get: function() { return buttons; }, enumerable: true});
  }

  // Spec requires that pointers without pressure specified use 0.5 for down
  // state and 0 for up state.
  var pressure = 0;
  if (opt_inDict.pressure) {
    pressure = opt_inDict.pressure;
  } else {
    pressure = buttons ? 0.5 : 0;
  }

  // define the properties of the PointerEvent interface
  Object.defineProperties(e, {
    pointerId: { value: opt_inDict.pointerId || 0, enumerable: true },
    width: { value: opt_inDict.width || 0, enumerable: true },
    height: { value: opt_inDict.height || 0, enumerable: true },
    pressure: { value: pressure, enumerable: true },
    tiltX: { value: opt_inDict.tiltX || 0, enumerable: true },
    tiltY: { value: opt_inDict.tiltY || 0, enumerable: true },
    pointerType: { value: opt_inDict.pointerType || '', enumerable: true },
    hwTimestamp: { value: opt_inDict.hwTimestamp || 0, enumerable: true },
    isPrimary: { value: opt_inDict.isPrimary || false, enumerable: true }
  });

  return e;
};

// PointerEvent extends MouseEvent
ol.pointer.PointerEvent.prototype = Object.create(MouseEvent.prototype);


// test for DOM Level 4 Events


/**
 * Does the browser support the `MouseEvent` type?
 * @type {boolean}
 */
ol.pointer.PointerEvent.NEW_MOUSE_EVENT = false;


/**
 * Is the `buttons` property supported?
 * @type {boolean}
 */
ol.pointer.PointerEvent.HAS_BUTTONS = false;


/**
 * Checks if the `MouseEvent` type is supported.
 */
ol.pointer.PointerEvent.checkNewMouseEvent = function() {
  try {
    var ev = ol.pointer.PointerEvent.createMouseEvent('click', {buttons: 1});
    ol.pointer.PointerEvent.NEW_MOUSE_EVENT = true;
    ol.pointer.PointerEvent.HAS_BUTTONS = ev.buttons === 1;
  } catch (e) {
  }
};
ol.pointer.PointerEvent.checkNewMouseEvent();


/**
 * Warning is suppressed because Closure thinks MouseEvent
 * has no arguments.
 * @param {string} inType The type of the event to create.
 * @param {Object} inDict An dictionary of initial event properties.
 * @return {MouseEvent}
 * @suppress {checkTypes}
 */
ol.pointer.PointerEvent.createMouseEvent = function(inType, inDict) {
  return new MouseEvent(inType, inDict);
};


/**
 * List of properties to copy when creating an event.
 * @type {Array.<string>}
 */
ol.pointer.PointerEvent.MOUSE_PROPS = [
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
  'relatedTarget'
];


/**
 * List of default values when creating an event.
 */
ol.pointer.PointerEvent.MOUSE_DEFAULTS = [
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
  null
];
