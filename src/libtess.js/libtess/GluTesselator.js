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
// require libtess.mesh
// require libtess.tessmono
// require libtess.render
// require libtess.normal
// require libtess.sweep
/*global libtess */

// TODO(bckenny): options for just triangles, just tristrips, single tristrip w/ resets
// other primitives with index buffer? would have to add a better tristrip extractor
// monotone poly -> tristrip seems possible...

// TODO(bckenny): create more javascript-y API, e.g. make gluTessEndPolygon async,
// don't require so many temp objects created



/**
 * [GluTesselator description]
 *
 * @constructor
 */
libtess.GluTesselator = function() {
  // Only initialize fields which can be changed by the api. Other fields
  // are initialized where they are used.

  // TODO(bckenny): many of these can be made private
  // TODO(bckenny): can we combine call* and call*Data functions?

  /*** state needed for collecting the input data ***/

  /**
   * what begin/end calls have we seen?
   * @type {libtess.tessState}
   */
  this.state = libtess.tessState.T_DORMANT;

  /**
   * lastEdge_.org is the most recent vertex
   * @private
   * @type {libtess.GluHalfEdge}
   */
  this.lastEdge_ = null;

  /**
   * stores the input contours, and eventually the tessellation itself
   * @type {libtess.GluMesh}
   */
  this.mesh = null;
  // NOTE(bckenny): initialized in this.emptyCache_

  /**
   * Error callback.
   * @private
   * @type {?function((libtess.errorType|libtess.gluEnum))}
   */
  this.callError_ = null;


  /*** state needed for projecting onto the sweep plane ***/

  /**
   * user-specified normal (if provided)
   * @type {Array.<number>}
   */
  this.normal = [0, 0, 0];
  // TODO(bckenny): better way to init these arrays?

  /**
   * unit vector in s-direction (debugging)
   * @type {Array.<number>}
   */
  this.sUnit = [0, 0, 0];

  /**
   * unit vector in t-direction (debugging)
   * @type {Array.<number>}
   */
  this.tUnit = [0, 0, 0];

  /*** state needed for the line sweep ***/
  // TODO(bckenny): this could be moved to a sweep state object of some sort

  /**
   * tolerance for merging features
   * @type {number}
   */
  this.relTolerance = libtess.GLU_TESS_DEFAULT_TOLERANCE;

  /**
   * rule for determining polygon interior
   * @type {libtess.windingRule}
   */
  this.windingRule = libtess.windingRule.GLU_TESS_WINDING_ODD;

  /**
   * fatal error: needed combine callback
   * @type {boolean}
   */
  this.fatalError = false;

  /**
   * edge dictionary for sweep line
   * @type {libtess.Dict}
   */
  this.dict = null;
  // NOTE(bckenny): dict initialized in sweep.initEdgeDict_, removed in sweep.doneEdgeDict_

  /**
   * priority queue of vertex events
   * @type {libtess.PriorityQ}
   */
  this.pq = null;
  // NOTE(bckenny): pq initialized in sweep.initPriorityQ

  /**
   * current sweep event being processed
   * @type {libtess.GluVertex}
   */
  this.event = null;

  /**
   * Combine callback.
   * @private
   * @type {?function(Array.<number>, Array.<Object>, Array.<number>): Object}
   */
  this.callCombine_ = null;

  /*** state needed for rendering callbacks (see render.js) ***/

  /**
   * mark boundary edges (use EdgeFlag)
   * @type {boolean}
   */
  this.flagBoundary = false;

  /**
   * Extract contours, not triangles
   * @type {boolean}
   */
  this.boundaryOnly = false;

  /**
   * list of triangles which could not be rendered as strips or fans
   * @type {libtess.GluFace}
   */
  this.lonelyTriList = null;

  /**
   * Begin callback.
   * @private
   * @type {?function(libtess.primitiveType)}
   */
  this.callBegin_ = null;

  /**
   * Edge flag callback.
   * @private
   * @type {?function(boolean)}
   */
  this.callEdgeFlag_ = null;

  /**
   * Vertex callback.
   * @private
   * @type {?function(Object)}
   */
  this.callVertex_ = null;

  /**
   * End callback.
   * @private
   * @type {?function()}
   */
  this.callEnd_ = null;

  /**
   * Mesh callback.
   * @private
   * @type {?function(libtess.GluMesh)}
   */
  this.callMesh_ = null;

  /*** rendering callbacks that also pass polygon data  ***/
  /**
   * BeginData callback.
   * @private
   * @type {?function(libtess.primitiveType, Object)}
   */
  this.callBeginData_ = null;

  /**
   * EdgeFlagData callback.
   * @private
   * @type {?function(boolean, Object)}
   */
  this.callEdgeFlagData_ = null;

  /**
   * VertexData callback.
   * @private
   * @type {?function(Object, Object)}
   */
  this.callVertexData_ = null;

  /**
   * EndData callback.
   * @private
   * @type {?function(Object)}
   */
  this.callEndData_ = null;

  /**
   * ErrorData callback.
   * @private
   * @type {?function((libtess.errorType|libtess.gluEnum), Object)}
   */
  this.callErrorData_ = null;

  /**
   * CombineData callback.
   * @private
   * @type {?function(Array.<number>, Array.<Object>, Array.<number>, Object): Object}
   */
  this.callCombineData_ = null;

  /**
   * client data for current polygon
   * @private
   * @type {Object}
   */
  this.polygonData_ = null;

  /*** state needed to cache single-contour polygons for renderCache() ***/
  /**
   * empty cache on next vertex() call
   * @type {boolean}
   */
  this.emptyCache = false;
  // TODO(bckenny): possibly rename to be clear it's a boolean

  /**
   * number of cached vertices
   * @type {number}
   */
  this.cacheCount = 0;

  /**
   * the vertex data
   * @type {Array.<libtess.CachedVertex>}
   */
  this.cache = new Array(libtess.TESS_MAX_CACHE);

  // TODO(bckenny): fill now? or init on demand
  for (var i = 0; i < libtess.TESS_MAX_CACHE; i++) {
    this.cache[i] = new libtess.CachedVertex();
  }
};


