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

// require libtess.mesh
// require libtess.geom
// require libtess.Dict
// require libtess.PriorityQ
/*global libtess */

// TODO(bckenny): a number of these never return null (as opposed to original) and should be typed appropriately

/*
 * Invariants for the Edge Dictionary.
 * - each pair of adjacent edges e2=succ(e1) satisfies edgeLeq_(e1,e2)
 *   at any valid location of the sweep event
 * - if edgeLeq_(e2,e1) as well (at any valid sweep event), then e1 and e2
 *   share a common endpoint
 * - for each e, e.dst() has been processed, but not e.org
 * - each edge e satisfies vertLeq(e.dst(),event) && vertLeq(event,e.org)
 *   where "event" is the current sweep line event.
 * - no edge e has zero length
 *
 * Invariants for the Mesh (the processed portion).
 * - the portion of the mesh left of the sweep line is a planar graph,
 *   ie. there is *some* way to embed it in the plane
 * - no processed edge has zero length
 * - no two processed vertices have identical coordinates
 * - each "inside" region is monotone, ie. can be broken into two chains
 *   of monotonically increasing vertices according to VertLeq(v1,v2)
 *   - a non-invariant: these chains may intersect (very slightly)
 *
 * Invariants for the Sweep.
 * - if none of the edges incident to the event vertex have an activeRegion
 *   (ie. none of these edges are in the edge dictionary), then the vertex
 *   has only right-going edges.
 * - if an edge is marked "fixUpperEdge" (it is a temporary edge introduced
 *   by ConnectRightVertex), then it is the only right-going edge from
 *   its associated vertex.  (This says that these edges exist only
 *   when it is necessary.)
 */

libtess.sweep = function() {

};

/**
 * Make the sentinel coordinates big enough that they will never be
 * merged with real input features.  (Even with the largest possible
 * input contour and the maximum tolerance of 1.0, no merging will be
 * done with coordinates larger than 3 * libtess.GLU_TESS_MAX_COORD).
 * @private
 * @const
 * @type {number}
 */
libtess.sweep.SENTINEL_COORD_ = 4 * libtess.GLU_TESS_MAX_COORD;

/**
 * Because vertices at exactly the same location are merged together
 * before we process the sweep event, some degenerate cases can't occur.
 * However if someone eventually makes the modifications required to
 * merge features which are close together, the cases below marked
 * TOLERANCE_NONZERO will be useful.  They were debugged before the
 * code to merge identical vertices in the main loop was added.
 * @private
 * @const
 * @type {boolean}
 */
libtess.sweep.TOLERANCE_NONZERO_ = false;

/**
 * computeInterior(tess) computes the planar arrangement specified
 * by the given contours, and further subdivides this arrangement
 * into regions. Each region is marked "inside" if it belongs
 * to the polygon, according to the rule given by tess.windingRule.
 * Each interior region is guaranteed be monotone.
 *
 * @param {libtess.GluTesselator} tess [description]
 */
libtess.sweep.computeInterior = function(tess) {
  tess.fatalError = false;

  // Each vertex defines an event for our sweep line. Start by inserting
  // all the vertices in a priority queue. Events are processed in
  // lexicographic order, ie.
  // e1 < e2  iff  e1.x < e2.x || (e1.x == e2.x && e1.y < e2.y)
  libtess.sweep.removeDegenerateEdges_(tess);
  libtess.sweep.initPriorityQ_(tess);
  libtess.sweep.initEdgeDict_(tess);

  // TODO(bckenny): don't need the cast if pq's key is better typed
  var v;
  while ((v = /** @type {libtess.GluVertex} */(tess.pq.extractMin())) !== null) {
    for ( ;; ) {
      var vNext = /** @type {libtess.GluVertex} */(tess.pq.minimum());
      if (vNext === null || !libtess.geom.vertEq(vNext, v)) {
        break;
      }
      
      /* Merge together all vertices at exactly the same location.
       * This is more efficient than processing them one at a time,
       * simplifies the code (see connectLeftDegenerate), and is also
       * important for correct handling of certain degenerate cases.
       * For example, suppose there are two identical edges A and B
       * that belong to different contours (so without this code they would
       * be processed by separate sweep events).  Suppose another edge C
       * crosses A and B from above.  When A is processed, we split it
       * at its intersection point with C.  However this also splits C,
       * so when we insert B we may compute a slightly different
       * intersection point.  This might leave two edges with a small
       * gap between them.  This kind of error is especially obvious
       * when using boundary extraction (GLU_TESS_BOUNDARY_ONLY).
       */
      vNext = /** @type {libtess.GluVertex} */(tess.pq.extractMin());
      libtess.sweep.spliceMergeVertices_(tess, v.anEdge, vNext.anEdge);
    }
    libtess.sweep.sweepEvent_(tess, v);
  }

  // TODO(bckenny): what does the next comment mean? can we eliminate event except when debugging?
  // Set tess.event for debugging purposes
  // TODO(bckenny): can we elminate cast? intermediate tmpReg added for clarity
  var tmpReg = /** @type {libtess.ActiveRegion} */(tess.dict.getMin().getKey());
  tess.event = tmpReg.eUp.org;
  libtess.sweepDebugEvent(tess);
  libtess.sweep.doneEdgeDict_(tess);
  libtess.sweep.donePriorityQ_(tess);

  libtess.sweep.removeDegenerateFaces_(tess.mesh);
  tess.mesh.checkMesh(); // TODO(bckenny): just for debug?
};



/**
 * When we merge two edges into one, we need to compute the combined
 * winding of the new edge.
 * @private
 * @param {libtess.GluHalfEdge} eDst [description]
 * @param {libtess.GluHalfEdge} eSrc [description]
 */
libtess.sweep.addWinding_ = function(eDst, eSrc) {
  // NOTE(bckenny): from AddWinding macro
  eDst.winding += eSrc.winding;
  eDst.sym.winding += eSrc.sym.winding;
};

/**
 * Both edges must be directed from right to left (this is the canonical
 * direction for the upper edge of each region).
 *
 * The strategy is to evaluate a "t" value for each edge at the
 * current sweep line position, given by tess.event.  The calculations
 * are designed to be very stable, but of course they are not perfect.
 *
 * Special case: if both edge destinations are at the sweep event,
 * we sort the edges by slope (they would otherwise compare equally).
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} reg1 [description]
 * @param {libtess.ActiveRegion} reg2 [description]
 * @return {boolean} [description]
 */
