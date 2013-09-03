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
// require libtess.GluFace
// require libtess.GluVertex
// require libtess.ActiveRegion
/*global libtess */

/**
 * The fundamental data structure is the "half-edge". Two half-edges
 * go together to make an edge, but they point in opposite directions.
 * Each half-edge has a pointer to its mate (the "symmetric" half-edge sym),
 * its origin vertex (org), the face on its left side (lFace), and the
 * adjacent half-edges in the CCW direction around the origin vertex
 * (oNext) and around the left face (lNext). There is also a "next"
 * pointer for the global edge list (see below).
 *
 * The notation used for mesh navigation:
 *  sym   = the mate of a half-edge (same edge, but opposite direction)
 *  oNext = edge CCW around origin vertex (keep same origin)
 *  dNext = edge CCW around destination vertex (keep same dest)
 *  lNext = edge CCW around left face (dest becomes new origin)
 *  rNext = edge CCW around right face (origin becomes new dest)
 *
 * "prev" means to substitute CW for CCW in the definitions above.
 *
 * The circular edge list is special; since half-edges always occur
 * in pairs (e and e.sym), each half-edge stores a pointer in only
 * one direction. Starting at eHead and following the e.next pointers
 * will visit each *edge* once (ie. e or e.sym, but not both).
 * e.sym stores a pointer in the opposite direction, thus it is
 * always true that e.sym.next.sym.next === e.
 *
 * @param {libtess.GluHalfEdge=} opt_nextEdge [description]
 * @constructor
 */
libtess.GluHalfEdge = function(opt_nextEdge) {
  // TODO(bckenny): are these the right defaults? (from gl_meshNewMesh requirements)
  
  /**
   * doubly-linked list (prev==sym->next)
   * @type {!libtess.GluHalfEdge}
   */
  this.next = opt_nextEdge || this;

  // TODO(bckenny): how can this be required if created in pairs? move to factory creation only?
  /**
   * same edge, opposite direction
   * @type {libtess.GluHalfEdge}
   */
  this.sym = null;

  /**
   * next edge CCW around origin
   * @type {libtess.GluHalfEdge}
   */
  this.oNext = null;

  /**
   * next edge CCW around left face
   * @type {libtess.GluHalfEdge}
   */
  this.lNext = null;

  /**
   * origin vertex (oVertex too long)
   * @type {libtess.GluVertex}
   */
  this.org = null;

  /**
   * left face
   * @type {libtess.GluFace}
   */
  this.lFace = null;

  // Internal data (keep hidden)
  // NOTE(bckenny): can't be private, though...
  
  /**
   * a region with this upper edge (see sweep.js)
   * @type {libtess.ActiveRegion}
   */
  this.activeRegion = null;

  /**
   * change in winding number when crossing from the right face to the left face
   * @type {number}
   */
  this.winding = 0;
};

// NOTE(bckenny): the following came from macros in mesh
// TODO(bckenny): using methods as aliases for sym connections for now.
// not sure about this approach. getters? renames?

/**
 * [rFace description]
 * @return {libtess.GluFace} [description]
 */
libtess.GluHalfEdge.prototype.rFace = function() {
  return this.sym.lFace;
};

/**
 * [dst description]
 * @return {libtess.GluVertex} [description]
 */
libtess.GluHalfEdge.prototype.dst = function() {
  return this.sym.org;
};

/**
 * [oPrev description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.GluHalfEdge.prototype.oPrev = function() {
  return this.sym.lNext;
};

/**
 * [lPrev description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.GluHalfEdge.prototype.lPrev = function() {
  return this.oNext.sym;
};

/**
 * [dPrev description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.GluHalfEdge.prototype.dPrev = function() {
  return this.lNext.sym;
};

/**
 * [rPrev description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.GluHalfEdge.prototype.rPrev = function() {
  return this.sym.oNext;
};

/**
 * [dNext description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.GluHalfEdge.prototype.dNext = function() {
  return this.rPrev().sym;
};

/**
 * [rNext description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.GluHalfEdge.prototype.rNext = function() {
  return this.oPrev().sym;
};