/**
 * Destory the tesselator object. See README.
 */
libtess.GluTesselator.prototype.gluDeleteTess = function() {
  // TODO(bckenny): do we need a public API for this still?
  this.requireState_(libtess.tessState.T_DORMANT);
  // memFree(tess); TODO(bckenny)
};


/**
 * Set properties for control over tesselation. See README.
 * @param {libtess.gluEnum} which [description].
 * @param {number|boolean} value [description].
 */
libtess.GluTesselator.prototype.gluTessProperty = function(which, value) {
  // TODO(bckenny): split into more setters?
  // TODO(bckenny): in any case, we can do better than this switch statement

  switch (which) {
    case libtess.gluEnum.GLU_TESS_TOLERANCE:
      if (value < 0 || value > 1) {
        break;
      }
      this.relTolerance = /** @type {number} */(value);
      return;

    case libtess.gluEnum.GLU_TESS_WINDING_RULE:
      var windingRule = /** @type {libtess.windingRule} */(value);

      switch (windingRule) {
        case libtess.windingRule.GLU_TESS_WINDING_ODD:
        case libtess.windingRule.GLU_TESS_WINDING_NONZERO:
        case libtess.windingRule.GLU_TESS_WINDING_POSITIVE:
        case libtess.windingRule.GLU_TESS_WINDING_NEGATIVE:
        case libtess.windingRule.GLU_TESS_WINDING_ABS_GEQ_TWO:
          this.windingRule = windingRule;
          return;
        default:
      }
      break;

    case libtess.gluEnum.GLU_TESS_BOUNDARY_ONLY:
      // TODO(bckenny): added boolean param type. make sure ok.
      this.boundaryOnly = !!value;
      return;

    default:
      this.callErrorOrErrorData(libtess.gluEnum.GLU_INVALID_ENUM);
      return;
  }
  this.callErrorOrErrorData(libtess.gluEnum.GLU_INVALID_VALUE);
};


/**
 * Returns tessellator property
 * @param {libtess.gluEnum} which [description].
 * @return {number|boolean} [description].
 */
