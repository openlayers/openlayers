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

// TODO(bckenny): maybe just have these created inline as literals
// (or unboxed directly - PQHandle is just an array index number)



/**
 * [PQNode description]
 * @constructor
 */
libtess.PQNode = function() {
  /**
   * [handle description]
   * @type {libtess.PQHandle}
   */
  this.handle = 0;
};


/**
 * Allocate a PQNode array of size size. If oldArray is not null, its contents
 * are copied to the beginning of the new array. The rest of the array is
 * filled with new PQNodes.
 *
 * @param {?Array.<libtess.PQNode>} oldArray [description].
 * @param {number} size [description].
 * @return {Array.<libtess.PQNode>} [description].
 */
libtess.PQNode.realloc = function(oldArray, size) {
  var newArray = new Array(size);

  // TODO(bckenny): better to reallocate array? or grow array?
  var index = 0;
  if (oldArray !== null) {
    for (; index < oldArray.length; index++) {
      newArray[index] = oldArray[index];
    }
  }

  for (; index < size; index++) {
    newArray[index] = new libtess.PQNode();
  }

  return newArray;
};
