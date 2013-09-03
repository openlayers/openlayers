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
// require libtess.GluHalfEdge
// require libtess.GluTesselator
/*global libtess */

// TODO(bckenny): Used only in private functions of render.js

/**
 * This structure remembers the information we need about a primitive
 * to be able to render it later, once we have determined which
 * primitive is able to use the most triangles.
  *
 * @constructor
 * @param {number} size [description]
 * @param {libtess.GluHalfEdge} eStart [description]
 * @param {!function(libtess.GluTesselator, libtess.GluHalfEdge, number)} renderFunction [description]
 */
libtess.FaceCount = function(size, eStart, renderFunction) {
  /**
   * The number of triangles used.
   * @type {number}
   */
  this.size = size;

  /**
   * The edge where this primitive starts.
   * @type {libtess.GluHalfEdge}
   */
  this.eStart = eStart;

  /**
   * The routine to render this primitive.
   * @type {!function(libtess.GluTesselator, libtess.GluHalfEdge, number)}
   */
  this.render = renderFunction;
};
