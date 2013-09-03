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

/**
 * Base namespace.
 */
var libtess = libtess || {};

/**
 * @define {boolean} [DEBUG description]
 */
libtess.DEBUG = false;


/**
 * Checks if the condition evaluates to true if libtess.DEBUG is true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @throws {Error} Assertion failed, the condition evaluates to false.
 */
libtess.assert = function(condition, opt_message) {
  if (libtess.DEBUG && !condition) {
    throw new Error('Assertion failed' + (opt_message ? ': ' + opt_message : ''));
  }
};

/**
 * [sweepDebugEvent description]
 * @param {libtess.GluTesselator} tess
 */
libtess.sweepDebugEvent = function(tess) {
  // TODO(bckenny): closure debug flag/debugger support
  // sweep event updated
};

/**
 * [GLU_TESS_MAX_COORD description]
 * @type {number}
 * @const
 */
libtess.GLU_TESS_MAX_COORD = 1e150;
// NOTE(bckenny): from glu.pl generator

/**
 * [TRUE_PROJECT description]
 * TODO(bckenny): see alg-outline for description
 *
 * @type {boolean}
 */
libtess.TRUE_PROJECT = false;

/**
 * We cache vertex data for single-contour polygons so that we can
 * try a quick-and-dirty decomposition first.
 * @type {number}
 * @const
 */
libtess.TESS_MAX_CACHE = 100;

/**
 * [GLU_TESS_DEFAULT_TOLERANCE description]
 * @type {number}
 * @const
 */
libtess.GLU_TESS_DEFAULT_TOLERANCE = 0.0;

/**
 * The begin/end calls must be properly nested. We keep track of
 * the current state to enforce the ordering.
 *
 * @enum {number}
 */
libtess.tessState = {
  // TODO(bckenny): only used in GluTesselator, probably move there
  T_DORMANT: 0,
  T_IN_POLYGON: 1,
  T_IN_CONTOUR: 2
};

/**
 * The input contours parition the plane into regions. A winding
 * rule determines which of these regions are inside the polygon.
 *
 * For a single contour C, the winding number of a point x is simply
 * the signed number of revolutions we make around x as we travel
 * once around C (where CCW is positive). When there are several
 * contours, the individual winding numbers are summed.  This
 * procedure associates a signed integer value with each point x in
 * the plane. Note that the winding number is the same for all
 * points in a single region.
 *
 * The winding rule classifies a region as "inside" if its winding
 * number belongs to the chosen category (odd, nonzero, positive,
 * negative, or absolute value of at least two).  The current GLU
 * tesselator implements the "odd" rule.  The "nonzero" rule is another
 * common way to define the interior. The other three rules are
 * useful for polygon CSG operations.
 *
 * @enum {number}
 */
libtess.windingRule = {
  // NOTE(bckenny): values from enumglu.spec
  // TODO(bckenny): need to export when compiled
  GLU_TESS_WINDING_ODD: 100130,
  GLU_TESS_WINDING_NONZERO: 100131,
  GLU_TESS_WINDING_POSITIVE: 100132,
  GLU_TESS_WINDING_NEGATIVE: 100133,
  GLU_TESS_WINDING_ABS_GEQ_TWO: 100134
};

/**
 * The type of primitive return from a "begin" callback. GL_LINE_LOOP is only
 * returned when GLU_TESS_BOUNDARY_ONLY is true. Values of enum match WebGL
 * constants.
 *
 * @enum {number}
 */
libtess.primitiveType = {
  // TODO(bckenny): doc types
  // TODO(bckenny): need to export when compiled, but can just use webgl constants when available
  GL_LINE_LOOP: 2,
  GL_TRIANGLES: 4,
  GL_TRIANGLE_STRIP: 5,
  GL_TRIANGLE_FAN: 6
};

/**
 * The types of errors provided to error callback.
 * @enum {number}
 */
libtess.errorType = {
  // TODO(bckenny) doc types
  // NOTE(bckenny): values from enumglu.spec
  GLU_TESS_MISSING_BEGIN_POLYGON: 100151,
  GLU_TESS_MISSING_END_POLYGON: 100153,
  GLU_TESS_MISSING_BEGIN_CONTOUR: 100152,
  GLU_TESS_MISSING_END_CONTOUR: 100154,
  GLU_TESS_COORD_TOO_LARGE: 100155,
  GLU_TESS_NEED_COMBINE_CALLBACK: 100156
};

/**
 * GLU enums necessary for this project.
 * see enumglu.spec
 * TODO(bckenny): better source for these?
 *
 * @enum {number}
 */
libtess.gluEnum = {
  // NOTE(bckenny): values from enumglu.spec
  // TODO(bckenny): most enums under here? drop GLU? or rename in other ways
  GLU_TESS_MESH: 100112,  // from tess.c
  GLU_TESS_TOLERANCE: 100142,
  GLU_TESS_WINDING_RULE: 100140,
  GLU_TESS_BOUNDARY_ONLY: 100141,

  // TODO(bckenny): should this live in errorType?
  GLU_INVALID_ENUM: 100900,
  GLU_INVALID_VALUE: 100901,

  GLU_TESS_BEGIN: 100100,
  GLU_TESS_VERTEX: 100101,
  GLU_TESS_END: 100102,
  GLU_TESS_ERROR: 100103,
  GLU_TESS_EDGE_FLAG: 100104,
  GLU_TESS_COMBINE: 100105,
  GLU_TESS_BEGIN_DATA: 100106,
  GLU_TESS_VERTEX_DATA: 100107,
  GLU_TESS_END_DATA: 100108,
  GLU_TESS_ERROR_DATA: 100109,
  GLU_TESS_EDGE_FLAG_DATA: 100110,
  GLU_TESS_COMBINE_DATA: 100111
};

/** @typedef {number} */
libtess.PQHandle;

// TODO(bckenny): better typing on key?
/** @typedef {Object} */
libtess.PQKey;
