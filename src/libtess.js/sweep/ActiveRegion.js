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
// require libtess.DictNode
// require libtess.GluHalfEdge
/*global libtess */

// TODO(bckenny): apparently only visible outside of sweep for debugging routines.
// find out if we can hide

/**
 * For each pair of adjacent edges crossing the sweep line, there is
 * an ActiveRegion to represent the region between them. The active
 * regions are kept in sorted order in a dynamic dictionary.  As the
 * sweep line crosses each vertex, we update the affected regions.
 *
 * @constructor
 */
libtess.ActiveRegion = function() {
  // TODO(bckenny): I *think* eUp and nodeUp could be passed in as constructor params

  /**
   * upper edge, directed right to left
   * @type {libtess.GluHalfEdge}
   */
  this.eUp = null;

  /**
   * dictionary node corresponding to eUp
   * @type {libtess.DictNode}
   */
  this.nodeUp = null;

  /**
   * used to determine which regions are inside the polygon
   * @type {number}
   */
  this.windingNumber = 0;

  /**
   * is this region inside the polygon?
   * @type {boolean}
   */
  this.inside = false;
  
  /**
   * marks fake edges at t = +/-infinity
   * @type {boolean}
   */
  this.sentinel = false;
  
  /**
   * Marks regions where the upper or lower edge has changed, but we haven't
   * checked whether they intersect yet.
   * @type {boolean}
   */
  this.dirty = false;

  /**
   * marks temporary edges introduced when we process a "right vertex" (one
   * without any edges leaving to the right)
   * @type {boolean}
   */
  this.fixUpperEdge = false;
};

/**
 * [regionBelow description]
 * @return {libtess.ActiveRegion} [description]
 */
libtess.ActiveRegion.prototype.regionBelow = function() {
  // TODO(bckenny): better typing? or is cast unavoidable
  return /** @type {libtess.ActiveRegion} */ (this.nodeUp.getPred().getKey());
};

/**
 * [regionAbove description]
 * @return {libtess.ActiveRegion} [description]
 */
libtess.ActiveRegion.prototype.regionAbove = function() {
  // TODO(bckenny): better typing? or is cast unavoidable
  return /** @type {libtess.ActiveRegion} */ (this.nodeUp.getSucc().getKey());
};