libtess.sweep.edgeLeq_ = function(tess, reg1, reg2) {
  var event = tess.event;
  var e1 = reg1.eUp;
  var e2 = reg2.eUp;

  if (e1.dst() === event) {
    if (e2.dst() === event) {
      // Two edges right of the sweep line which meet at the sweep event.
      // Sort them by slope.
      if (libtess.geom.vertLeq(e1.org, e2.org)) {
        return libtess.geom.edgeSign(e2.dst(), e1.org, e2.org) <= 0;
      }

      return libtess.geom.edgeSign(e1.dst(), e2.org, e1.org) >= 0;
    }

    return libtess.geom.edgeSign(e2.dst(), event, e2.org) <= 0;
  }

  if (e2.dst() === event) {
    return libtess.geom.edgeSign(e1.dst(), event, e1.org) >= 0;
  }

  // General case - compute signed distance *from* e1, e2 to event
  var t1 = libtess.geom.edgeEval(e1.dst(), event, e1.org);
  var t2 = libtess.geom.edgeEval(e2.dst(), event, e2.org);
  return (t1 >= t2);
};

/**
 * [deleteRegion_ description]
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} reg [description]
 */
libtess.sweep.deleteRegion_ = function(tess, reg) {
  if (reg.fixUpperEdge) {
    // It was created with zero winding number, so it better be
    // deleted with zero winding number (ie. it better not get merged
    // with a real edge).
    libtess.assert(reg.eUp.winding === 0);
  }

  reg.eUp.activeRegion = null;

  tess.dict.deleteNode(reg.nodeUp);
  reg.nodeUp = null;

  // memFree( reg ); TODO(bckenny)
  // TODO(bckenny): may need to null at callsite
};

/**
 * Replace an upper edge which needs fixing (see connectRightVertex).
 * @private
 * @param {libtess.ActiveRegion} reg [description]
 * @param {libtess.GluHalfEdge} newEdge [description]
 */
libtess.sweep.fixUpperEdge_ = function(reg, newEdge) {
  libtess.assert(reg.fixUpperEdge);
  libtess.mesh.deleteEdge(reg.eUp);

  reg.fixUpperEdge = false;
  reg.eUp = newEdge;
  newEdge.activeRegion = reg;
};

/**
 * Find the region above the uppermost edge with the same origin.
 * @private
 * @param {libtess.ActiveRegion} reg [description]
 * @return {libtess.ActiveRegion} [description]
 */
libtess.sweep.topLeftRegion_ = function(reg) {
  var org = reg.eUp.org;

  // Find the region above the uppermost edge with the same origin
  do {
    reg = reg.regionAbove();
  } while (reg.eUp.org === org);

  // If the edge above was a temporary edge introduced by connectRightVertex,
  // now is the time to fix it.
  if (reg.fixUpperEdge) {
    var e = libtess.mesh.connect(reg.regionBelow().eUp.sym, reg.eUp.lNext);
    libtess.sweep.fixUpperEdge_(reg, e);
    reg = reg.regionAbove();
  }

  return reg;
};

/**
 * Find the region above the uppermost edge with the same destination.
 * @private
 * @param {libtess.ActiveRegion} reg [description]
 * @return {libtess.ActiveRegion} [description]
 */
libtess.sweep.topRightRegion_ = function(reg) {
  var dst = reg.eUp.dst();

  do {
    reg = reg.regionAbove();
  } while (reg.eUp.dst() === dst);

  return reg;
};

/**
 * Add a new active region to the sweep line, *somewhere* below "regAbove"
 * (according to where the new edge belongs in the sweep-line dictionary).
 * The upper edge of the new region will be "eNewUp".
 * Winding number and "inside" flag are not updated.
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regAbove [description]
 * @param {libtess.GluHalfEdge} eNewUp [description]
 */
libtess.sweep.addRegionBelow_ = function(tess, regAbove, eNewUp) {
  var regNew = new libtess.ActiveRegion();

  regNew.eUp = eNewUp;
  regNew.nodeUp = tess.dict.insertBefore(regAbove.nodeUp, regNew);
  eNewUp.activeRegion = regNew;

  return regNew;
};

/**
 * [isWindingInside_ description]
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {number} n int
 * @return {boolean} [description]
 */
libtess.sweep.isWindingInside_ = function(tess, n) {
  switch(tess.windingRule) {
    case libtess.windingRule.GLU_TESS_WINDING_ODD:
      return ((n & 1) !== 0);
    case libtess.windingRule.GLU_TESS_WINDING_NONZERO:
      return (n !== 0);
    case libtess.windingRule.GLU_TESS_WINDING_POSITIVE:
      return (n > 0);
    case libtess.windingRule.GLU_TESS_WINDING_NEGATIVE:
      return (n < 0);
    case libtess.windingRule.GLU_TESS_WINDING_ABS_GEQ_TWO:
      return (n >= 2) || (n <= -2);
  }

  // TODO(bckenny): not reached
  libtess.assert(false);
  return false;
};

/**
 * [computeWinding_ description]
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} reg [description]
 */
libtess.sweep.computeWinding_ = function(tess, reg) {
  reg.windingNumber = reg.regionAbove().windingNumber + reg.eUp.winding;
  reg.inside = libtess.sweep.isWindingInside_(tess, reg.windingNumber);
};

/**
 * Delete a region from the sweep line. This happens when the upper
 * and lower chains of a region meet (at a vertex on the sweep line).
 * The "inside" flag is copied to the appropriate mesh face (we could
 * not do this before -- since the structure of the mesh is always
 * changing, this face may not have even existed until now).
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} reg [description]
 */
libtess.sweep.finishRegion_ = function(tess, reg) {
  // TODO(bckenny): may need to null reg at callsite

  var e = reg.eUp;
  var f = e.lFace;

  f.inside = reg.inside;
  f.anEdge = e;   // optimization for tessmono.tessellateMonoRegion() // TODO(bckenny): how so?
  libtess.sweep.deleteRegion_(tess, reg);
};

/**
 * We are given a vertex with one or more left-going edges. All affected
 * edges should be in the edge dictionary. Starting at regFirst.eUp,
 * we walk down deleting all regions where both edges have the same
 * origin vOrg. At the same time we copy the "inside" flag from the
 * active region to the face, since at this point each face will belong
 * to at most one region (this was not necessarily true until this point
 * in the sweep). The walk stops at the region above regLast; if regLast
 * is null we walk as far as possible. At the same time we relink the
 * mesh if necessary, so that the ordering of edges around vOrg is the
 * same as in the dictionary.
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regFirst [description]
 * @param {libtess.ActiveRegion} regLast [description]
 * @return {libtess.GluHalfEdge} [description]
 */