libtess.GluTesselator.prototype.gluGetTessProperty = function(which) {
  // TODO(bckenny): as above, split into more getters? and improve on switch statement
  // why are these being asserted in getter but not setter?

  switch (which) {
    case libtess.gluEnum.GLU_TESS_TOLERANCE:
      // tolerance should be in range [0..1]
      libtess.assert(0 <= this.relTolerance && this.relTolerance <= 1);
      return this.relTolerance;

    case libtess.gluEnum.GLU_TESS_WINDING_RULE:
      var rule = this.windingRule;
      libtess.assert(rule === libtess.windingRule.GLU_TESS_WINDING_ODD ||
          rule === libtess.windingRule.GLU_TESS_WINDING_NONZERO ||
          rule === libtess.windingRule.GLU_TESS_WINDING_POSITIVE ||
          rule === libtess.windingRule.GLU_TESS_WINDING_NEGATIVE ||
          rule === libtess.windingRule.GLU_TESS_WINDING_ABS_GEQ_TWO);
      return rule;

    case libtess.gluEnum.GLU_TESS_BOUNDARY_ONLY:
      libtess.assert(this.boundaryOnly === true || this.boundaryOnly === false);
      return this.boundaryOnly;

    default:
      this.callErrorOrErrorData(libtess.gluEnum.GLU_INVALID_ENUM);
      break;
  }
  return false;
};


/**
 * Lets the user supply the polygon normal, if known.  All input data
 * is projected into a plane perpendicular to the normal before
 * tesselation. All output triangles are oriented CCW with
 * respect to the normal (CW orientation can be obtained by
 * reversing the sign of the supplied normal). For example, if
 * you know that all polygons lie in the x-y plane, call
 * "tess.gluTessNormal(0.0, 0.0, 1.0)" before rendering any polygons.
 *
 * @param {number} x [description].
 * @param {number} y [description].
 * @param {number} z [description].
 */
libtess.GluTesselator.prototype.gluTessNormal = function(x, y, z) {
  this.normal[0] = x;
  this.normal[1] = y;
  this.normal[2] = z;
};


/**
 * Specify callbacks. See README. A null or undefined opt_fn removes current callback.
 *
 * @param {libtess.gluEnum} which [description].
 * @param {?function()=} opt_fn [description].
 */
libtess.GluTesselator.prototype.gluTessCallback = function(which, opt_fn) {
  var fn = !opt_fn ? null : opt_fn;
  // TODO(bckenny): better opt_fn typing?

  switch (which) {
    case libtess.gluEnum.GLU_TESS_BEGIN:
      this.callBegin_ = /** @type {function(libtess.primitiveType)} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_BEGIN_DATA:
      this.callBeginData_ =
          /** @type {function(libtess.primitiveType, Object)} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_EDGE_FLAG:
      this.callEdgeFlag_ = /** @type {function(boolean)} */ (fn);
      // If the client wants boundary edges to be flagged,
      // we render everything as separate triangles (no strips or fans).
      this.flagBoundary = (!!fn);
      return;

    case libtess.gluEnum.GLU_TESS_EDGE_FLAG_DATA:
      this.callEdgeFlagData_ = /** @type {function(boolean, Object)} */ (fn);
      // If the client wants boundary edges to be flagged,
      // we render everything as separate triangles (no strips or fans).
      this.flagBoundary = (!!fn);
      return;

    case libtess.gluEnum.GLU_TESS_VERTEX:
      this.callVertex_ = /** @type {function(Object)} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_VERTEX_DATA:
      this.callVertexData_ = /** @type {function(Object, Object)} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_END:
      this.callEnd_ = /** @type {function()} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_END_DATA:
      this.callEndData_ = /** @type {function(Object)} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_ERROR:
      this.callError_ = /** @type {function((libtess.errorType|libtess.gluEnum))} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_ERROR_DATA:
      this.callErrorData_ =
          /** @type {function((libtess.errorType|libtess.gluEnum), Object)} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_COMBINE:
      this.callCombine_ = /** @type {function(Array.<number>, Array.<Object>, Array.<number>): Object} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_COMBINE_DATA:
      this.callCombineData_ = /** @type {function(Array.<number>, Array.<Object>, Array.<number>, Object): Object} */ (fn);
      return;

    case libtess.gluEnum.GLU_TESS_MESH:
      this.callMesh_ = /** @type {function(libtess.GluMesh)} */ (fn);
      return;

    default:
      this.callErrorOrErrorData(libtess.gluEnum.GLU_INVALID_ENUM);
      return;
  }
};


