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

goog.require('ol.pointer.EventSource');



/**
 * @param {ol.pointer.PointerEventHandler} dispatcher
 * @param {ol.pointer.MouseSource} mouseSource
 * @constructor
 * @extends {ol.pointer.EventSource}
 */
ol.pointer.TouchSource = function(dispatcher, mouseSource) {
  goog.base(this, dispatcher);

  this.pointerMap = dispatcher.pointerMap;
  this.mouseSource = mouseSource;

  // This should be long enough to ignore compat mouse events made by touch
  this.DEDUP_TIMEOUT = 2500;
  this.CLICK_COUNT_TIMEOUT = 200;
  this.POINTER_TYPE = 'touch';
  this.firstTouch = null;
  this.clickCount = 0;
  this.resetId = null;

  this.events = [
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel'
  ];
  this.mapping = {
    'touchstart': this.touchstart,
    'touchmove': this.touchmove,
    'touchend': this.touchend,
    'touchcancel': this.touchcancel
  };
};
goog.inherits(ol.pointer.TouchSource, ol.pointer.EventSource);


/** @inheritDoc */
ol.pointer.TouchSource.prototype.getEvents = function() {
  return this.events;
};


/** @inheritDoc */
ol.pointer.TouchSource.prototype.getMapping = function() {
  return this.mapping;
};


/**
 * @private
 * @param {Touch} inTouch
 * @return {boolean} True, if this is the primary touch.
 */
ol.pointer.TouchSource.prototype.isPrimaryTouch_ = function(inTouch) {
  return this.firstTouch === inTouch.identifier;
};


/**
 * @private
 * Set primary touch if there are no pointers, or the only pointer is the mouse.
 * @param {Touch} inTouch
 */
ol.pointer.TouchSource.prototype.setPrimaryTouch_ = function(inTouch) {
  if (this.pointerMap.getCount() === 0 ||
      (this.pointerMap.getCount() === 1 && this.pointerMap.containsKey(1))) {
    this.firstTouch = inTouch.identifier;
    this.firstXY = {X: inTouch.clientX, Y: inTouch.clientY};
    this.cancelResetClickCount_();
  }
};


/**
 * @private
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.removePrimaryPointer_ = function(inPointer) {
  if (inPointer.isPrimary) {
    this.firstTouch = null;
    this.firstXY = null;
    this.resetClickCount_();
  }
};


/**
 * @private
 */
ol.pointer.TouchSource.prototype.resetClickCount_ = function() {
  var fn = function() {
    this.clickCount = 0;
    this.resetId = null;
  };
  this.resetId = setTimeout(goog.bind(fn, this), this.CLICK_COUNT_TIMEOUT);
};


/**
 * @private
 */
ol.pointer.TouchSource.prototype.cancelResetClickCount_ = function() {
  if (this.resetId) {
    clearTimeout(this.resetId);
  }
};


/**
 * @private
 * @param {Touch} inTouch Touch event
 * @return {Object}
 */
ol.pointer.TouchSource.prototype.touchToPointer_ = function(inTouch) {
  var e = this.dispatcher.cloneEvent(inTouch);
  // Spec specifies that pointerId 1 is reserved for Mouse.
  // Touch identifiers can start at 0.
  // Add 2 to the touch identifier for compatibility.
  e.pointerId = inTouch.identifier + 2;
  // TODO: check if this is neccessary?
  //e.target = findTarget(e);
  e.bubbles = true;
  e.cancelable = true;
  e.detail = this.clickCount;
  e.button = 0;
  e.buttons = 1;
  e.width = inTouch['webkitRadiusX'] || inTouch['radiusX'] || 0;
  e.height = inTouch['webkitRadiusY'] || inTouch['radiusY'] || 0;
  e.pressure = inTouch['webkitForce'] || inTouch['force'] || 0.5;
  e.isPrimary = this.isPrimaryTouch_(inTouch);
  e.pointerType = this.POINTER_TYPE;

  return e;
};


/**
 * @private
 * @param {goog.events.BrowserEvent} inEvent Touch event
 * @param {function(Object)} inFunction
 */