libtess.sweep.finishLeftRegions_ = function(tess, regFirst, regLast) {
  var regPrev = regFirst;
  var ePrev = regFirst.eUp;
  while (regPrev !== regLast) {
    // placement was OK
    regPrev.fixUpperEdge = false;
    var reg = regPrev.regionBelow();
    var e = reg.eUp;
    if (e.org !== ePrev.org) {
      if (!reg.fixUpperEdge) {
        /* Remove the last left-going edge. Even though there are no further
         * edges in the dictionary with this origin, there may be further
         * such edges in the mesh (if we are adding left edges to a vertex
         * that has already been processed). Thus it is important to call
         * finishRegion rather than just deleteRegion.
         */
        libtess.sweep.finishRegion_(tess, regPrev);
        break;
      }

      // If the edge below was a temporary edge introduced by
      // connectRightVertex, now is the time to fix it.
      e = libtess.mesh.connect(ePrev.lPrev(), e.sym);
      libtess.sweep.fixUpperEdge_(reg, e);
    }

    // Relink edges so that ePrev.oNext === e
    if (ePrev.oNext !== e) {
      libtess.mesh.meshSplice(e.oPrev(), e);
      libtess.mesh.meshSplice(ePrev, e);
    }

    // may change reg.eUp
    libtess.sweep.finishRegion_(tess, regPrev);
    ePrev = reg.eUp;
    regPrev = reg;
  }

  return ePrev;
};

/**
 * Purpose: insert right-going edges into the edge dictionary, and update
 * winding numbers and mesh connectivity appropriately. All right-going
 * edges share a common origin vOrg. Edges are inserted CCW starting at
 * eFirst; the last edge inserted is eLast.oPrev. If vOrg has any
 * left-going edges already processed, then eTopLeft must be the edge
 * such that an imaginary upward vertical segment from vOrg would be
 * contained between eTopLeft.oPrev and eTopLeft; otherwise eTopLeft
 * should be null.
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regUp [description]
 * @param {libtess.GluHalfEdge} eFirst [description]
 * @param {libtess.GluHalfEdge} eLast [description]
 * @param {libtess.GluHalfEdge} eTopLeft [description]
 * @param {boolean} cleanUp [description]
 */
libtess.sweep.addRightEdges_ = function(tess, regUp, eFirst, eLast, eTopLeft, cleanUp) {
  var firstTime = true;

  // Insert the new right-going edges in the dictionary
  var e = eFirst;
  do {
    libtess.assert(libtess.geom.vertLeq(e.org, e.dst()));
    libtess.sweep.addRegionBelow_(tess, regUp, e.sym);
    e = e.oNext;
  } while (e !== eLast);

  // Walk *all* right-going edges from e.org, in the dictionary order,
  // updating the winding numbers of each region, and re-linking the mesh
  // edges to match the dictionary ordering (if necessary).
  if (eTopLeft === null) {
    eTopLeft = regUp.regionBelow().eUp.rPrev();
  }
  var regPrev = regUp;
  var ePrev = eTopLeft;
  var reg;
  for( ;; ) {
    reg = regPrev.regionBelow();
    e = reg.eUp.sym;
    if (e.org !== ePrev.org) {
      break;
    }

    if (e.oNext !== ePrev) {
      // Unlink e from its current position, and relink below ePrev
      libtess.mesh.meshSplice(e.oPrev(), e);
      libtess.mesh.meshSplice(ePrev.oPrev(), e);
    }
    // Compute the winding number and "inside" flag for the new regions
    reg.windingNumber = regPrev.windingNumber - e.winding;
    reg.inside = libtess.sweep.isWindingInside_(tess, reg.windingNumber);

    // Check for two outgoing edges with same slope -- process these
    // before any intersection tests (see example in libtess.sweep.computeInterior).
    regPrev.dirty = true;
    if (!firstTime && libtess.sweep.checkForRightSplice_(tess, regPrev)) {
      libtess.sweep.addWinding_(e, ePrev);
      libtess.sweep.deleteRegion_(tess, regPrev); // TODO(bckenny): need to null regPrev anywhere else?
      libtess.mesh.deleteEdge(ePrev);
    }
    firstTime = false;
    regPrev = reg;
    ePrev = e;
  }

  regPrev.dirty = true;
  libtess.assert(regPrev.windingNumber - e.winding === reg.windingNumber);

  if (cleanUp) {
    // Check for intersections between newly adjacent edges.
    libtess.sweep.walkDirtyRegions_(tess, regPrev);
  }
};

/**
 * [callCombine_ description]
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.GluVertex} isect [description]
 * @param {Array.<Object>} data [description]
 * @param {Array.<number>} weights [description]
 * @param {boolean} needed [description]
 */
libtess.sweep.callCombine_ = function(tess, isect, data, weights, needed) {
  // Copy coord data in case the callback changes it.
  var coords = [
    isect.coords[0],
    isect.coords[1],
    isect.coords[2]
  ];

  isect.data = null;
  isect.data = tess.callCombineOrCombineData(coords, data, weights);
  if (isect.data === null) {
    if (!needed) {
      // not needed, so just use data from first vertex
      isect.data = data[0];

    } else if (!tess.fatalError) {
      // The only way fatal error is when two edges are found to intersect,
      // but the user has not provided the callback necessary to handle
      // generated intersection points.
      tess.callErrorOrErrorData(libtess.errorType.GLU_TESS_NEED_COMBINE_CALLBACK);
      tess.fatalError = true;
    }
  }
};

/**
 * Two vertices with idential coordinates are combined into one.
 * e1.org is kept, while e2.org is discarded.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.GluHalfEdge} e1 [description]
 * @param {libtess.GluHalfEdge} e2 [description]
 */
libtess.sweep.spliceMergeVertices_ = function(tess, e1, e2) {
  // TODO(bckenny): better way to init these? save them?
  var data = [null, null, null, null];
  var weights = [0.5, 0.5, 0, 0];

  data[0] = e1.org.data;
  data[1] = e2.org.data;
  libtess.sweep.callCombine_(tess, e1.org, data, weights, false);
  libtess.mesh.meshSplice(e1, e2);
};

/**
 * Find some weights which describe how the intersection vertex is
 * a linear combination of org and dst. Each of the two edges
 * which generated "isect" is allocated 50% of the weight; each edge
 * splits the weight between its org and dst according to the
 * relative distance to "isect".
 *
 * @private
 * @param {libtess.GluVertex} isect [description]
 * @param {libtess.GluVertex} org [description]
 * @param {libtess.GluVertex} dst [description]
 * @param {Array.<number>} weights [description]
 * @param {number} weightIndex Index into weights for first weight to supply
 */
libtess.sweep.vertexWeights_ = function(isect, org, dst, weights, weightIndex) {
  // TODO(bckenny): think through how we can use L1dist here and be correct for coords
  var t1 = libtess.geom.vertL1dist(org, isect);
  var t2 = libtess.geom.vertL1dist(dst, isect);

  // TODO(bckenny): introduced weightIndex to mimic addressing in original
  // 1) document (though it is private and only used from getIntersectData)
  // 2) better way? manually inline into getIntersectData? supply two two-length tmp arrays?
  var i0 = weightIndex;
  var i1 = weightIndex + 1;
  weights[i0] = 0.5 * t2 / (t1 + t2);
  weights[i1] = 0.5 * t1 / (t1 + t2);
  isect.coords[0] += weights[i0]*org.coords[0] + weights[i1]*dst.coords[0];
  isect.coords[1] += weights[i0]*org.coords[1] + weights[i1]*dst.coords[1];
  isect.coords[2] += weights[i0]*org.coords[2] + weights[i1]*dst.coords[2];
};

