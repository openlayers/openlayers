/**
 * Copyright 2000, Silicon Graphics, Inc. All Rights Reserved.
 * Copyright 2012, Google Inc. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice including the dates of first publication and
 * either this permission notice or a reference to http://oss.sgi.com/projects/FreeB/
 * shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * SILICON GRAPHICS, INC. BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
 * IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Original Code. The Original Code is: OpenGL Sample Implementation,
 * Version 1.2.1, released January 26, 2000, developed by Silicon Graphics,
 * Inc. The Original Code is Copyright (c) 1991-2000 Silicon Graphics, Inc.
 * Copyright in any portions created by third parties is as indicated
 * elsewhere herein. All Rights Reserved.
 */

/**
 * @author ericv@cs.stanford.edu (Eric Veach)
 * @author bckenny@google.com (Brendan Kenny)
 */

// require libtess
/*global libtess */


// TODO(bckenny): better typing for DictKey? actually libtess.ActiveRegion
/** @typedef {Object} */
libtess.dictKey;

// TODO(bckenny): better typing for all of this, really. no need not to eg use tess as frame directly



/**
 * [Dict description]
 *
 * @constructor
 * @param {Object} frame [description].
 * @param {function(Object, Object, Object): boolean} leq [description].
 */
libtess.Dict = function(frame, leq) {
  /**
   * [head description]
   * @type {libtess.DictNode}
   */
  this.head = new libtess.DictNode();
  this.head.next = this.head;
  this.head.prev = this.head;

  // TODO(bckenny): better typing? see above
  /**
   * [frame description]
   * @type {Object}
   */
  this.frame = frame;

  /**
   * [leq_ description]
   * @private
   * @type {function(Object, libtess.dictKey, libtess.dictKey): boolean}
   */
  this.leq_ = /** @type {function(Object, libtess.dictKey, libtess.dictKey): boolean} */(leq);
};


/**
 * [deleteDict description]
 */
libtess.Dict.prototype.deleteDict = function() {
  // TODO(bckenny): unnecessary, I think.
  // for (var node = libtess.head.next; node !== libtess.head; node = node.next) {
  // memFree(node);
  // }
  // memFree(dict);

  // NOTE(bckenny): nulled at callsite (sweep.doneEdgeDict_)
};


/**
 * [insertBefore description]
 * @param {libtess.DictNode} node [description].
 * @param {Object} key [description].
 * @return {libtess.DictNode} [description].
 */
libtess.Dict.prototype.insertBefore = function(node, key) {
  do {
    node = node.prev;
  } while (node.key !== null && !this.leq_(this.frame, node.key, key));

  var newNode = new libtess.DictNode();

  newNode.key = key;
  newNode.next = node.next;
  node.next.prev = newNode;
  newNode.prev = node;
  node.next = newNode;

  return newNode;
};


/**
 * [insert description]
 * @param {Object} key [description].
 * @return {libtess.DictNode} [description].
 */
libtess.Dict.prototype.insert = function(key) {
  // NOTE(bckenny): from a macro in dict.h/dict-list.h
  return this.insertBefore(this.head, key);
};


/**
 * [deleteNode description]
 * @param {libtess.DictNode} node [description].
 */
libtess.Dict.prototype.deleteNode = function(node) {
  // NOTE(bckenny): nulled at callsite (sweep.deleteRegion_)
  node.next.prev = node.prev;
  node.prev.next = node.next;
  // memFree( node ); TODO(bckenny)
};


/**
 * Search returns the node with the smallest key greater than or equal
 * to the given key. If there is no such key, returns a node whose
 * key is null. Similarly, max(d).getSucc() has a null key, etc.
 *
 * @param {Object} key [description].
 * @return {libtess.DictNode} [description].
 */
libtess.Dict.prototype.search = function(key) {
  var node = this.head;

  do {
    node = node.next;
  } while (node.key !== null && !this.leq_(this.frame, key, node.key));

  return node;
};


/**
 * [getMin description]
 * @return {libtess.DictNode} [description].
 */
libtess.Dict.prototype.getMin = function() {
  // NOTE(bckenny): from a macro in dict.h/dict-list.h
  return this.head.next;
};


/**
 * [getMax description]
 * @return {libtess.DictNode} [description].
 */
libtess.Dict.prototype.getMax = function() {
  // NOTE(bckenny): from a macro in dict.h/dict-list.h
  return this.head.prev;
};
