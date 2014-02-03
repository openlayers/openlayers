// Based on https://github.com/Polymer/WeakMap

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

goog.provide('ol.structs.WeakMap');


/**
 * @suppress {undefinedVars}
 * @return {boolean} Is `WeakMap` already defined?
 */
ol.structs.isWeakMapUndefined = function() {
  return typeof WeakMap === 'undefined';
};


if (ol.structs.isWeakMapUndefined()) {
  /**
   * @constructor
   */
  ol.structs.WeakMap = function() {
    this.name = '__st' + (Math.random() * 1e9 >>> 0) +
        (ol.structs.WeakMap.counter++ + '__');
  };


  /**
   * @this {ol.structs.WeakMap}
   * @param {*} key
   * @param {*} value
   */
  ol.structs.WeakMap.prototype['set'] = function(key, value) {
    var entry = key[this.name];
    if (entry && entry[0] === key)
      entry[1] = value;
    else
      ol.structs.WeakMap.defineProperty(key, this.name,
          {value: [key, value], writable: true});
  };


  /**
   * @this {ol.structs.WeakMap}
   * @param {*} key
   * @return {*}
   */
  ol.structs.WeakMap.prototype['get'] = function(key) {
    var entry;
    return (entry = key[this.name]) && entry[0] === key ?
        entry[1] : undefined;
  };


  /**
   * @this {ol.structs.WeakMap}
   * @param {*} key
   */
  ol.structs.WeakMap.prototype['delete'] = function(key) {
    this['set'](key, undefined);
  };
} else {
  ol.structs.WeakMap = WeakMap;
}


/**
 * @type {function(...)}
 */
ol.structs.WeakMap.defineProperty = Object.defineProperty;


/**
 * @type {number}
 */
ol.structs.WeakMap.counter = Date.now() % 1e9;
