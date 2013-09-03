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
// requre libtess.GluHalfEdge
/*global libtess */



/**
 * Each face has a pointer to the next and previous faces in the
 * circular list, and a pointer to a half-edge with this face as
 * the left face (null if this is the dummy header). There is also
 * a field "data" for client data.
 *
 * @param {libtess.GluFace=} opt_nextFace [description].
 * @param {libtess.GluFace=} opt_prevFace [description].
 * @constructor
 */
libtess.GluFace = function(opt_nextFace, opt_prevFace) {
  // TODO(bckenny): reverse order of params?

  /**
   * next face (never null)
   * @type {!libtess.GluFace}
   */
  this.next = opt_nextFace || this;

  /**
   * previous face (never NULL)
   * @type {!libtess.GluFace}
   */
  this.prev = opt_prevFace || this;

  /**
   * A half edge with this left face.
   * @type {libtess.GluHalfEdge}
   */
  this.anEdge = null;

  /**
   * room for client's data
   * @type {Object}
   */
  this.data = null;

  /**
   * "stack" for conversion to strips
   * @type {libtess.GluFace}
   */
  this.trail = null;

  /**
   * Flag for conversion to strips.
   * @type {boolean}
   */
  this.marked = false;

  /**
   * This face is in the polygon interior.
   * @type {boolean}
   */
  this.inside = false;
};
