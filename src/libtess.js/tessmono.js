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
// require libtess.geom
// require libtess.GluFace
// require libtess.GluMesh
/*global libtess */

libtess.tessmono = function() {

};


/**
 * tessellateMonoRegion(face) tessellates a monotone region
 * (what else would it do??). The region must consist of a single
 * loop of half-edges (see mesh.js) oriented CCW. "Monotone" in this
 * case means that any vertical line intersects the interior of the
 * region in a single interval.
 *
 * Tessellation consists of adding interior edges (actually pairs of
 * half-edges), to split the region into non-overlapping triangles.
 * @private
 * @param {libtess.GluFace} face [description].
 */
libtess.tessmono.tessellateMonoRegion_ = function(face) {
  /* The basic idea is explained in Preparata and Shamos (which I don''t
   * have handy right now), although their implementation is more
   * complicated than this one. The are two edge chains, an upper chain
   * and a lower chain.  We process all vertices from both chains in order,
   * from right to left.
   *
   * The algorithm ensures that the following invariant holds after each
   * vertex is processed: the untessellated region consists of two
   * chains, where one chain (say the upper) is a single edge, and
   * the other chain is concave. The left vertex of the single edge
   * is always to the left of all vertices in the concave chain.
   *
   * Each step consists of adding the rightmost unprocessed vertex to one
   * of the two chains, and forming a fan of triangles from the rightmost
   * of two chain endpoints. Determining whether we can add each triangle
   * to the fan is a simple orientation test.  By making the fan as large
   * as possible, we restore the invariant (check it yourself).
   *
   * All edges are oriented CCW around the boundary of the region.
   * First, find the half-edge whose origin vertex is rightmost.
   * Since the sweep goes from left to right, face.anEdge should
   * be close to the edge we want.
   */

  var up = face.anEdge;
  libtess.assert(up.lNext !== up && up.lNext.lNext !== up);

  for (; libtess.geom.vertLeq(up.dst(), up.org); up = up.lPrev()) { }
  for (; libtess.geom.vertLeq(up.org, up.dst()); up = up.lNext) { }

  var lo = up.lPrev();

  var tempHalfEdge;
  while (up.lNext !== lo) {
    if (libtess.geom.vertLeq(up.dst(), lo.org)) {
      // up.dst() is on the left. It is safe to form triangles from lo.org.
      // The edgeGoesLeft test guarantees progress even when some triangles
      // are CW, given that the upper and lower chains are truly monotone.
      while (lo.lNext !== up && (libtess.geom.edgeGoesLeft(lo.lNext) ||
          libtess.geom.edgeSign(lo.org, lo.dst(), lo.lNext.dst()) <= 0)) {

        tempHalfEdge = libtess.mesh.connect(lo.lNext, lo);
        lo = tempHalfEdge.sym;
      }
      lo = lo.lPrev();

    } else {
      // lo.org is on the left. We can make CCW triangles from up.dst().
      while (lo.lNext !== up && (libtess.geom.edgeGoesRight(up.lPrev()) ||
          libtess.geom.edgeSign(up.dst(), up.org, up.lPrev().org) >= 0)) {

        tempHalfEdge = libtess.mesh.connect(up, up.lPrev());
        up = tempHalfEdge.sym;
      }
      up = up.lNext;
    }
  }

  // Now lo.org == up.dst() == the leftmost vertex. The remaining region
  // can be tessellated in a fan from this leftmost vertex.
  libtess.assert(lo.lNext !== up);
  while (lo.lNext.lNext !== up) {
    tempHalfEdge = libtess.mesh.connect(lo.lNext, lo);
    lo = tempHalfEdge.sym;
  }
};


/**
 * tessellateInterior(mesh) tessellates each region of
 * the mesh which is marked "inside" the polygon. Each such region
 * must be monotone.
 *
 * @param {libtess.GluMesh} mesh [description].
 */
libtess.tessmono.tessellateInterior = function(mesh) {
  var next;
  for (var f = mesh.fHead.next; f !== mesh.fHead; f = next) {
    // Make sure we don''t try to tessellate the new triangles.
    next = f.next;
    if (f.inside) {
      libtess.tessmono.tessellateMonoRegion_(f);
    }
  }
};


/**
 * discardExterior(mesh) zaps (ie. sets to null) all faces
 * which are not marked "inside" the polygon. Since further mesh operations
 * on null faces are not allowed, the main purpose is to clean up the
 * mesh so that exterior loops are not represented in the data structure.
 *
 * @param {libtess.GluMesh} mesh [description].
 */
libtess.tessmono.discardExterior = function(mesh) {
  var next;
  for (var f = mesh.fHead.next; f !== mesh.fHead; f = next) {
    // Since f will be destroyed, save its next pointer.
    next = f.next;
    if (!f.inside) {
      libtess.mesh.zapFace(f);
    }
  }
};


/**
 * setWindingNumber(mesh, value, keepOnlyBoundary) resets the
 * winding numbers on all edges so that regions marked "inside" the
 * polygon have a winding number of "value", and regions outside
 * have a winding number of 0.
 *
 * If keepOnlyBoundary is true, it also deletes all edges which do not
 * separate an interior region from an exterior one.
 *
 * @param {libtess.GluMesh} mesh [description].
 * @param {number} value Winding number to set (int).
 */
libtess.tessmono.setWindingNumber = function(mesh, value, keepOnlyBoundary) {
  var eNext;
  for (var e = mesh.eHead.next; e !== mesh.eHead; e = eNext) {
    eNext = e.next;

    if (e.rFace().inside !== e.lFace.inside) {
      // This is a boundary edge (one side is interior, one is exterior).
      e.winding = (e.lFace.inside) ? value : -value;

    } else {
      // Both regions are interior, or both are exterior.
      if (!keepOnlyBoundary) {
        e.winding = 0;

      } else {
        libtess.mesh.deleteEdge(e);
      }
    }
  }
};
