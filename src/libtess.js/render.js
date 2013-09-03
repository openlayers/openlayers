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
// require libtess.CachedVertex
// require libtess.GluTesselator
// require libtess.GluFace
// require libtess.GluHalfEdge
// require libtess.GluMesh
/*global libtess */

// TODO(bckenny): most of these doc strings are probably more internal comments

libtess.render = function() {

};


/**
 * [SIGN_INCONSISTENT_ description]
 * @type {number}
 * @private
 * @const
 */
libtess.render.SIGN_INCONSISTENT_ = 2;


/**
 * render.renderMesh(tess, mesh) takes a mesh and breaks it into triangle
 * fans, strips, and separate triangles. A substantial effort is made
 * to use as few rendering primitives as possible (i.e. to make the fans
 * and strips as large as possible).
 *
 * The rendering output is provided as callbacks (see the api).
 *
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluMesh} mesh [description].
 */
libtess.render.renderMesh = function(tess, mesh) {
  // Make a list of separate triangles so we can render them all at once
  tess.lonelyTriList = null;

  var f;
  for (f = mesh.fHead.next; f !== mesh.fHead; f = f.next) {
    f.marked = false;
  }
  for (f = mesh.fHead.next; f !== mesh.fHead; f = f.next) {
    // We examine all faces in an arbitrary order.  Whenever we find
    // an unprocessed face F, we output a group of faces including F
    // whose size is maximum.
    if (f.inside && ! f.marked) {
      libtess.render.renderMaximumFaceGroup_(tess, f);
      libtess.assert(f.marked);
    }
  }
  if (tess.lonelyTriList !== null) {
    libtess.render.renderLonelyTriangles_(tess, tess.lonelyTriList);
    tess.lonelyTriList = null;
  }
};


/**
 * render.renderBoundary(tess, mesh) takes a mesh, and outputs one
 * contour for each face marked "inside". The rendering output is
 * provided as callbacks (see the api).
 *
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluMesh} mesh [description].
 */
libtess.render.renderBoundary = function(tess, mesh) {
  for (var f = mesh.fHead.next; f !== mesh.fHead; f = f.next) {
    if (f.inside) {
      tess.callBeginOrBeginData(libtess.primitiveType.GL_LINE_LOOP);

      var e = f.anEdge;
      do {
        tess.callVertexOrVertexData(e.org.data);
        e = e.lNext;
      } while (e !== f.anEdge);

      tess.callEndOrEndData();
    }
  }
};


/**
 * render.renderCache(tess) takes a single contour and tries to render it
 * as a triangle fan. This handles convex polygons, as well as some
 * non-convex polygons if we get lucky.
 *
 * Returns true if the polygon was successfully rendered. The rendering
 * output is provided as callbacks (see the api).
 *
 * @param {libtess.GluTesselator} tess [description].
 * @return {boolean} [description].
 */
libtess.render.renderCache = function(tess) {
  if (tess.cacheCount < 3) {
    // degenerate contour -- no output
    return true;
  }

  // TODO(bckenny): better init?
  var norm = [0, 0, 0];
  norm[0] = tess.normal[0];
  norm[1] = tess.normal[1];
  norm[2] = tess.normal[2];
  if (norm[0] === 0 && norm[1] === 0 && norm[2] === 0) {
    libtess.render.computeNormal_(tess, norm, false);
  }

  var sign = libtess.render.computeNormal_(tess, norm, true);
  if (sign === libtess.render.SIGN_INCONSISTENT_) {
    // fan triangles did not have a consistent orientation
    return false;
  }
  if (sign === 0) {
    // all triangles were degenerate
    return true;
  }

  // make sure we do the right thing for each winding rule
  switch (tess.windingRule) {
    case libtess.windingRule.GLU_TESS_WINDING_ODD:
    case libtess.windingRule.GLU_TESS_WINDING_NONZERO:
      break;
    case libtess.windingRule.GLU_TESS_WINDING_POSITIVE:
      if (sign < 0) {
        return true;
      }
      break;
    case libtess.windingRule.GLU_TESS_WINDING_NEGATIVE:
      if (sign > 0) {
        return true;
      }
      break;
    case libtess.windingRule.GLU_TESS_WINDING_ABS_GEQ_TWO:
      return true;
  }

  tess.callBeginOrBeginData(tess.boundaryOnly ?
      libtess.primitiveType.GL_LINE_LOOP : (tess.cacheCount > 3) ?
      libtess.primitiveType.GL_TRIANGLE_FAN : libtess.primitiveType.GL_TRIANGLES);

  // indexes into tess.cache to replace pointers
  // TODO(bckenny): refactor to be more straightforward
  var v0 = 0;
  var vn = v0 + tess.cacheCount;
  var vc;

  tess.callVertexOrVertexData(tess.cache[v0].data);
  if (sign > 0) {
    for (vc = v0 + 1; vc < vn; ++vc) {
      tess.callVertexOrVertexData(tess.cache[vc].data);
    }
  } else {
    for (vc = vn - 1; vc > v0; --vc) {
      tess.callVertexOrVertexData(tess.cache[vc].data);
    }
  }
  tess.callEndOrEndData();
  return true;
};