/**
 * Specify a vertex and associated data. Must be within calls to
 * beginContour/endContour. See README.
 *
 * @param {Array.<number>} coords [description].
 * @param {Object} data [description].
 */
libtess.GluTesselator.prototype.gluTessVertex = function(coords, data) {
  var tooLarge = false;

  // TODO(bckenny): pool allocation?
  var clamped = [0, 0, 0];

  this.requireState_(libtess.tessState.T_IN_CONTOUR);

  if (this.emptyCache) {
    this.emptyCache_();
    this.lastEdge_ = null;
  }

  for (var i = 0; i < 3; ++i) {
    var x = coords[i];
    if (x < -libtess.GLU_TESS_MAX_COORD) {
      x = -libtess.GLU_TESS_MAX_COORD;
      tooLarge = true;
    }
    if (x > libtess.GLU_TESS_MAX_COORD) {
      x = libtess.GLU_TESS_MAX_COORD;
      tooLarge = true;
    }
    clamped[i] = x;
  }

  if (tooLarge) {
    this.callErrorOrErrorData(libtess.errorType.GLU_TESS_COORD_TOO_LARGE);
  }

  if (this.mesh === null) {
    if (this.cacheCount < libtess.TESS_MAX_CACHE) {
      this.cacheVertex_(clamped, data);
      return;
    }

    // cache is full, create mesh and add cached verts to it
    this.emptyCache_();
  }

  this.addVertex_(clamped, data);
};


/**
 * [gluTessBeginPolygon description]
 * @param {Object} data Client data for current polygon.
 */
libtess.GluTesselator.prototype.gluTessBeginPolygon = function(data) {
  this.requireState_(libtess.tessState.T_DORMANT);

  this.state = libtess.tessState.T_IN_POLYGON;
  this.cacheCount = 0;
  this.emptyCache = false;
  this.mesh = null;

  this.polygonData_ = data;
};


/**
 * [gluTessBeginContour description]
 */
libtess.GluTesselator.prototype.gluTessBeginContour = function() {
  this.requireState_(libtess.tessState.T_IN_POLYGON);

  this.state = libtess.tessState.T_IN_CONTOUR;
  this.lastEdge_ = null;
  if (this.cacheCount > 0) {
    // Just set a flag so we don't get confused by empty contours
    // -- these can be generated accidentally with the obsolete
    // NextContour() interface.
    // TODO(bckenny): we aren't implementing NextContour() interface.
    this.emptyCache = true;
  }
};


/**
 * [gluTessEndContour description]
 */
libtess.GluTesselator.prototype.gluTessEndContour = function() {
  this.requireState_(libtess.tessState.T_IN_CONTOUR);
  this.state = libtess.tessState.T_IN_POLYGON;
};


/**
 * [gluTessEndPolygon description]
 */