/**
 * We've computed a new intersection point, now we need a "data" pointer
 * from the user so that we can refer to this new vertex in the
 * rendering callbacks.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.GluVertex} isect [description]
 * @param {libtess.GluVertex} orgUp [description]
 * @param {libtess.GluVertex} dstUp [description]
 * @param {libtess.GluVertex} orgLo [description]
 * @param {libtess.GluVertex} dstLo [description]
 */
libtess.sweep.getIntersectData_ = function(tess, isect, orgUp, dstUp, orgLo, dstLo) {
  // TODO(bckenny): called for every intersection event, should these be from a pool?
  // TODO(bckenny): better way to init these?
  var weights = [0, 0, 0, 0];
  var data = [
    orgUp.data,
    dstUp.data,
    orgLo.data,
    dstLo.data
  ];

  // TODO(bckenny): it appears isect is a reappropriated vertex, so does need to be zeroed.
  // double check this.
  isect.coords[0] = isect.coords[1] = isect.coords[2] = 0;

  // TODO(bckenny): see note in libtess.sweep.vertexWeights_ for explanation of weightIndex. fix?
  libtess.sweep.vertexWeights_(isect, orgUp, dstUp, weights, 0);
  libtess.sweep.vertexWeights_(isect, orgLo, dstLo, weights, 2);

  libtess.sweep.callCombine_(tess, isect, data, weights, true);
};

/**
 * Check the upper and lower edge of regUp, to make sure that the
 * eUp.org is above eLo, or eLo.org is below eUp (depending on which
 * origin is leftmost).
 *
 * The main purpose is to splice right-going edges with the same
 * dest vertex and nearly identical slopes (ie. we can't distinguish
 * the slopes numerically). However the splicing can also help us
 * to recover from numerical errors. For example, suppose at one
 * point we checked eUp and eLo, and decided that eUp.org is barely
 * above eLo. Then later, we split eLo into two edges (eg. from
 * a splice operation like this one). This can change the result of
 * our test so that now eUp.org is incident to eLo, or barely below it.
 * We must correct this condition to maintain the dictionary invariants.
 *
 * One possibility is to check these edges for intersection again
 * (i.e. checkForIntersect). This is what we do if possible. However
 * checkForIntersect requires that tess.event lies between eUp and eLo,
 * so that it has something to fall back on when the intersection
 * calculation gives us an unusable answer. So, for those cases where
 * we can't check for intersection, this routine fixes the problem
 * by just splicing the offending vertex into the other edge.
 * This is a guaranteed solution, no matter how degenerate things get.
 * Basically this is a combinatorial solution to a numerical problem.
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regUp [description]
 * @return {boolean} [description]
 */
libtess.sweep.checkForRightSplice_ = function(tess, regUp) {
  // TODO(bckenny): fully learn how these two checks work

  var regLo = regUp.regionBelow();
  var eUp = regUp.eUp;
  var eLo = regLo.eUp;

  if (libtess.geom.vertLeq(eUp.org, eLo.org)) {
    if (libtess.geom.edgeSign(eLo.dst(), eUp.org, eLo.org) > 0) {
      return false;
    }

    // eUp.org appears to be below eLo
    if (!libtess.geom.vertEq(eUp.org, eLo.org)) {
      // Splice eUp.org into eLo
      libtess.mesh.splitEdge(eLo.sym);
      libtess.mesh.meshSplice(eUp, eLo.oPrev());
      regUp.dirty = regLo.dirty = true;

    } else if (eUp.org !== eLo.org) {
      // merge the two vertices, discarding eUp.org
      // TODO(bckenny): fix pqHandle null situation
      tess.pq.remove(/** @type {libtess.PQHandle} */(eUp.org.pqHandle));
      libtess.sweep.spliceMergeVertices_(tess, eLo.oPrev(), eUp);
    }

  } else {
    if (libtess.geom.edgeSign(eUp.dst(), eLo.org, eUp.org) < 0) {
      return false;
    }

    // eLo.org appears to be above eUp, so splice eLo.org into eUp
    regUp.regionAbove().dirty = regUp.dirty = true;
    libtess.mesh.splitEdge(eUp.sym);
    libtess.mesh.meshSplice(eLo.oPrev(), eUp);
  }

  return true;
};

/**
 * Check the upper and lower edge of regUp to make sure that the
 * eUp.dst() is above eLo, or eLo.dst() is below eUp (depending on which
 * destination is rightmost).
 *
 * Theoretically, this should always be true. However, splitting an edge
 * into two pieces can change the results of previous tests. For example,
 * suppose at one point we checked eUp and eLo, and decided that eUp.dst()
 * is barely above eLo. Then later, we split eLo into two edges (eg. from
 * a splice operation like this one). This can change the result of
 * the test so that now eUp.dst() is incident to eLo, or barely below it.
 * We must correct this condition to maintain the dictionary invariants
 * (otherwise new edges might get inserted in the wrong place in the
 * dictionary, and bad stuff will happen).
 *
 * We fix the problem by just splicing the offending vertex into the
 * other edge.
 *
 * @private
 * @param {libtess.GluTesselator} tess description]
 * @param {libtess.ActiveRegion} regUp [description]
 * @return {boolean} [description]
 */
libtess.sweep.checkForLeftSplice_ = function(tess, regUp) {
  var regLo = regUp.regionBelow();
  var eUp = regUp.eUp;
  var eLo = regLo.eUp;
  var e;

  libtess.assert(!libtess.geom.vertEq(eUp.dst(), eLo.dst()));

  if (libtess.geom.vertLeq(eUp.dst(), eLo.dst())) {
    if (libtess.geom.edgeSign(eUp.dst(), eLo.dst(), eUp.org) < 0) {
      return false;
    }

    // eLo.dst() is above eUp, so splice eLo.dst() into eUp
    regUp.regionAbove().dirty = regUp.dirty = true;
    e = libtess.mesh.splitEdge(eUp);
    libtess.mesh.meshSplice(eLo.sym, e);
    e.lFace.inside = regUp.inside;

  } else {
    if (libtess.geom.edgeSign(eLo.dst(), eUp.dst(), eLo.org) > 0) {
      return false;
    }

    // eUp.dst() is below eLo, so splice eUp.dst() into eLo
    regUp.dirty = regLo.dirty = true;
    e = libtess.mesh.splitEdge(eLo);
    libtess.mesh.meshSplice(eUp.lNext, eLo.sym);
    e.rFace().inside = regUp.inside;
  }

  return true;
};

