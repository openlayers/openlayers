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

goog.provide('ol.pointer.TouchSource');

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol');
goog.require('ol.pointer.EventSource');
goog.require('ol.pointer.MouseSource');



/**
 * @constructor
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @param {ol.pointer.MouseSource} mouseSource
 * @extends {ol.pointer.EventSource}
 */
ol.pointer.TouchSource = function(dispatcher, mouseSource) {
  var mapping = {
    'touchstart': this.touchstart,
    'touchmove': this.touchmove,
    'touchend': this.touchend,
    'touchcancel': this.touchcancel
  };
  goog.base(this, dispatcher, mapping);

  /**
   * @const
   * @type {Object.<string, goog.events.BrowserEvent|Object>}
   */
  this.pointerMap = dispatcher.pointerMap;

  /**
   * @const
   * @type {ol.pointer.MouseSource}
   */
  this.mouseSource = mouseSource;

  /**
   * @private
   * @type {number|undefined}
   */
  this.firstTouchId_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.clickCount_ = 0;

  /**
   * @private
   * @type {number|undefined}
   */
  this.resetId_ = undefined;
};
goog.inherits(ol.pointer.TouchSource, ol.pointer.EventSource);


/**
 * Mouse event timeout: This should be long enough to
 * ignore compat mouse events made by touch.
 * @const
 * @type {number}
 */
ol.pointer.TouchSource.DEDUP_TIMEOUT = 2500;


/**
 * @const
 * @type {number}
 */
ol.pointer.TouchSource.CLICK_COUNT_TIMEOUT = 200;


/**
 * @const
 * @type {string}
 */
ol.pointer.TouchSource.POINTER_TYPE = 'touch';


/**
 * @private
 * @param {Touch} inTouch
 * @return {boolean} True, if this is the primary touch.
 */
ol.pointer.TouchSource.prototype.isPrimaryTouch_ = function(inTouch) {
  return this.firstTouchId_ === inTouch.identifier;
};


/**
 * Set primary touch if there are no pointers, or the only pointer is the mouse.
 * @param {Touch} inTouch
 * @private
 */
ol.pointer.TouchSource.prototype.setPrimaryTouch_ = function(inTouch) {
  var count = goog.object.getCount(this.pointerMap);
  if (count === 0 || (count === 1 && goog.object.containsKey(this.pointerMap,
      ol.pointer.MouseSource.POINTER_ID.toString()))) {
    this.firstTouchId_ = inTouch.identifier;
    this.cancelResetClickCount_();
  }
};


/**
 * @private
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.removePrimaryPointer_ = function(inPointer) {
  if (inPointer.isPrimary) {
    this.firstTouchId_ = undefined;
    this.resetClickCount_();
  }
};


/**
 * @private
 */
ol.pointer.TouchSource.prototype.resetClickCount_ = function() {
  this.resetId_ = goog.global.setTimeout(
      goog.bind(this.resetClickCountHandler_, this),
      ol.pointer.TouchSource.CLICK_COUNT_TIMEOUT);
};


/**
 * @private
 */
ol.pointer.TouchSource.prototype.resetClickCountHandler_ = function() {
  this.clickCount_ = 0;
  this.resetId_ = undefined;
};


/**
 * @private
 */
ol.pointer.TouchSource.prototype.cancelResetClickCount_ = function() {
  if (this.resetId_ !== undefined) {
    goog.global.clearTimeout(this.resetId_);
  }
};


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent Browser event
 * @param {Touch} inTouch Touch event
 * @return {Object}
 */
ol.pointer.TouchSource.prototype.touchToPointer_ =
    function(browserEvent, inTouch) {
  var e = this.dispatcher.cloneEvent(browserEvent, inTouch);
  // Spec specifies that pointerId 1 is reserved for Mouse.
  // Touch identifiers can start at 0.
  // Add 2 to the touch identifier for compatibility.
  e.pointerId = inTouch.identifier + 2;
  // TODO: check if this is necessary?
  //e.target = findTarget(e);
  e.bubbles = true;
  e.cancelable = true;
  e.detail = this.clickCount_;
  e.button = 0;
  e.buttons = 1;
  e.width = inTouch.webkitRadiusX || inTouch.radiusX || 0;
  e.height = inTouch.webkitRadiusY || inTouch.radiusY || 0;
  e.pressure = inTouch.webkitForce || inTouch.force || 0.5;
  e.isPrimary = this.isPrimaryTouch_(inTouch);
  e.pointerType = ol.pointer.TouchSource.POINTER_TYPE;

  // make sure that the properties that are different for
  // each `Touch` object are not copied from the BrowserEvent object
  e.clientX = inTouch.clientX;
  e.clientY = inTouch.clientY;
  e.screenX = inTouch.screenX;
  e.screenY = inTouch.screenY;

  return e;
};


/**
 * @private
 * @param {goog.events.BrowserEvent} inEvent Touch event
 * @param {function(goog.events.BrowserEvent, Object)} inFunction
 */
ol.pointer.TouchSource.prototype.processTouches_ =
    function(inEvent, inFunction) {
  var touches = Array.prototype.slice.call(
      inEvent.getBrowserEvent().changedTouches);
  var count = touches.length;
  function preventDefault() {
    inEvent.preventDefault();
  }
  var i, pointer;
  for (i = 0; i < count; ++i) {
    pointer = this.touchToPointer_(inEvent, touches[i]);
    // forward touch preventDefaults
    pointer.preventDefault = preventDefault;
    inFunction.call(this, inEvent, pointer);
  }
};


/**
 * @private
 * @param {TouchList} touchList
 * @param {number} searchId
 * @return {boolean} True, if the `Touch` with the given id is in the list.
 */
