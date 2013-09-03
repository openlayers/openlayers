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
 * @author Eric Veach, July 1994
 * @author Brendan Kenny
 */

// require libtess
// require libtess.Dict
/*global libtess */

// TODO(bckenny): better typing for DictKey?

/**
 * [DictNode description]
 * @constructor
 */
libtess.DictNode = function() {
  // TODO(bckenny): could probably move all three properties to opt params
  /**
   * [key description]
   * @type {libtess.dictKey}
   */
  this.key = null;

  /**
   * [next description]
   * @type {libtess.DictNode}
   */
  this.next = null;
  
  /**
   * [prev description]
   * @type {libtess.DictNode}
   */
  this.prev = null;
};

/**
 * [getKey description]
 * @return {libtess.dictKey} [description]
 */
libtess.DictNode.prototype.getKey = function() {
  return this.key;
};

/**
 * [getSucc description]
 * @return {libtess.DictNode} [description]
 */
libtess.DictNode.prototype.getSucc = function() {
  // TODO(bckenny): unabreviated naming?
  return this.next;
};

/**
 * [getPred description]
 * @return {libtess.DictNode} [description]
 */
libtess.DictNode.prototype.getPred = function() {
  // TODO(bckenny): unabreviated naming?
  return this.prev;
};