/**
 * Check the upper and lower edges of the given region to see if
 * they intersect. If so, create the intersection and add it
 * to the data structures.
 *
 * Returns true if adding the new intersection resulted in a recursive
 * call to addRightEdges_(); in this case all "dirty" regions have been
 * checked for intersections, and possibly regUp has been deleted.
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regUp [description]
 * @return {boolean} [description]
 */
libtess.sweep.checkForIntersect_ = function(tess, regUp) {
  var regLo = regUp.regionBelow();
  var eUp = regUp.eUp;
  var eLo = regLo.eUp;
  var orgUp = eUp.org;
  var orgLo = eLo.org;
  var dstUp = eUp.dst();
  var dstLo = eLo.dst();

  var isect = new libtess.GluVertex();

  libtess.assert(!libtess.geom.vertEq(dstLo, dstUp));
  libtess.assert(libtess.geom.edgeSign(dstUp, tess.event, orgUp) <= 0);
  libtess.assert(libtess.geom.edgeSign(dstLo, tess.event, orgLo) >= 0 );
  libtess.assert(orgUp !== tess.event && orgLo !== tess.event);
  libtess.assert(!regUp.fixUpperEdge && !regLo.fixUpperEdge);

  if (orgUp === orgLo) {
    // right endpoints are the same
    return false;
  }

  var tMinUp = Math.min(orgUp.t, dstUp.t);
  var tMaxLo = Math.max(orgLo.t, dstLo.t);
  if (tMinUp > tMaxLo) {
    // t ranges do not overlap
    return false;
  }

  if (libtess.geom.vertLeq(orgUp, orgLo)) {
    if (libtess.geom.edgeSign(dstLo, orgUp, orgLo) > 0) {
      return false;
    }
  } else {
    if (libtess.geom.edgeSign(dstUp, orgLo, orgUp) < 0) {
      return false;
    }
  }

  // At this point the edges intersect, at least marginally
  libtess.sweepDebugEvent( tess );

  libtess.geom.edgeIntersect(dstUp, orgUp, dstLo, orgLo, isect);
  
  // The following properties are guaranteed:
  libtess.assert(Math.min(orgUp.t, dstUp.t) <= isect.t);
  libtess.assert(isect.t <= Math.max(orgLo.t, dstLo.t));
  libtess.assert(Math.min(dstLo.s, dstUp.s) <= isect.s);
  libtess.assert(isect.s <= Math.max(orgLo.s, orgUp.s));

  if (libtess.geom.vertLeq(isect, tess.event)) {
    /* The intersection point lies slightly to the left of the sweep line,
     * so move it until it's slightly to the right of the sweep line.
     * (If we had perfect numerical precision, this would never happen
     * in the first place). The easiest and safest thing to do is
     * replace the intersection by tess.event.
     */
    isect.s = tess.event.s;
    isect.t = tess.event.t;
  }

  // TODO(bckenny): try to find test54.d
  /* Similarly, if the computed intersection lies to the right of the
   * rightmost origin (which should rarely happen), it can cause
   * unbelievable inefficiency on sufficiently degenerate inputs.
   * (If you have the test program, try running test54.d with the
   * "X zoom" option turned on).
   */
  var orgMin = libtess.geom.vertLeq(orgUp, orgLo) ? orgUp : orgLo;
  if (libtess.geom.vertLeq(orgMin, isect)) {
    isect.s = orgMin.s;
    isect.t = orgMin.t;
  }

  if (libtess.geom.vertEq(isect, orgUp) || libtess.geom.vertEq(isect, orgLo)) {
    // Easy case -- intersection at one of the right endpoints
    libtess.sweep.checkForRightSplice_(tess, regUp);
    return false;
  }

  if ((!libtess.geom.vertEq(dstUp, tess.event) && libtess.geom.edgeSign(dstUp, tess.event, isect) >= 0) ||
      (!libtess.geom.vertEq(dstLo, tess.event) && libtess.geom.edgeSign(dstLo, tess.event, isect) <= 0)) {
    /* Very unusual -- the new upper or lower edge would pass on the
     * wrong side of the sweep event, or through it. This can happen
     * due to very small numerical errors in the intersection calculation.
     */
    if (dstLo === tess.event) {
      // Splice dstLo into eUp, and process the new region(s)
      libtess.mesh.splitEdge(eUp.sym);
      libtess.mesh.meshSplice(eLo.sym, eUp);
      regUp = libtess.sweep.topLeftRegion_(regUp);
      eUp = regUp.regionBelow().eUp;
      libtess.sweep.finishLeftRegions_(tess, regUp.regionBelow(), regLo);
      libtess.sweep.addRightEdges_(tess, regUp, eUp.oPrev(), eUp, eUp, true);
      return true;
    }

    if (dstUp === tess.event) {
      // Splice dstUp into eLo, and process the new region(s)
      libtess.mesh.splitEdge(eLo.sym);
      libtess.mesh.meshSplice(eUp.lNext, eLo.oPrev());
      regLo = regUp;
      regUp = libtess.sweep.topRightRegion_(regUp);
      var e = regUp.regionBelow().eUp.rPrev();
      regLo.eUp = eLo.oPrev();
      eLo = libtess.sweep.finishLeftRegions_(tess, regLo, null);
      libtess.sweep.addRightEdges_(tess, regUp, eLo.oNext, eUp.rPrev(), e, true);
      return true;
    }

    /* Special case: called from connectRightVertex. If either
     * edge passes on the wrong side of tess.event, split it
     * (and wait for connectRightVertex to splice it appropriately).
     */
    if (libtess.geom.edgeSign(dstUp, tess.event, isect) >= 0) {
      regUp.regionAbove().dirty = regUp.dirty = true;
      libtess.mesh.splitEdge(eUp.sym);
      eUp.org.s = tess.event.s;
      eUp.org.t = tess.event.t;
    }

    if (libtess.geom.edgeSign(dstLo, tess.event, isect) <= 0) {
      regUp.dirty = regLo.dirty = true;
      libtess.mesh.splitEdge(eLo.sym);
      eLo.org.s = tess.event.s;
      eLo.org.t = tess.event.t;
    }

    // leave the rest for connectRightVertex
    return false;
  }

  /* General case -- split both edges, splice into new vertex.
   * When we do the splice operation, the order of the arguments is
   * arbitrary as far as correctness goes. However, when the operation
   * creates a new face, the work done is proportional to the size of
   * the new face. We expect the faces in the processed part of
   * the mesh (ie. eUp.lFace) to be smaller than the faces in the
   * unprocessed original contours (which will be eLo.oPrev.lFace).
   */
  libtess.mesh.splitEdge(eUp.sym);
  libtess.mesh.splitEdge(eLo.sym);
  libtess.mesh.meshSplice(eLo.oPrev(), eUp);
  eUp.org.s = isect.s;
  eUp.org.t = isect.t;
  eUp.org.pqHandle = tess.pq.insert(eUp.org);
  libtess.sweep.getIntersectData_(tess, eUp.org, orgUp, dstUp, orgLo, dstLo);
  regUp.regionAbove().dirty = regUp.dirty = regLo.dirty = true;

  return false;
};