/**
 * Returns true if face has been marked temporarily.
 * @private
 * @param {libtess.GluFace} f [description].
 * @return {boolean} [description].
 */
libtess.render.marked_ = function(f) {
  // NOTE(bckenny): originally macro
  return (!f.inside || f.marked);
};


/**
 * [freeTrail description]
 * @private
 * @param {libtess.GluFace} t [description].
 */
libtess.render.freeTrail_ = function(t) {
  // NOTE(bckenny): originally macro
  while (t !== null) {
    t.marked = false;
    t = t.trail;
  }
};


/**
 * eOrig.lFace is the face we want to render. We want to find the size
 * of a maximal fan around eOrig.org. To do this we just walk around
 * the origin vertex as far as possible in both directions.
 * @private
 * @param {libtess.GluHalfEdge} eOrig [description].
 * @return {libtess.FaceCount} [description].
 */
libtess.render.maximumFan_ = function(eOrig) {
  // TODO(bckenny): probably have dest FaceCount passed in (see renderMaximumFaceGroup)
  var newFace = new libtess.FaceCount(0, null, libtess.render.renderFan_);

  var trail = null;
  var e;

  for (e = eOrig; !libtess.render.marked_(e.lFace); e = e.oNext) {
    // NOTE(bckenny): AddToTrail(e.lFace, trail) macro
    e.lFace.trail = trail;
    trail = e.lFace;
    e.lFace.marked = true;

    ++newFace.size;
  }
  for (e = eOrig; !libtess.render.marked_(e.rFace()); e = e.oPrev()) {
    // NOTE(bckenny): AddToTrail(e.rFace(), trail) macro
    e.rFace().trail = trail;
    trail = e.rFace();
    e.rFace().marked = true;

    ++newFace.size;
  }
  newFace.eStart = e;

  libtess.render.freeTrail_(trail);
  return newFace;
};


/**
 * Here we are looking for a maximal strip that contains the vertices
 * eOrig.org, eOrig.dst(), eOrig.lNext.dst() (in that order or the
 * reverse, such that all triangles are oriented CCW).
 *
 * Again we walk forward and backward as far as possible. However for
 * strips there is a twist: to get CCW orientations, there must be
 * an *even* number of triangles in the strip on one side of eOrig.
 * We walk the strip starting on a side with an even number of triangles;
 * if both side have an odd number, we are forced to shorten one side.
 * @private
 * @param {libtess.GluHalfEdge} eOrig [description].
 * @return {libtess.FaceCount} [description].
 */
libtess.render.maximumStrip_ = function(eOrig) {
  // TODO(bckenny): probably have dest FaceCount passed in (see renderMaximumFaceGroup)
  var newFace = new libtess.FaceCount(0, null, libtess.render.renderStrip_);

  var headSize = 0;
  var tailSize = 0;

  var trail = null;

  var e;
  var eTail;
  var eHead;

  for (e = eOrig; !libtess.render.marked_(e.lFace); ++tailSize, e = e.oNext) {
    // NOTE(bckenny): AddToTrail(e.lFace, trail) macro
    e.lFace.trail = trail;
    trail = e.lFace;
    e.lFace.marked = true;

    ++tailSize;
    e = e.dPrev();
    if (libtess.render.marked_(e.lFace)) {
      break;
    }
    // NOTE(bckenny): AddToTrail(e.lFace, trail) macro
    e.lFace.trail = trail;
    trail = e.lFace;
    e.lFace.marked = true;
  }
  eTail = e;

  for (e = eOrig; !libtess.render.marked_(e.rFace()); ++headSize, e = e.dNext()) {
    // NOTE(bckenny): AddToTrail(e.rFace(), trail) macro
    e.rFace().trail = trail;
    trail = e.rFace();
    e.rFace().marked = true;

    ++headSize;
    e = e.oPrev();
    if (libtess.render.marked_(e.rFace())) {
      break;
    }
    // NOTE(bckenny): AddToTrail(e.rFace(), trail) macro
    e.rFace().trail = trail;
    trail = e.rFace();
    e.rFace().marked = true;
  }
  eHead = e;

  newFace.size = tailSize + headSize;
  if ((tailSize & 1) === 0) { // isEven
    newFace.eStart = eTail.sym;

  } else if ((headSize & 1) === 0) { // isEven
    newFace.eStart = eHead;

  } else {
    // Both sides have odd length, we must shorten one of them.  In fact,
    // we must start from eHead to guarantee inclusion of eOrig.lFace.
    --newFace.size;
    newFace.eStart = eHead.oNext;
  }

  libtess.render.freeTrail_(trail);
  return newFace;
};