libtess.GluTesselator.prototype.gluTessEndPolygon = function() {
  this.requireState_(libtess.tessState.T_IN_POLYGON);
  this.state = libtess.tessState.T_DORMANT;

  if (this.mesh === null) {
    if (!this.flagBoundary && !this.callMesh_) {
      // Try some special code to make the easy cases go quickly
      // (eg. convex polygons). This code does NOT handle multiple contours,
      // intersections, edge flags, and of course it does not generate
      // an explicit mesh either.
      if (libtess.render.renderCache(this)) {
        // TODO(bckenny): why only clear polygonData? does more need to be cleared?
        this.polygonData_ = null;
        return;
      }
    }
    this.emptyCache_();
  }

  // Determine the polygon normal and project vertices onto the plane
  // of the polygon.
  libtess.normal.projectPolygon(this);

  // computeInterior(tess) computes the planar arrangement specified
  // by the given contours, and further subdivides this arrangement
  // into regions. Each region is marked "inside" if it belongs
  // to the polygon, according to the rule given by this.windingRule.
  // Each interior region is guaranteed be monotone.
  libtess.sweep.computeInterior(this);

  if (!this.fatalError) {
    // If the user wants only the boundary contours, we throw away all edges
    // except those which separate the interior from the exterior.
    // Otherwise we tessellate all the regions marked "inside".
    if (this.boundaryOnly) {
      libtess.tessmono.setWindingNumber(this.mesh, 1, true);

    } else {
      libtess.tessmono.tessellateInterior(this.mesh);
    }

    this.mesh.checkMesh();

    if (this.callBegin_ || this.callEnd_ || this.callVertex_ ||
        this.callEdgeFlag_ || this.callBeginData_ || this.callEndData_ ||
        this.callVertexData_ || this.callEdgeFlagData_) {

      if (this.boundaryOnly) {
        // output boundary contours
        libtess.render.renderBoundary(this, this.mesh);

      } else {
        // output strips and fans
        libtess.render.renderMesh(this, this.mesh);
      }
    }

    if (this.callMesh_) {
      // Throw away the exterior faces, so that all faces are interior.
      // This way the user doesn't have to check the "inside" flag,
      // and we don't need to even reveal its existence. It also leaves
      // the freedom for an implementation to not generate the exterior
      // faces in the first place.
      libtess.tessmono.discardExterior(this.mesh);
      // user wants the mesh itself
      this.callMesh_(this.mesh);

      this.mesh = null;
      this.polygonData_ = null;
      return;
    }
  }

  libtess.mesh.deleteMesh(this.mesh);
  this.polygonData_ = null;
  this.mesh = null;
};


/**
 * Return the tessellator to its original dormant state.
 * @private
 */
libtess.GluTesselator.prototype.makeDormant_ = function() {
  if (this.mesh) {
    libtess.mesh.deleteMesh(this.mesh);
  }
  this.state = libtess.tessState.T_DORMANT;
  this.lastEdge_ = null;
  this.mesh = null;
};


/**
 * [requireState_ description]
 * @private
 * @param {libtess.tessState} state [description].
 */
libtess.GluTesselator.prototype.requireState_ = function(state) {
  if (this.state !== state) {
    this.gotoState_(state);
  }
};


/**
 * [gotoState_ description]
 * @private
 * @param  {libtess.tessState} newState [description].
 */
libtess.GluTesselator.prototype.gotoState_ = function(newState) {
  while (this.state !== newState) {
    // We change the current state one level at a time, to get to the desired
    // state.
    if (this.state < newState) {
      switch (this.state) {
        case libtess.tessState.T_DORMANT:
          this.callErrorOrErrorData(
              libtess.errorType.GLU_TESS_MISSING_BEGIN_POLYGON);
          this.gluTessBeginPolygon(null);
          break;

        case libtess.tessState.T_IN_POLYGON:
          this.callErrorOrErrorData(
              libtess.errorType.GLU_TESS_MISSING_BEGIN_CONTOUR);
          this.gluTessBeginContour();
          break;
      }

    } else {
      switch (this.state) {
        case libtess.tessState.T_IN_CONTOUR:
          this.callErrorOrErrorData(
              libtess.errorType.GLU_TESS_MISSING_END_CONTOUR);
          this.gluTessEndContour();
          break;

        case libtess.tessState.T_IN_POLYGON:
          this.callErrorOrErrorData(
              libtess.errorType.GLU_TESS_MISSING_END_POLYGON);
          // this.gluTessEndPolygon() is too much work!
          this.makeDormant_();
          break;
      }
    }
  }
};


/**
 * [addVertex_ description]
 * @private
 * @param {Array.<number>} coords [description].
 * @param {Object} data [description].
 */