/**
 * When the upper or lower edge of any region changes, the region is
 * marked "dirty". This routine walks through all the dirty regions
 * and makes sure that the dictionary invariants are satisfied
 * (see the comments at the beginning of this file). Of course,
 * new dirty regions can be created as we make changes to restore
 * the invariants.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regUp [description]
 */
libtess.sweep.walkDirtyRegions_ = function(tess, regUp) {
  var regLo = regUp.regionBelow();

  for ( ;; ) {
    // Find the lowest dirty region (we walk from the bottom up).
    while (regLo.dirty) {
      regUp = regLo;
      regLo = regLo.regionBelow();
    }
    if (!regUp.dirty) {
      regLo = regUp;
      regUp = regUp.regionAbove();
      if (regUp === null || !regUp.dirty) {
        // We've walked all the dirty regions
        return;
      }
    }

    regUp.dirty = false;
    var eUp = regUp.eUp;
    var eLo = regLo.eUp;

    if (eUp.dst() !== eLo.dst()) {
      // Check that the edge ordering is obeyed at the dst vertices.
      if (libtess.sweep.checkForLeftSplice_(tess, regUp)) {
        // If the upper or lower edge was marked fixUpperEdge, then
        // we no longer need it (since these edges are needed only for
        // vertices which otherwise have no right-going edges).
        if (regLo.fixUpperEdge) {
          libtess.sweep.deleteRegion_(tess, regLo);
          libtess.mesh.deleteEdge(eLo);
          regLo = regUp.regionBelow();
          eLo = regLo.eUp;

        } else if (regUp.fixUpperEdge) {
          libtess.sweep.deleteRegion_(tess, regUp);
          libtess.mesh.deleteEdge(eUp);
          regUp = regLo.regionAbove();
          eUp = regUp.eUp;
        }
      }
    }

    if (eUp.org !== eLo.org) {
      if (eUp.dst() !== eLo.dst() && !regUp.fixUpperEdge && !regLo.fixUpperEdge &&
          (eUp.dst() === tess.event || eLo.dst() === tess.event)) {
        /* When all else fails in checkForIntersect(), it uses tess.event
         * as the intersection location. To make this possible, it requires
         * that tess.event lie between the upper and lower edges, and also
         * that neither of these is marked fixUpperEdge (since in the worst
         * case it might splice one of these edges into tess.event, and
         * violate the invariant that fixable edges are the only right-going
         * edge from their associated vertex).
         */
        if (libtess.sweep.checkForIntersect_(tess, regUp)) {
          // walkDirtyRegions() was called recursively; we're done
          return;
        }

      } else {
        // Even though we can't use checkForIntersect(), the org vertices
        // may violate the dictionary edge ordering. Check and correct this.
        libtess.sweep.checkForRightSplice_(tess, regUp);
      }
    }

    if (eUp.org === eLo.org && eUp.dst() === eLo.dst()) {
      // A degenerate loop consisting of only two edges -- delete it.
      libtess.sweep.addWinding_(eLo, eUp);
      libtess.sweep.deleteRegion_(tess, regUp);
      libtess.mesh.deleteEdge(eUp);
      regUp = regLo.regionAbove();
    }
  }
};

/**
 * Purpose: connect a "right" vertex vEvent (one where all edges go left)
 * to the unprocessed portion of the mesh. Since there are no right-going
 * edges, two regions (one above vEvent and one below) are being merged
 * into one. regUp is the upper of these two regions.
 *
 * There are two reasons for doing this (adding a right-going edge):
 *  - if the two regions being merged are "inside", we must add an edge
 *    to keep them separated (the combined region would not be monotone).
 *  - in any case, we must leave some record of vEvent in the dictionary,
 *    so that we can merge vEvent with features that we have not seen yet.
 *    For example, maybe there is a vertical edge which passes just to
 *    the right of vEvent; we would like to splice vEvent into this edge.
 *
 * However, we don't want to connect vEvent to just any vertex. We don't
 * want the new edge to cross any other edges; otherwise we will create
 * intersection vertices even when the input data had no self-intersections.
 * (This is a bad thing; if the user's input data has no intersections,
 * we don't want to generate any false intersections ourselves.)
 *
 * Our eventual goal is to connect vEvent to the leftmost unprocessed
 * vertex of the combined region (the union of regUp and regLo).
 * But because of unseen vertices with all right-going edges, and also
 * new vertices which may be created by edge intersections, we don't
 * know where that leftmost unprocessed vertex is. In the meantime, we
 * connect vEvent to the closest vertex of either chain, and mark the region
 * as "fixUpperEdge". This flag says to delete and reconnect this edge
 * to the next processed vertex on the boundary of the combined region.
 * Quite possibly the vertex we connected to will turn out to be the
 * closest one, in which case we won't need to make any changes.
 *
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regUp [description]
 * @param {libtess.GluHalfEdge} eBottomLeft [description]
 */
libtess.sweep.connectRightVertex_ = function(tess, regUp, eBottomLeft) {
  var eTopLeft = eBottomLeft.oNext;
  var regLo = regUp.regionBelow();
  var eUp = regUp.eUp;
  var eLo = regLo.eUp;
  var degenerate = false;

  if (eUp.dst() !== eLo.dst()) {
    libtess.sweep.checkForIntersect_(tess, regUp);
  }

  // Possible new degeneracies: upper or lower edge of regUp may pass
  // through vEvent, or may coincide with new intersection vertex
  if (libtess.geom.vertEq(eUp.org, tess.event)) {
    libtess.mesh.meshSplice(eTopLeft.oPrev(), eUp);
    regUp = libtess.sweep.topLeftRegion_(regUp);
    eTopLeft = regUp.regionBelow().eUp;
    libtess.sweep.finishLeftRegions_(tess, regUp.regionBelow(), regLo);
    degenerate = true;
  }
  if (libtess.geom.vertEq(eLo.org, tess.event)) {
    libtess.mesh.meshSplice(eBottomLeft, eLo.oPrev());
    eBottomLeft = libtess.sweep.finishLeftRegions_(tess, regLo, null);
    degenerate = true;
  }
  if (degenerate) {
    libtess.sweep.addRightEdges_(tess, regUp, eBottomLeft.oNext, eTopLeft, eTopLeft, true);
    return;
  }

  // Non-degenerate situation -- need to add a temporary, fixable edge.
  // Connect to the closer of eLo.org, eUp.org.
  var eNew;
  if (libtess.geom.vertLeq(eLo.org, eUp.org)) {
    eNew = eLo.oPrev();
  } else {
    eNew = eUp;
  }
  eNew = libtess.mesh.connect(eBottomLeft.lPrev(), eNew);

  // Prevent cleanup, otherwise eNew might disappear before we've even
  // had a chance to mark it as a temporary edge.
  libtess.sweep.addRightEdges_(tess, regUp, eNew, eNew.oNext, eNew.oNext, false);
  eNew.sym.activeRegion.fixUpperEdge = true;
  libtess.sweep.walkDirtyRegions_(tess, regUp);
};