ol.pointer.TouchSource.prototype.processTouches_ =
    function(inEvent, inFunction) {
  var tl = inEvent.getBrowserEvent().changedTouches;
  var pointers = goog.array.map(tl, this.touchToPointer_, this);
  // forward touch preventDefaults
  pointers.forEach(function(p) {
    p.preventDefault = function() {
      this.firstXY = null;
      inEvent.preventDefault();
    };
  }, this);
  pointers.forEach(inFunction, this);
};


/**
 * @private
 * @param {TouchList} touchList
 * @param {number} searchId
 * @return {boolean} True, if the `Touch` with the given id is in the list.
 */
ol.pointer.TouchSource.prototype.findTouch_ = function(touchList, searchId) {
  for (var i = 0, l = touchList.length, t; i < l && (t = touchList[i]); i++) {
    if (t.identifier === searchId) {
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
  // pointermap.pointers() should be < touchList.length here,
  // as the touchstart has not been processed yet.
  if (this.pointerMap.getCount() >= touchList.length) {
    var d = [];
    this.forEach_(this.pointerMap, function(value, key) {
      // Never remove pointerId == 1, which is mouse.
      // Touch identifiers are 2 smaller than their pointerId, which is the
      // index in pointermap.
      if (key !== 1 && !this.findTouch_(touchList, key - 2)) {
        var p = value.out;
        d.push(this.touchToPointer_(p));
      }
    }, this);
    d.forEach(this.cancelOut_, this);
  }
};


/**
 * @private
 * @param {goog.structs.Map} map
 * @param {function(?, ?)} callback
 * @param {Object} thisArg
 */
ol.pointer.TouchSource.prototype.forEach_ = function(map, callback, thisArg) {
  map.getValues().forEach(function(value) {
    callback.call(thisArg, value, map.get(value));
  });
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
  this.clickCount++;
  this.processTouches_(inEvent, this.overDown_);
};


/**
 * @private
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.overDown_ = function(inPointer) {
  this.pointerMap.set(inPointer.pointerId, {
    target: inPointer.target,
    out: inPointer,
    outTarget: inPointer.target
  });
  this.dispatcher.over(inPointer);
  this.dispatcher.enter(inPointer);
  this.dispatcher.down(inPointer);
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
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.moveOverOut_ = function(inPointer) {
  var event = inPointer;
  var pointer = this.pointerMap.get(event.pointerId);
  // a finger drifted off the screen, ignore it
  if (!pointer) {
    return;
  }
  var outEvent = pointer.out;
  var outTarget = pointer.outTarget;
  this.dispatcher.move(event);
  if (outEvent && outTarget !== event.target) {
    outEvent.relatedTarget = event.target;
    event.relatedTarget = outTarget;
    // recover from retargeting by shadow
    outEvent.target = outTarget;
    if (event.target) {
      this.dispatcher.leaveOut(outEvent);
      this.dispatcher.enterOver(event);
    } else {
      // clean up case when finger leaves the screen
      event.target = outTarget;
      event.relatedTarget = null;
      this.cancelOut_(event);
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
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.upOut_ = function(inPointer) {
  this.dispatcher.up(inPointer);
  this.dispatcher.out(inPointer);
  this.dispatcher.leave(inPointer);
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
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.cancelOut_ = function(inPointer) {
  this.dispatcher.cancel(inPointer);
  this.dispatcher.out(inPointer);
  this.dispatcher.leave(inPointer);
  this.cleanUpPointer_(inPointer);
};


/**
 * @private
 * @param {Object} inPointer
 */
ol.pointer.TouchSource.prototype.cleanUpPointer_ = function(inPointer) {
  this.pointerMap.remove(inPointer.pointerId);
  this.removePrimaryPointer_(inPointer);
};


/**
 * Orevent synth mouse events from creating pointer events.
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
    var lt = {x: t.clientX, y: t.clientY};
    lts.push(lt);
    var fn = goog.bind(function(lts, lt) {
      var i = lts.indexOf(lt);
      if (i > -1) {
        lts.splice(i, 1);
      }
    }, null, lts, lt);
    setTimeout(fn, this.DEDUP_TIMEOUT);
  }
};