libtess.GluTesselator.prototype.addVertex_ = function(coords, data) {
  var e = this.lastEdge_;
  if (e === null) {
    // Make a self-loop (one vertex, one edge).
    e = libtess.mesh.makeEdge(this.mesh);
    libtess.mesh.meshSplice(e, e.sym);

  } else {
    // Create a new vertex and edge which immediately follow e
    // in the ordering around the left face.
    libtess.mesh.splitEdge(e);
    e = e.lNext;
  }

  // The new vertex is now e.org.
  e.org.data = data;
  e.org.coords[0] = coords[0];
  e.org.coords[1] = coords[1];
  e.org.coords[2] = coords[2];

  // The winding of an edge says how the winding number changes as we
  // cross from the edge''s right face to its left face.  We add the
  // vertices in such an order that a CCW contour will add +1 to
  // the winding number of the region inside the contour.
  e.winding = 1;
  e.sym.winding = -1;

  this.lastEdge_ = e;
};


/**
 * [cacheVertex_ description]
 * @private
 * @param {Array.<number>} coords [description].
 * @param {Object} data [description].
 */
libtess.GluTesselator.prototype.cacheVertex_ = function(coords, data) {
  var v = this.cache[this.cacheCount];

  v.data = data;
  v.coords[0] = coords[0];
  v.coords[1] = coords[1];
  v.coords[2] = coords[2];
  ++this.cacheCount;
};


/**
 * [emptyCache_ description]
 * @private
 */
libtess.GluTesselator.prototype.emptyCache_ = function() {
  // NOTE(bckenny): surprise!
  this.mesh = new libtess.GluMesh();

  for (var i = 0; i < this.cacheCount; i++) {
    var v = this.cache[i];
    this.addVertex_(v.coords, v.data);
  }

  this.cacheCount = 0;
  this.emptyCache = false;
};


// TODO(bckenny): all following conditional callbacks could be simplified
// TODO(bckenny): using null for now, but may rework
// TODO(bckenny): should add documentation that references in callback are volatile (or make a copy)
// see README callback descriptions
/**
 * [callBeginOrBeginData description]
 * @param {libtess.primitiveType} type [description].
 */
libtess.GluTesselator.prototype.callBeginOrBeginData = function(type) {
  if (this.callBeginData_) {
    this.callBeginData_(type, this.polygonData_);

  } else if (this.callBegin_) {
    this.callBegin_(type);
  }
};


/**
 * [callVertexOrVertexData description]
 * @param {Object} data [description].
 */
libtess.GluTesselator.prototype.callVertexOrVertexData = function(data) {
  if (this.callVertexData_) {
    this.callVertexData_(data, this.polygonData_);

  } else if (this.callVertex_) {
    this.callVertex_(data);
  }
};


/**
 * [callEdgeFlagOrEdgeFlagData description]
 * @param {boolean} flag [description].
 */
libtess.GluTesselator.prototype.callEdgeFlagOrEdgeFlagData = function(flag) {
  if (this.callEdgeFlagData_) {
    this.callEdgeFlagData_(flag, this.polygonData_);

  } else if (this.callEdgeFlag_) {
    this.callEdgeFlag_(flag);
  }
};


/**
 * [callEndOrEndData description]
 */
libtess.GluTesselator.prototype.callEndOrEndData = function() {
  if (this.callEndData_) {
    this.callEndData_(this.polygonData_);

  } else if (this.callEnd_) {
    this.callEnd_();
  }
};


/**
 * [callCombineOrCombineData description]
 * @param {Array.<number>} coords [description].
 * @param {Array.<Object>} data [description].
 * @param {Array.<number>} weight [description].
 * @return {Object} Interpolated vertex.
 */
libtess.GluTesselator.prototype.callCombineOrCombineData =
    function(coords, data, weight) {

  var interpData;
  if (this.callCombineData_) {
    interpData = this.callCombineData_(coords, data, weight, this.polygonData_);

  } else if (this.callCombine_) {
    interpData = this.callCombine_(coords, data, weight);
  }

  // TODO(bckenny): can't be undefined
  if (interpData === undefined) {
    interpData = null;
  }
  return interpData;
};


// TODO(bckenny): combine the enums in libtess
/**
 * [callErrorOrErrorData description]
 * @param {(libtess.errorType|libtess.gluEnum)} errno [description].
 */
libtess.GluTesselator.prototype.callErrorOrErrorData = function(errno) {
  if (this.callErrorData_) {
    this.callErrorData_(errno, this.polygonData_);

  } else if (this.callError_) {
    this.callError_(errno);
  }
};