ol.pointer.TouchSource.prototype.findTouch_ = function(touchList, searchId) {
  var l = touchList.length;
  var touch;
  for (var i = 0; i < l; i++) {
    touch = touchList[i];
    if (touch.identifier === searchId) {
      return true;
    }
  }
  return false;
};


/**
 * In some instances, a touchstart can happen without a touchend. This
 * leaves the pointermap in a broken state.
 * Therefore, on every touchstart, we remove the touches that did not fire a
 * touchend event.
 * To keep state globally consistent, we fire a pointercancel for
 * this "abandoned" touch
 *
 * @private
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.TouchSource.prototype.vacuumTouches_ = function(inEvent) {
  var touchList = inEvent.getBrowserEvent().touches;
  // pointerMap.getCount() should be < touchList.length here,
  // as the touchstart has not been processed yet.
  var keys = goog.object.getKeys(this.pointerMap);
  var count = keys.length;
  if (count >= touchList.length) {
    var d = [];
    var i, key, value;
    for (i = 0; i < count; ++i) {
      key = keys[i];
      value = this.pointerMap[key];
      // Never remove pointerId == 1, which is mouse.
      // Touch identifiers are 2 smaller than their pointerId, which is the
      // index in pointermap.
      if (key != ol.pointer.MouseSource.POINTER_ID &&
          !this.findTouch_(touchList, key - 2)) {
        d.push(value.out);
      }
    }
    for (i = 0; i < d.length; ++i) {
      this.cancelOut_(inEvent, d[i]);
    }
  }
};


/**
 * Handler for `touchstart`, triggers `pointerover`,
 * `pointerenter` and `pointerdown` events.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.TouchSource.prototype.touchstart = function(inEvent) {
  this.vacuumTouches_(inEvent);
  this.setPrimaryTouch_(inEvent.getBrowserEvent().changedTouches[0]);
  this.dedupSynthMouse_(inEvent);
  this.clickCount_++;
  this.processTouches_(inEvent, this.overDown_);
};


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.overDown_ = function(browserEvent, inPointer) {
  this.pointerMap[inPointer.pointerId] = {
    target: inPointer.target,
    out: inPointer,
    outTarget: inPointer.target
  };
  this.dispatcher.over(inPointer, browserEvent);
  this.dispatcher.enter(inPointer, browserEvent);
  this.dispatcher.down(inPointer, browserEvent);
};


/**
 * Handler for `touchmove`.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.TouchSource.prototype.touchmove = function(inEvent) {
  inEvent.preventDefault();
  this.processTouches_(inEvent, this.moveOverOut_);
};


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.moveOverOut_ =
    function(browserEvent, inPointer) {
  var event = inPointer;
  var pointer = this.pointerMap[event.pointerId];
  // a finger drifted off the screen, ignore it
  if (!pointer) {
    return;
  }
  var outEvent = pointer.out;
  var outTarget = pointer.outTarget;
  this.dispatcher.move(event, browserEvent);
  if (outEvent && outTarget !== event.target) {
    outEvent.relatedTarget = event.target;
    event.relatedTarget = outTarget;
    // recover from retargeting by shadow
    outEvent.target = outTarget;
    if (event.target) {
      this.dispatcher.leaveOut(outEvent, browserEvent);
      this.dispatcher.enterOver(event, browserEvent);
    } else {
      // clean up case when finger leaves the screen
      event.target = outTarget;
      event.relatedTarget = null;
      this.cancelOut_(browserEvent, event);
    }
  }
  pointer.out = event;
  pointer.outTarget = event.target;
};


/**
 * Handler for `touchend`, triggers `pointerup`,
 * `pointerout` and `pointerleave` events.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.TouchSource.prototype.touchend = function(inEvent) {
  this.dedupSynthMouse_(inEvent);
  this.processTouches_(inEvent, this.upOut_);
};


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.upOut_ = function(browserEvent, inPointer) {
  this.dispatcher.up(inPointer, browserEvent);
  this.dispatcher.out(inPointer, browserEvent);
  this.dispatcher.leave(inPointer, browserEvent);
  this.cleanUpPointer_(inPointer);
};


/**
 * Handler for `touchcancel`, triggers `pointercancel`,
 * `pointerout` and `pointerleave` events.
 *
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.TouchSource.prototype.touchcancel = function(inEvent) {
  this.processTouches_(inEvent, this.cancelOut_);
};


/**
 * @private
 * @param {goog.events.BrowserEvent} browserEvent
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.cancelOut_ =
    function(browserEvent, inPointer) {
  this.dispatcher.cancel(inPointer, browserEvent);
  this.dispatcher.out(inPointer, browserEvent);
  this.dispatcher.leave(inPointer, browserEvent);
  this.cleanUpPointer_(inPointer);
};


/**
 * @private
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.cleanUpPointer_ = function(inPointer) {
  delete this.pointerMap[inPointer.pointerId];
  this.removePrimaryPointer_(inPointer);
};


/**
 * Prevent synth mouse events from creating pointer events.
 *
 * @private
 * @param {goog.events.BrowserEvent} inEvent
 */
ol.pointer.TouchSource.prototype.dedupSynthMouse_ = function(inEvent) {
  var lts = this.mouseSource.lastTouches;
  var t = inEvent.getBrowserEvent().changedTouches[0];
  // only the primary finger will synth mouse events
  if (this.isPrimaryTouch_(t)) {
    // remember x/y of last touch
    var lt = /** @type {ol.Pixel} */ ([t.clientX, t.clientY]);
    lts.push(lt);

    goog.global.setTimeout(function() {
      // remove touch after timeout
      goog.array.remove(lts, lt);
    }, ol.pointer.TouchSource.DEDUP_TIMEOUT);
  }
};
