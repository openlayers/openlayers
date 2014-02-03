// Based on https://github.com/Polymer/WeakMap
/*
* Copyright 2012 The Polymer Authors. All rights reserved.
* Use of this source code is governed by a BSD-style
* license that can be found in the LICENSE file.
*/


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