/**
 * Render as many CCW triangles as possible in a fan starting from
 * edge "e". The fan *should* contain exactly "size" triangles
 * (otherwise we've goofed up somewhere).
 * @private
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluHalfEdge} e [description].
 * @param {number} size [description].
 */
libtess.render.renderFan_ = function(tess, e, size) {
  tess.callBeginOrBeginData(libtess.primitiveType.GL_TRIANGLE_FAN);
  tess.callVertexOrVertexData(e.org.data);
  tess.callVertexOrVertexData(e.dst().data);

  while (!libtess.render.marked_(e.lFace)) {
    e.lFace.marked = true;
    --size;
    e = e.oNext;
    tess.callVertexOrVertexData(e.dst().data);
  }

  libtess.assert(size === 0);
  tess.callEndOrEndData();
};


/**
 * Render as many CCW triangles as possible in a strip starting from
 * edge e. The strip *should* contain exactly "size" triangles
 * (otherwise we've goofed up somewhere).
 * @private
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluHalfEdge} e [description].
 * @param {number} size [description].
 */
libtess.render.renderStrip_ = function(tess, e, size) {
  tess.callBeginOrBeginData(libtess.primitiveType.GL_TRIANGLE_STRIP);
  tess.callVertexOrVertexData(e.org.data);
  tess.callVertexOrVertexData(e.dst().data);

  while (!libtess.render.marked_(e.lFace)) {
    e.lFace.marked = true;
    --size;
    e = e.dPrev();
    tess.callVertexOrVertexData(e.org.data);
    if (libtess.render.marked_(e.lFace)) {
      break;
    }

    e.lFace.marked = true;
    --size;
    e = e.oNext;
    tess.callVertexOrVertexData(e.dst().data);
  }

  libtess.assert(size === 0);
  tess.callEndOrEndData();
};


/**
 * Just add the triangle to a triangle list, so we can render all
 * the separate triangles at once.
 * @private
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluHalfEdge} e [description].
 * @param {number} size [description].
 */
libtess.render.renderTriangle_ = function(tess, e, size) {
  libtess.assert(size === 1);
  // NOTE(bckenny): AddToTrail(e.lFace, tess.lonelyTriList) macro
  e.lFace.trail = tess.lonelyTriList;
  tess.lonelyTriList = e.lFace;
  e.lFace.marked = true;
};


/**
 * We want to find the largest triangle fan or strip of unmarked faces
 * which includes the given face fOrig. There are 3 possible fans
 * passing through fOrig (one centered at each vertex), and 3 possible
 * strips (one for each CCW permutation of the vertices). Our strategy
 * is to try all of these, and take the primitive which uses the most
 * triangles (a greedy approach).
 * @private
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluFace} fOrig [description].
 */
libtess.render.renderMaximumFaceGroup_ = function(tess, fOrig) {
  var e = fOrig.anEdge;

  // TODO(bckenny): see faceCount comments from below. should probably create
  // two here and pass one in and compare against the other to find max
  // maybe doesnt matter since so short lived
  var max = new libtess.FaceCount(1, e, libtess.render.renderTriangle_);

  var newFace;
  if (!tess.flagBoundary) {
    newFace = libtess.render.maximumFan_(e);
    if (newFace.size > max.size) {
      max = newFace;
    }
    newFace = libtess.render.maximumFan_(e.lNext);
    if (newFace.size > max.size) {
      max = newFace;
    }
    newFace = libtess.render.maximumFan_(e.lPrev());
    if (newFace.size > max.size) {
      max = newFace;
    }

    newFace = libtess.render.maximumStrip_(e);
    if (newFace.size > max.size) {
      max = newFace;
    }
    newFace = libtess.render.maximumStrip_(e.lNext);
    if (newFace.size > max.size) {
      max = newFace;
    }
    newFace = libtess.render.maximumStrip_(e.lPrev());
    if (newFace.size > max.size) {
      max = newFace;
    }
  }

  max.render(tess, max.eStart, max.size);
};