/**
 * The event vertex lies exacty on an already-processed edge or vertex.
 * Adding the new vertex involves splicing it into the already-processed
 * part of the mesh.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.ActiveRegion} regUp [description]
 * @param {libtess.GluVertex} vEvent [description]
 */
libtess.sweep.connectLeftDegenerate_ = function(tess, regUp, vEvent) {
  var e = regUp.eUp;
  if (libtess.geom.vertEq(e.org, vEvent)) {
    // e.org is an unprocessed vertex - just combine them, and wait
    // for e.org to be pulled from the queue
    libtess.assert(libtess.sweep.TOLERANCE_NONZERO_);
    libtess.sweep.spliceMergeVertices_(tess, e, vEvent.anEdge);
    return;
  }
  
  if (!libtess.geom.vertEq(e.dst(), vEvent)) {
    // General case -- splice vEvent into edge e which passes through it
    libtess.mesh.splitEdge(e.sym);

    if (regUp.fixUpperEdge) {
      // This edge was fixable -- delete unused portion of original edge
      libtess.mesh.deleteEdge(e.oNext);
      regUp.fixUpperEdge = false;
    }

    libtess.mesh.meshSplice(vEvent.anEdge, e);
    
    // recurse
    libtess.sweep.sweepEvent_(tess, vEvent);
    return;
  }

  // vEvent coincides with e.dst(), which has already been processed.
  // Splice in the additional right-going edges.
  libtess.assert(libtess.sweep.TOLERANCE_NONZERO_); // TODO(bckenny): are we supposed to not reach here?
  regUp = libtess.sweep.topRightRegion_(regUp);
  var reg = regUp.regionBelow();
  var eTopRight = reg.eUp.sym;
  var eTopLeft = eTopRight.oNext;
  var eLast = eTopLeft;

  if (reg.fixUpperEdge) {
    // Here e.dst() has only a single fixable edge going right.
    // We can delete it since now we have some real right-going edges.
    
    // there are some left edges too
    libtess.assert(eTopLeft !== eTopRight);
    libtess.sweep.deleteRegion_(tess, reg); // TODO(bckenny): something to null?
    libtess.mesh.deleteEdge(eTopRight);
    eTopRight = eTopLeft.oPrev();
  }

  libtess.mesh.meshSplice(vEvent.anEdge, eTopRight);
  if (!libtess.geom.edgeGoesLeft(eTopLeft)) {
    // e.dst() had no left-going edges -- indicate this to addRightEdges()
    eTopLeft = null;
  }

  libtess.sweep.addRightEdges_(tess, regUp, eTopRight.oNext, eLast, eTopLeft, true);
};

/**
 * Connect a "left" vertex (one where both edges go right)
 * to the processed portion of the mesh. Let R be the active region
 * containing vEvent, and let U and L be the upper and lower edge
 * chains of R. There are two possibilities:
 *
 * - the normal case: split R into two regions, by connecting vEvent to
 *   the rightmost vertex of U or L lying to the left of the sweep line
 *
 * - the degenerate case: if vEvent is close enough to U or L, we
 *   merge vEvent into that edge chain. The subcases are:
 *  - merging with the rightmost vertex of U or L
 *  - merging with the active edge of U or L
 *  - merging with an already-processed portion of U or L
 *
 * @private
 * @param {libtess.GluTesselator} tess   [description]
 * @param {libtess.GluVertex} vEvent [description]
 */
libtess.sweep.connectLeftVertex_ = function(tess, vEvent) {
  // TODO(bckenny): tmp only used for sweep. better to keep tmp across calls?
  var tmp = new libtess.ActiveRegion();

  // NOTE(bckenny): this was commented out in the original
  // libtess.assert(vEvent.anEdge.oNext.oNext === vEvent.anEdge);

  // Get a pointer to the active region containing vEvent
  tmp.eUp = vEvent.anEdge.sym;
  var regUp = /** @type {libtess.ActiveRegion} */(tess.dict.search(tmp).getKey());
  var regLo = regUp.regionBelow();
  var eUp = regUp.eUp;
  var eLo = regLo.eUp;

  // try merging with U or L first
  if (libtess.geom.edgeSign(eUp.dst(), vEvent, eUp.org) === 0) {
    libtess.sweep.connectLeftDegenerate_(tess, regUp, vEvent);
    return;
  }

  // Connect vEvent to rightmost processed vertex of either chain.
  // e.dst() is the vertex that we will connect to vEvent.
  var reg = libtess.geom.vertLeq(eLo.dst(), eUp.dst()) ? regUp : regLo;
  var eNew;
  if (regUp.inside || reg.fixUpperEdge) {
    if (reg === regUp) {
      eNew = libtess.mesh.connect(vEvent.anEdge.sym, eUp.lNext);

    } else {
      var tempHalfEdge = libtess.mesh.connect(eLo.dNext(), vEvent.anEdge);
      eNew = tempHalfEdge.sym;
    }

    if (reg.fixUpperEdge) {
      libtess.sweep.fixUpperEdge_(reg, eNew);

    } else {
      libtess.sweep.computeWinding_(tess, libtess.sweep.addRegionBelow_(tess, regUp, eNew));
    }
    libtess.sweep.sweepEvent_(tess, vEvent);

  } else {
    // The new vertex is in a region which does not belong to the polygon.
    // We don''t need to connect this vertex to the rest of the mesh.
    libtess.sweep.addRightEdges_(tess, regUp, vEvent.anEdge, vEvent.anEdge, null, true);
  }
};

/**
 * Does everything necessary when the sweep line crosses a vertex.
 * Updates the mesh and the edge dictionary.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {libtess.GluVertex} vEvent [description]
 */