/**
 * Now we render all the separate triangles which could not be
 * grouped into a triangle fan or strip.
 * @private
 * @param {libtess.GluTesselator} tess [description].
 * @param {libtess.GluFace} head [description].
 */
libtess.render.renderLonelyTriangles_ = function(tess, head) {
  // TODO(bckenny): edgeState needs to be boolean, but != on first call
  // force edge state output for first vertex
  var edgeState = -1;

  var f = head;

  tess.callBeginOrBeginData(libtess.primitiveType.GL_TRIANGLES);

  for (; f !== null; f = f.trail) {
    // Loop once for each edge (there will always be 3 edges)
    var e = f.anEdge;
    do {
      if (tess.flagBoundary) {
        // Set the "edge state" to true just before we output the
        // first vertex of each edge on the polygon boundary.
        var newState = !e.rFace().inside ? 1 : 0; // TODO(bckenny): total hack to get edgeState working. fix me.
        if (edgeState !== newState) {
          edgeState = newState;
          // TODO(bckenny): edgeState should be boolean now
          tess.callEdgeFlagOrEdgeFlagData(!!edgeState);
        }
      }
      tess.callVertexOrVertexData(e.org.data);

      e = e.lNext;
    } while (e !== f.anEdge);
  }

  tess.callEndOrEndData();
};


/**
 * If check==false, we compute the polygon normal and place it in norm[].
 * If check==true, we check that each triangle in the fan from v0 has a
 * consistent orientation with respect to norm[]. If triangles are
 * consistently oriented CCW, return 1; if CW, return -1; if all triangles
 * are degenerate return 0; otherwise (no consistent orientation) return
 * render.SIGN_INCONSISTENT_.
 * @private
 * @param {libtess.GluTesselator} tess [description].
 * @param {Array.<number>} norm [description].
 * @param {boolean} check [description].
 * @return {number} int.
 */
libtess.render.computeNormal_ = function(tess, norm, check) {
  /* Find the polygon normal. It is important to get a reasonable
   * normal even when the polygon is self-intersecting (eg. a bowtie).
   * Otherwise, the computed normal could be very tiny, but perpendicular
   * to the true plane of the polygon due to numerical noise. Then all
   * the triangles would appear to be degenerate and we would incorrectly
   * decompose the polygon as a fan (or simply not render it at all).
   *
   * We use a sum-of-triangles normal algorithm rather than the more
   * efficient sum-of-trapezoids method (used in checkOrientation()
   * in normal.js). This lets us explicitly reverse the signed area
   * of some triangles to get a reasonable normal in the self-intersecting
   * case.
   */
  if (!check) {
    norm[0] = norm[1] = norm[2] = 0;
  }

  // indexes into tess.cache to replace pointers
  // TODO(bckenny): refactor to be more straightforward
  var v0 = 0;
  var vn = v0 + tess.cacheCount;
  var vc = v0 + 1;
  var vert0 = tess.cache[v0];
  var vertc = tess.cache[vc];

  var xc = vertc.coords[0] - vert0.coords[0];
  var yc = vertc.coords[1] - vert0.coords[1];
  var zc = vertc.coords[2] - vert0.coords[2];

  var sign = 0;
  while (++vc < vn) {
    vertc = tess.cache[vc];
    var xp = xc;
    var yp = yc;
    var zp = zc;
    xc = vertc.coords[0] - vert0.coords[0];
    yc = vertc.coords[1] - vert0.coords[1];
    zc = vertc.coords[2] - vert0.coords[2];

    // Compute (vp - v0) cross (vc - v0)
    var n = [0, 0, 0]; // TODO(bckenny): better init?
    n[0] = yp * zc - zp * yc;
    n[1] = zp * xc - xp * zc;
    n[2] = xp * yc - yp * xc;

    var dot = n[0] * norm[0] + n[1] * norm[1] + n[2] * norm[2];
    if (!check) {
      // Reverse the contribution of back-facing triangles to get
      // a reasonable normal for self-intersecting polygons (see above)
      if (dot >= 0) {
        norm[0] += n[0];
        norm[1] += n[1];
        norm[2] += n[2];
      } else {
        norm[0] -= n[0];
        norm[1] -= n[1];
        norm[2] -= n[2];
      }
    } else if (dot !== 0) {
      // Check the new orientation for consistency with previous triangles
      if (dot > 0) {
        if (sign < 0) {
          return libtess.render.SIGN_INCONSISTENT_;
        }
        sign = 1;
      } else {
        if (sign > 0) {
          return libtess.render.SIGN_INCONSISTENT_;
        }
        sign = -1;
      }
    }
  }

  return sign;
};