libtess.sweep.sweepEvent_ = function(tess, vEvent) {
  tess.event = vEvent; // for access in edgeLeq_ // TODO(bckenny): wuh?
  libtess.sweepDebugEvent( tess );
  
  /* Check if this vertex is the right endpoint of an edge that is
   * already in the dictionary.  In this case we don't need to waste
   * time searching for the location to insert new edges.
   */
  var e = vEvent.anEdge;
  while (e.activeRegion === null) {
    e = e.oNext;
    if (e === vEvent.anEdge) {
      // All edges go right -- not incident to any processed edges
      libtess.sweep.connectLeftVertex_(tess, vEvent);
      return;
    }
  }

  /* Processing consists of two phases: first we "finish" all the
   * active regions where both the upper and lower edges terminate
   * at vEvent (ie. vEvent is closing off these regions).
   * We mark these faces "inside" or "outside" the polygon according
   * to their winding number, and delete the edges from the dictionary.
   * This takes care of all the left-going edges from vEvent.
   */
  var regUp = libtess.sweep.topLeftRegion_(e.activeRegion);
  var reg = regUp.regionBelow();
  var eTopLeft = reg.eUp;
  var eBottomLeft = libtess.sweep.finishLeftRegions_(tess, reg, null);

  /* Next we process all the right-going edges from vEvent. This
   * involves adding the edges to the dictionary, and creating the
   * associated "active regions" which record information about the
   * regions between adjacent dictionary edges.
   */
  if (eBottomLeft.oNext === eTopLeft) {
    // No right-going edges -- add a temporary "fixable" edge
    libtess.sweep.connectRightVertex_(tess, regUp, eBottomLeft);

  } else {
    libtess.sweep.addRightEdges_(tess, regUp, eBottomLeft.oNext, eTopLeft, eTopLeft, true);
  }
};

/**
 * We add two sentinel edges above and below all other edges,
 * to avoid special cases at the top and bottom.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 * @param {number} t [description]
 */
libtess.sweep.addSentinel_ = function(tess, t) {
  var reg = new libtess.ActiveRegion();

  var e = libtess.mesh.makeEdge(tess.mesh);

  e.org.s = libtess.sweep.SENTINEL_COORD_;
  e.org.t = t;
  e.dst().s = -libtess.sweep.SENTINEL_COORD_;
  e.dst().t = t;
  tess.event = e.dst(); //initialize it

  reg.eUp = e;
  reg.windingNumber = 0;
  reg.inside = false;
  reg.fixUpperEdge = false;
  reg.sentinel = true;
  reg.dirty = false;
  reg.nodeUp = tess.dict.insert(reg);
};

/**
 * We maintain an ordering of edge intersections with the sweep line.
 * This order is maintained in a dynamic dictionary.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 */
libtess.sweep.initEdgeDict_ = function(tess) {
  // TODO(bckenny): need to cast edgeLeq_?
  tess.dict = new libtess.Dict(tess,
      /** @type {function(Object, Object, Object): boolean} */(libtess.sweep.edgeLeq_));

  libtess.sweep.addSentinel_(tess, -libtess.sweep.SENTINEL_COORD_);
  libtess.sweep.addSentinel_(tess, libtess.sweep.SENTINEL_COORD_);
};

/**
 * [doneEdgeDict_ description]
 * @private
 * @param {libtess.GluTesselator} tess [description]
 */
libtess.sweep.doneEdgeDict_ = function(tess) {
  var fixedEdges = 0;

  var reg;
  while ((reg = /** @type {libtess.ActiveRegion} */(tess.dict.getMin().getKey())) !== null) {
    // At the end of all processing, the dictionary should contain
    // only the two sentinel edges, plus at most one "fixable" edge
    // created by connectRightVertex().
    if (!reg.sentinel) {
      libtess.assert(reg.fixUpperEdge);
      libtess.assert(++fixedEdges === 1);
    }
    libtess.assert(reg.windingNumber === 0);
    libtess.sweep.deleteRegion_(tess, reg);
  }

  tess.dict.deleteDict(); // TODO(bckenny): not necessary
  tess.dict = null;
};

/**
 * Remove zero-length edges, and contours with fewer than 3 vertices.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 */
libtess.sweep.removeDegenerateEdges_ = function(tess) {
  var eHead = tess.mesh.eHead;

  var eNext;
  for (var e = eHead.next; e !== eHead; e = eNext) {
    eNext = e.next;
    var eLNext = e.lNext;
    
    if (libtess.geom.vertEq(e.org, e.dst()) && e.lNext.lNext !== e) {
      // Zero-length edge, contour has at least 3 edges
      libtess.sweep.spliceMergeVertices_(tess, eLNext, e); // deletes e.org
      libtess.mesh.deleteEdge(e); // e is a self-loop TODO(bckenny): does this comment really apply here?
      e = eLNext;
      eLNext = e.lNext;
    }

    if (eLNext.lNext === e) {
      // Degenerate contour (one or two edges)
      if (eLNext !== e) {
        if (eLNext === eNext || eLNext === eNext.sym) {
          eNext = eNext.next;
        }
        libtess.mesh.deleteEdge(eLNext);
      }

      if (e === eNext || e === eNext.sym ) {
        eNext = eNext.next;
      }
      libtess.mesh.deleteEdge(e);
    }
  }
};

/**
 * Construct priority queue and insert all vertices into it, which determines
 * the order in which vertices cross the sweep line.
 * @private
 * @param {libtess.GluTesselator} tess [description]
 */
libtess.sweep.initPriorityQ_ = function(tess) {
  // TODO(bckenny): libtess.geom.vertLeq needs cast?
  var pq = new libtess.PriorityQ(
      /** @type {function(Object, Object): boolean} */(libtess.geom.vertLeq));
  tess.pq = pq;

  var vHead = tess.mesh.vHead;
  var v;
  for (v = vHead.next; v !== vHead; v = v.next) {
    v.pqHandle = pq.insert(v);
  }

  pq.init();
};

/**
 * [donePriorityQ_ description]
 * @private
 * @param {libtess.GluTesselator} tess [description]
 */
libtess.sweep.donePriorityQ_ = function(tess) {
  // TODO(bckenny): probably don't need deleteQ. check that function for comment
  tess.pq.deleteQ();
  tess.pq = null;
};

/**
 * Delete any degenerate faces with only two edges. walkDirtyRegions()
 * will catch almost all of these, but it won't catch degenerate faces
 * produced by splice operations on already-processed edges.
 * The two places this can happen are in finishLeftRegions(), when
 * we splice in a "temporary" edge produced by connectRightVertex(),
 * and in checkForLeftSplice(), where we splice already-processed
 * edges to ensure that our dictionary invariants are not violated
 * by numerical errors.
 *
 * In both these cases it is *very* dangerous to delete the offending
 * edge at the time, since one of the routines further up the stack
 * will sometimes be keeping a pointer to that edge.
 *
 * @private
 * @param {libtess.GluMesh} mesh [description]
 */
libtess.sweep.removeDegenerateFaces_ = function(mesh) {
  var fNext;
  for (var f = mesh.fHead.next; f !== mesh.fHead; f = fNext) {
    fNext = f.next;
    var e = f.anEdge;
    libtess.assert(e.lNext !== e);

    if (e.lNext.lNext === e) {
      // A face with only two edges
      libtess.sweep.addWinding_(e.oNext, e);
      libtess.mesh.deleteEdge(e);
    }
  }
};
