goog.provide('ol.render.webgl.PolygonReplay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.geom.flat.contains');
goog.require('ol.geom.flat.orient');
goog.require('ol.geom.flat.transform');
goog.require('ol.render.webgl.polygonreplay.defaultshader');
goog.require('ol.render.webgl.LineStringReplay');
goog.require('ol.render.webgl.Replay');
goog.require('ol.render.webgl');
goog.require('ol.style.Stroke');
goog.require('ol.structs.LinkedList');
goog.require('ol.structs.RBush');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');


/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.PolygonReplay = function(tolerance, maxExtent) {
  ol.render.webgl.Replay.call(this, tolerance, maxExtent);

  this.lineStringReplay = new ol.render.webgl.LineStringReplay(
      tolerance, maxExtent);

  /**
   * @private
   * @type {ol.render.webgl.polygonreplay.defaultshader.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {Array.<Array.<number>>}
   */
  this.styles_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.styleIndices_ = [];

  /**
   * @private
   * @type {{fillColor: (Array.<number>|null),
   *         changed: boolean}|null}
   */
  this.state_ = {
    fillColor: null,
    changed: false
  };

};
ol.inherits(ol.render.webgl.PolygonReplay, ol.render.webgl.Replay);


/**
 * Draw one polygon.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} holeFlatCoordinates Hole flat coordinates.
 * @param {number} stride Stride.
 * @private
 */
ol.render.webgl.PolygonReplay.prototype.drawCoordinates_ = function(
    flatCoordinates, holeFlatCoordinates, stride) {
  // Triangulate the polygon
  var outerRing = new ol.structs.LinkedList();
  var rtree = new ol.structs.RBush();
  // Initialize the outer ring
  var maxX = this.processFlatCoordinates_(flatCoordinates, stride, outerRing, rtree, true);

  // Eliminate holes, if there are any
  if (holeFlatCoordinates.length) {
    var i, ii;
    var holeLists = [];
    for (i = 0, ii = holeFlatCoordinates.length; i < ii; ++i) {
      var holeList = {
        list: new ol.structs.LinkedList(),
        maxX: undefined
      };
      holeLists.push(holeList);
      holeList.maxX = this.processFlatCoordinates_(holeFlatCoordinates[i],
          stride, holeList.list, rtree, false);
    }
    holeLists.sort(function(a, b) {
      return b.maxX - a.maxX;
    });
    for (i = 0; i < holeLists.length; ++i) {
      this.bridgeHole_(holeLists[i].list, holeLists[i].maxX, outerRing, maxX, rtree);
    }
  }
  this.classifyPoints_(outerRing, rtree, false);
  this.triangulate_(outerRing, rtree);
};


/**
 * Inserts flat coordinates in a linked list and adds them to the vertex buffer.
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} stride Stride.
 * @param {ol.structs.LinkedList} list Linked list.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean} clockwise Coordinate order should be clockwise.
 * @return {number} Maximum X value.
 */
ol.render.webgl.PolygonReplay.prototype.processFlatCoordinates_ = function(
    flatCoordinates, stride, list, rtree, clockwise) {
  var isClockwise = ol.geom.flat.orient.linearRingIsClockwise(flatCoordinates,
      0, flatCoordinates.length, stride);
  var i, ii, maxX;
  var n = this.vertices.length / 2;
  /** @type {ol.WebglPolygonVertex} */
  var start;
  /** @type {ol.WebglPolygonVertex} */
  var p0;
  /** @type {ol.WebglPolygonVertex} */
  var p1;
  var extents = [];
  var segments = [];
  if (clockwise === isClockwise) {
    start = this.createPoint_(flatCoordinates[0], flatCoordinates[1], n++);
    p0 = start;
    maxX = flatCoordinates[0];
    for (i = stride, ii = flatCoordinates.length; i < ii; i += stride) {
      p1 = this.createPoint_(flatCoordinates[i], flatCoordinates[i + 1], n++);
      segments.push(this.insertItem_(p0, p1, list));
      extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
        Math.max(p0.y, p1.y)]);
      maxX = flatCoordinates[i] > maxX ? flatCoordinates[i] : maxX;
      p0 = p1;
    }
    segments.push(this.insertItem_(p1, start, list));
    extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
      Math.max(p0.y, p1.y)]);
  } else {
    var end = flatCoordinates.length - stride;
    start = this.createPoint_(flatCoordinates[end], flatCoordinates[end + 1], n++);
    p0 = start;
    maxX = flatCoordinates[end];
    for (i = end - stride, ii = 0; i >= ii; i -= stride) {
      p1 = this.createPoint_(flatCoordinates[i], flatCoordinates[i + 1], n++);
      segments.push(this.insertItem_(p0, p1, list));
      extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
        Math.max(p0.y, p1.y)]);
      maxX = flatCoordinates[i] > maxX ? flatCoordinates[i] : maxX;
      p0 = p1;
    }
    segments.push(this.insertItem_(p1, start, list));
    extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
      Math.max(p0.y, p1.y)]);
  }
  rtree.load(extents, segments);

  return maxX;
};


/**
 * Classifies the points of a polygon list as convex, reflex. Removes collinear vertices.
 * @private
 * @param {ol.structs.LinkedList} list Polygon ring.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean} ccw The orientation of the polygon is counter-clockwise.
 * @return {boolean} There were reclassified points.
 */
ol.render.webgl.PolygonReplay.prototype.classifyPoints_ = function(list, rtree, ccw) {
  var start = list.firstItem();
  var s0 = start;
  var s1 = list.nextItem();
  var pointsReclassified = false;
  do {
    var reflex = ccw ? ol.render.webgl.triangleIsCounterClockwise(s1.p1.x,
        s1.p1.y, s0.p1.x, s0.p1.y, s0.p0.x, s0.p0.y) :
        ol.render.webgl.triangleIsCounterClockwise(s0.p0.x, s0.p0.y, s0.p1.x,
        s0.p1.y, s1.p1.x, s1.p1.y);
    if (reflex === undefined) {
      this.removeItem_(s0, s1, list, rtree);
      pointsReclassified = true;
      if (s1 === start) {
        start = list.getNextItem();
      }
      s1 = s0;
      list.prevItem();
    } else if (s0.p1.reflex !== reflex) {
      s0.p1.reflex = reflex;
      pointsReclassified = true;
    }
    s0 = s1;
    s1 = list.nextItem();
  } while (s0 !== start);
  return pointsReclassified;
};


/**
 * @private
 * @param {ol.structs.LinkedList} hole Linked list of the hole.
 * @param {number} holeMaxX Maximum X value of the hole.
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {number} listMaxX Maximum X value of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.bridgeHole_ = function(hole, holeMaxX,
    list, listMaxX, rtree) {
  this.classifyPoints_(hole, rtree, true);
  var seg = hole.firstItem();
  while (seg.p1.x !== holeMaxX) {
    seg = hole.nextItem();
  }

  var p1 = seg.p1;
  /** @type {ol.WebglPolygonVertex} */
  var p2 = {x: listMaxX, y: p1.y, i: -1};
  var minDist = Infinity;
  var i, ii, bestPoint;
  /** @type {ol.WebglPolygonVertex} */
  var p5;

  var intersectingSegments = this.getIntersections_({p0: p1, p1: p2}, rtree, true);
  for (i = 0, ii = intersectingSegments.length; i < ii; ++i) {
    var currSeg = intersectingSegments[i];
    if (currSeg.p0.reflex === undefined) {
      var intersection = this.calculateIntersection_(p1, p2, currSeg.p0,
          currSeg.p1, true);
      var dist = Math.abs(p1.x - intersection[0]);
      if (dist < minDist) {
        minDist = dist;
        p5 = {x: intersection[0], y: intersection[1], i: -1};
        seg = currSeg;
      }
    }
  }
  if (minDist === Infinity) {
    return;
  }
  bestPoint = seg.p1;

  if (minDist > 0) {
    var pointsInTriangle = this.getPointsInTriangle_(p1, p5, seg.p1, rtree);
    if (pointsInTriangle.length) {
      var theta = Infinity;
      for (i = 0, ii = pointsInTriangle.length; i < ii; ++i) {
        var currPoint = pointsInTriangle[i];
        var currTheta = Math.atan2(p1.y - currPoint.y, p2.x - currPoint.x);
        if (currTheta < theta || (currTheta === theta && currPoint.x < bestPoint.x)) {
          theta = currTheta;
          bestPoint = currPoint;
        }
      }
    }
  }

  seg = list.firstItem();
  while (seg.p1 !== bestPoint) {
    seg = list.nextItem();
  }

  //We clone the bridge points as they can have different convexity.
  var p0Bridge = {x: p1.x, y: p1.y, i: p1.i, reflex: undefined};
  var p1Bridge = {x: seg.p1.x, y: seg.p1.y, i: seg.p1.i, reflex: undefined};

  hole.getNextItem().p0 = p0Bridge;
  this.insertItem_(p1, seg.p1, hole, rtree);
  this.insertItem_(p1Bridge, p0Bridge, hole, rtree);
  seg.p1 = p1Bridge;
  hole.setFirstItem();
  list.concat(hole);
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.triangulate_ = function(list, rtree) {
  var ccw = false;
  var simple = this.isSimple_(list, rtree);

  // Start clipping ears
  while (list.getLength() > 3) {
    if (simple) {
      if (!this.clipEars_(list, rtree, simple, ccw)) {
        if (!this.classifyPoints_(list, rtree, ccw)) {
          // Due to the behavior of OL's PIP algorithm, the ear clipping cannot
          // introduce touching segments. However, the original data may have some.
          if (!this.resolveLocalSelfIntersections_(list, rtree, true)) {
            // Something went wrong.
            ol.DEBUG && console.assert(false, 'Unexpected simple polygon geometry');
            break;
          }
        }
      }
    } else {
      if (!this.clipEars_(list, rtree, simple, ccw)) {
        // We ran out of ears, try to reclassify.
        if (!this.classifyPoints_(list, rtree, ccw)) {
          // We have a bad polygon, try to resolve local self-intersections.
          if (!this.resolveLocalSelfIntersections_(list, rtree)) {
            simple = this.isSimple_(list, rtree);
            if (!simple) {
              // We have a really bad polygon, try more time consuming methods.
              this.splitPolygon_(list, rtree);
              break;
            } else {
              ccw = !this.isClockwise_(list);
              this.classifyPoints_(list, rtree, ccw);
            }
          }
        }
      }
    }
  }
  if (list.getLength() === 3) {
    var numIndices = this.indices.length;
    this.indices[numIndices++] = list.getPrevItem().p0.i;
    this.indices[numIndices++] = list.getCurrItem().p0.i;
    this.indices[numIndices++] = list.getNextItem().p0.i;
  }
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean} simple The polygon is simple.
 * @param {boolean} ccw Orientation of the polygon is counter-clockwise.
 * @return {boolean} There were processed ears.
 */
ol.render.webgl.PolygonReplay.prototype.clipEars_ = function(list, rtree, simple, ccw) {
  var numIndices = this.indices.length;
  var start = list.firstItem();
  var s0 = list.getPrevItem();
  var s1 = start;
  var s2 = list.nextItem();
  var s3 = list.getNextItem();
  var p0, p1, p2;
  var processedEars = false;
  do {
    p0 = s1.p0;
    p1 = s1.p1;
    p2 = s2.p1;
    if (p1.reflex === false) {
      // We might have a valid ear
      var diagonalIsInside = ccw ? this.diagonalIsInside_(s3.p1, p2, p1, p0,
          s0.p0) : this.diagonalIsInside_(s0.p0, p0, p1, p2, s3.p1);
      if ((simple || this.getIntersections_({p0: p0, p1: p2}, rtree).length === 0) &&
          diagonalIsInside && this.getPointsInTriangle_(p0, p1, p2, rtree, true).length === 0) {
        //The diagonal is completely inside the polygon
        if (simple || p0.reflex === false || p2.reflex === false ||
            ol.geom.flat.orient.linearRingIsClockwise([s0.p0.x, s0.p0.y, p0.x,
              p0.y, p1.x, p1.y, p2.x, p2.y, s3.p1.x, s3.p1.y], 0, 10, 2) === !ccw) {
          //The diagonal is persumably valid, we have an ear
          this.indices[numIndices++] = p0.i;
          this.indices[numIndices++] = p1.i;
          this.indices[numIndices++] = p2.i;
          this.removeItem_(s1, s2, list, rtree);
          if (s2 === start) {
            start = s3;
          }
          processedEars = true;
        }
      }
    }
    // Else we have a reflex point.
    s0 = list.getPrevItem();
    s1 = list.getCurrItem();
    s2 = list.nextItem();
    s3 = list.getNextItem();
  } while (s1 !== start && list.getLength() > 3);

  return processedEars;
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean=} opt_touch Resolve touching segments.
 * @return {boolean} There were resolved intersections.
*/
ol.render.webgl.PolygonReplay.prototype.resolveLocalSelfIntersections_ = function(
    list, rtree, opt_touch) {
  var start = list.firstItem();
  list.nextItem();
  var s0 = start;
  var s1 = list.nextItem();
  var resolvedIntersections = false;

  do {
    var intersection = this.calculateIntersection_(s0.p0, s0.p1, s1.p0, s1.p1,
        opt_touch);
    if (intersection) {
      var breakCond = false;
      var numVertices = this.vertices.length;
      var numIndices = this.indices.length;
      var n = numVertices / 2;
      var seg = list.prevItem();
      list.removeItem();
      rtree.remove(seg);
      breakCond = (seg === start);
      var p;
      if (opt_touch) {
        if (intersection[0] === s0.p0.x && intersection[1] === s0.p0.y) {
          list.prevItem();
          p = s0.p0;
          s1.p0 = p;
          rtree.remove(s0);
          breakCond = breakCond || (s0 === start);
        } else {
          p = s1.p1;
          s0.p1 = p;
          rtree.remove(s1);
          breakCond = breakCond || (s1 === start);
        }
        list.removeItem();
      } else {
        p = this.createPoint_(intersection[0], intersection[1], n);
        s0.p1 = p;
        s1.p0 = p;
        rtree.update([Math.min(s0.p0.x, s0.p1.x), Math.min(s0.p0.y, s0.p1.y),
          Math.max(s0.p0.x, s0.p1.x), Math.max(s0.p0.y, s0.p1.y)], s0);
        rtree.update([Math.min(s1.p0.x, s1.p1.x), Math.min(s1.p0.y, s1.p1.y),
          Math.max(s1.p0.x, s1.p1.x), Math.max(s1.p0.y, s1.p1.y)], s1);
      }

      this.indices[numIndices++] = seg.p0.i;
      this.indices[numIndices++] = seg.p1.i;
      this.indices[numIndices++] = p.i;

      resolvedIntersections = true;
      if (breakCond) {
        break;
      }
    }

    s0 = list.getPrevItem();
    s1 = list.nextItem();
  } while (s0 !== start);
  return resolvedIntersections;
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @return {boolean} The polygon is simple.
 */
ol.render.webgl.PolygonReplay.prototype.isSimple_ = function(list, rtree) {
  var start = list.firstItem();
  var seg = start;
  do {
    if (this.getIntersections_(seg, rtree).length) {
      return false;
    }
    seg = list.nextItem();
  } while (seg !== start);
  return true;
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @return {boolean} Orientation is clockwise.
 */
ol.render.webgl.PolygonReplay.prototype.isClockwise_ = function(list) {
  var length = list.getLength() * 2;
  var flatCoordinates = new Array(length);
  var start = list.firstItem();
  var seg = start;
  var i = 0;
  do {
    flatCoordinates[i++] = seg.p0.x;
    flatCoordinates[i++] = seg.p0.y;
    seg = list.nextItem();
  } while (seg !== start);
  return ol.geom.flat.orient.linearRingIsClockwise(flatCoordinates, 0, length, 2);
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.splitPolygon_ = function(list, rtree) {
  var start = list.firstItem();
  var s0 = start;
  do {
    var intersections = this.getIntersections_(s0, rtree);
    if (intersections.length) {
      var s1 = intersections[0];
      var n = this.vertices.length / 2;
      var intersection = this.calculateIntersection_(s0.p0,
          s0.p1, s1.p0, s1.p1);
      var p = this.createPoint_(intersection[0], intersection[1], n);
      var newPolygon = new ol.structs.LinkedList();
      var newRtree = new ol.structs.RBush();
      this.insertItem_(p, s0.p1, newPolygon, newRtree);
      s0.p1 = p;
      rtree.update([Math.min(s0.p0.x, p.x), Math.min(s0.p0.y, p.y),
        Math.max(s0.p0.x, p.x), Math.max(s0.p0.y, p.y)], s0);
      var currItem = list.nextItem();
      while (currItem !== s1) {
        this.insertItem_(currItem.p0, currItem.p1, newPolygon, newRtree);
        rtree.remove(currItem);
        list.removeItem();
        currItem = list.getCurrItem();
      }
      this.insertItem_(s1.p0, p, newPolygon, newRtree);
      s1.p0 = p;
      rtree.update([Math.min(s1.p1.x, p.x), Math.min(s1.p1.y, p.y),
        Math.max(s1.p1.x, p.x), Math.max(s1.p1.y, p.y)], s1);
      this.classifyPoints_(list, rtree, false);
      this.triangulate_(list, rtree);
      this.classifyPoints_(newPolygon, newRtree, false);
      this.triangulate_(newPolygon, newRtree);
      break;
    }
    s0 = list.nextItem();
  } while (s0 !== start);
};


/**
 * @private
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @param {number} i Index.
 * @return {ol.WebglPolygonVertex} List item.
 */
ol.render.webgl.PolygonReplay.prototype.createPoint_ = function(x, y, i) {
  var numVertices = this.vertices.length;
  this.vertices[numVertices++] = x;
  this.vertices[numVertices++] = y;
  /** @type {ol.WebglPolygonVertex} */
  var p = {
    x: x,
    y: y,
    i: i,
    reflex: undefined
  };
  return p;
};


/**
 * @private
 * @param {ol.WebglPolygonVertex} p0 First point of segment.
 * @param {ol.WebglPolygonVertex} p1 Second point of segment.
 * @param {ol.structs.LinkedList} list Polygon ring.
 * @param {ol.structs.RBush=} opt_rtree Insert the segment into the R-Tree.
 * @return {ol.WebglPolygonSegment} segment.
 */
ol.render.webgl.PolygonReplay.prototype.insertItem_ = function(p0, p1, list, opt_rtree) {
  var seg = {
    p0: p0,
    p1: p1
  };
  list.insertItem(seg);
  if (opt_rtree) {
    opt_rtree.insert([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y),
      Math.max(p0.x, p1.x), Math.max(p0.y, p1.y)], seg);
  }
  return seg;
};


 /**
  * @private
  * @param {ol.WebglPolygonSegment} s0 Segment before the remove candidate.
  * @param {ol.WebglPolygonSegment} s1 Remove candidate segment.
  * @param {ol.structs.LinkedList} list Polygon ring.
  * @param {ol.structs.RBush} rtree R-Tree of the polygon.
  */
ol.render.webgl.PolygonReplay.prototype.removeItem_ = function(s0, s1, list, rtree) {
  if (list.getCurrItem() === s1) {
    list.removeItem();
    s0.p1 = s1.p1;
    rtree.remove(s1);
    rtree.update([Math.min(s0.p0.x, s0.p1.x), Math.min(s0.p0.y, s0.p1.y),
      Math.max(s0.p0.x, s0.p1.x), Math.max(s0.p0.y, s0.p1.y)], s0);
  }
};


/**
 * @private
 * @param {ol.WebglPolygonVertex} p0 First point.
 * @param {ol.WebglPolygonVertex} p1 Second point.
 * @param {ol.WebglPolygonVertex} p2 Third point.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean=} opt_reflex Only include reflex points.
 * @return {Array.<ol.WebglPolygonVertex>} Points in the triangle.
 */
ol.render.webgl.PolygonReplay.prototype.getPointsInTriangle_ = function(p0, p1,
    p2, rtree, opt_reflex) {
  var i, ii, j, p;
  var result = [];
  var segmentsInExtent = rtree.getInExtent([Math.min(p0.x, p1.x, p2.x),
    Math.min(p0.y, p1.y, p2.y), Math.max(p0.x, p1.x, p2.x), Math.max(p0.y,
      p1.y, p2.y)]);
  for (i = 0, ii = segmentsInExtent.length; i < ii; ++i) {
    for (j in segmentsInExtent[i]) {
      p = segmentsInExtent[i][j];
      if (typeof p === 'object' && (!opt_reflex || p.reflex)) {
        if ((p.x !== p0.x || p.y !== p0.y) && (p.x !== p1.x || p.y !== p1.y) &&
            (p.x !== p2.x || p.y !== p2.y) && result.indexOf(p) === -1 &&
            ol.geom.flat.contains.linearRingContainsXY([p0.x, p0.y, p1.x, p1.y,
              p2.x, p2.y], 0, 6, 2, p.x, p.y)) {
          result.push(p);
        }
      }
    }
  }
  return result;
};


/**
 * @private
 * @param {ol.WebglPolygonSegment} segment Segment.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean=} opt_touch Touching segments should be considered an intersection.
 * @return {Array.<ol.WebglPolygonSegment>} Intersecting segments.
 */
ol.render.webgl.PolygonReplay.prototype.getIntersections_ = function(segment, rtree, opt_touch) {
  var p0 = segment.p0;
  var p1 = segment.p1;
  var segmentsInExtent = rtree.getInExtent([Math.min(p0.x, p1.x),
    Math.min(p0.y, p1.y), Math.max(p0.x, p1.x), Math.max(p0.y, p1.y)]);
  var result = [];
  var i, ii;
  for (i = 0, ii = segmentsInExtent.length; i < ii; ++i) {
    var currSeg = segmentsInExtent[i];
    if (segment !== currSeg && (opt_touch || currSeg.p0 !== p1 || currSeg.p1 !== p0) &&
        this.calculateIntersection_(p0, p1, currSeg.p0, currSeg.p1, opt_touch)) {
      result.push(currSeg);
    }
  }
  return result;
};


/**
 * Line intersection algorithm by Paul Bourke.
 * @see http://paulbourke.net/geometry/pointlineplane/
 *
 * @private
 * @param {ol.WebglPolygonVertex} p0 First point.
 * @param {ol.WebglPolygonVertex} p1 Second point.
 * @param {ol.WebglPolygonVertex} p2 Third point.
 * @param {ol.WebglPolygonVertex} p3 Fourth point.
 * @param {boolean=} opt_touch Touching segments should be considered an intersection.
 * @return {Array.<number>|undefined} Intersection coordinates.
 */
ol.render.webgl.PolygonReplay.prototype.calculateIntersection_ = function(p0,
    p1, p2, p3, opt_touch) {
  var denom = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
  if (denom !== 0) {
    var ua = ((p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x)) / denom;
    var ub = ((p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x)) / denom;
    if ((!opt_touch && ua > ol.render.webgl.EPSILON && ua < 1 - ol.render.webgl.EPSILON &&
        ub > ol.render.webgl.EPSILON && ub < 1 - ol.render.webgl.EPSILON) || (opt_touch &&
        ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)) {
      return [p0.x + ua * (p1.x - p0.x), p0.y + ua * (p1.y - p0.y)];
    }
  }
  return undefined;
};


/**
 * @private
 * @param {ol.WebglPolygonVertex} p0 Point before the start of the diagonal.
 * @param {ol.WebglPolygonVertex} p1 Start point of the diagonal.
 * @param {ol.WebglPolygonVertex} p2 Ear candidate.
 * @param {ol.WebglPolygonVertex} p3 End point of the diagonal.
 * @param {ol.WebglPolygonVertex} p4 Point after the end of the diagonal.
 * @return {boolean} Diagonal is inside the polygon.
 */
ol.render.webgl.PolygonReplay.prototype.diagonalIsInside_ = function(p0, p1, p2, p3, p4) {
  if (p1.reflex === undefined || p3.reflex === undefined) {
    return false;
  }
  var p1IsLeftOf = (p2.x - p3.x) * (p1.y - p3.y) > (p2.y - p3.y) * (p1.x - p3.x);
  var p1IsRightOf = (p4.x - p3.x) * (p1.y - p3.y) < (p4.y - p3.y) * (p1.x - p3.x);
  var p3IsLeftOf = (p0.x - p1.x) * (p3.y - p1.y) > (p0.y - p1.y) * (p3.x - p1.x);
  var p3IsRightOf = (p2.x - p1.x) * (p3.y - p1.y) < (p2.y - p1.y) * (p3.x - p1.x);
  var p1InCone = p3.reflex ? p1IsRightOf || p1IsLeftOf : p1IsRightOf && p1IsLeftOf;
  var p3InCone = p1.reflex ? p3IsRightOf || p3IsLeftOf : p3IsRightOf && p3IsLeftOf;
  return p1InCone && p3InCone;
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {
  var polygons = multiPolygonGeometry.getPolygons();
  var stride = multiPolygonGeometry.getStride();
  var currIndex = this.indices.length;
  var currLineIndex = this.lineStringReplay.getCurrentIndex();
  var i, ii, j, jj;
  for (i = 0, ii = polygons.length; i < ii; ++i) {
    var linearRings = polygons[i].getLinearRings();
    if (linearRings.length > 0) {
      var flatCoordinates = linearRings[0].getFlatCoordinates();
      flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
          stride, -this.origin[0], -this.origin[1]);
      var holes = [];
      var holeFlatCoords;
      for (j = 1, jj = linearRings.length; j < jj; ++j) {
        holeFlatCoords = linearRings[j].getFlatCoordinates();
        holeFlatCoords = ol.geom.flat.transform.translate(holeFlatCoords, 0, holeFlatCoords.length,
            stride, -this.origin[0], -this.origin[1]);
        holes.push(holeFlatCoords);
      }
      this.lineStringReplay.drawPolygonCoordinates(flatCoordinates, holes, stride);
      this.drawCoordinates_(flatCoordinates, holes, stride);
    }
  }
  if (this.indices.length > currIndex) {
    this.startIndices.push(currIndex);
    this.startIndicesFeature.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(currIndex);
      this.state_.changed = false;
    }
  }
  if (this.lineStringReplay.getCurrentIndex() > currLineIndex) {
    this.lineStringReplay.setPolygonStyle(feature, currLineIndex);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawPolygon = function(polygonGeometry, feature) {
  var linearRings = polygonGeometry.getLinearRings();
  var stride = polygonGeometry.getStride();
  if (linearRings.length > 0) {
    this.startIndices.push(this.indices.length);
    this.startIndicesFeature.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(this.indices.length);
      this.state_.changed = false;
    }
    this.lineStringReplay.setPolygonStyle(feature);

    var flatCoordinates = linearRings[0].getFlatCoordinates();
    flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
        stride, -this.origin[0], -this.origin[1]);
    var holes = [];
    var i, ii, holeFlatCoords;
    for (i = 1, ii = linearRings.length; i < ii; ++i) {
      holeFlatCoords = linearRings[i].getFlatCoordinates();
      holeFlatCoords = ol.geom.flat.transform.translate(holeFlatCoords, 0, holeFlatCoords.length,
          stride, -this.origin[0], -this.origin[1]);
      holes.push(holeFlatCoords);
    }
    this.lineStringReplay.drawPolygonCoordinates(flatCoordinates, holes, stride);
    this.drawCoordinates_(flatCoordinates, holes, stride);
  }
};


/**
 * @inheritDoc
 **/
ol.render.webgl.PolygonReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new ol.webgl.Buffer(this.vertices);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new ol.webgl.Buffer(this.indices);

  this.startIndices.push(this.indices.length);

  this.lineStringReplay.finish(context);

  //Clean up, if there is nothing to draw
  if (this.styleIndices_.length === 0 && this.styles_.length > 0) {
    this.styles_ = [];
  }

  this.vertices = null;
  this.indices = null;
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other PolygonReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  ol.DEBUG && console.assert(this.verticesBuffer,
      'verticesBuffer must not be null');
  ol.DEBUG && console.assert(this.indicesBuffer,
      'indicesBuffer must not be null');
  var verticesBuffer = this.verticesBuffer;
  var indicesBuffer = this.indicesBuffer;
  var lineDeleter = this.lineStringReplay.getDeleteResourcesFunction(context);
  return function() {
    context.deleteBuffer(verticesBuffer);
    context.deleteBuffer(indicesBuffer);
    lineDeleter();
  };
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
  // get the program
  var fragmentShader, vertexShader;
  fragmentShader = ol.render.webgl.polygonreplay.defaultshader.fragment;
  vertexShader = ol.render.webgl.polygonreplay.defaultshader.vertex;
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations =
        new ol.render.webgl.polygonreplay.defaultshader.Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
      false, 8, 0);

  return locations;
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_position);
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  //Save GL parameters.
  var tmpDepthFunc = /** @type {number} */ (gl.getParameter(gl.DEPTH_FUNC));
  var tmpDepthMask = /** @type {boolean} */ (gl.getParameter(gl.DEPTH_WRITEMASK));

  if (!hitDetection) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.NOTEQUAL);
  }

  if (!ol.obj.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(gl, context, skippedFeaturesHash);
  } else {
    ol.DEBUG && console.assert(this.styles_.length === this.styleIndices_.length,
        'number of styles and styleIndices match');

    //Draw by style groups to minimize drawElements() calls.
    var i, start, end, nextStyle;
    end = this.startIndices[this.startIndices.length - 1];
    for (i = this.styleIndices_.length - 1; i >= 0; --i) {
      start = this.styleIndices_[i];
      nextStyle = this.styles_[i];
      this.setFillStyle_(gl, nextStyle);
      this.drawElements(gl, context, start, end);
      end = start;
    }
  }
  if (!hitDetection) {
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    //Restore GL parameters.
    gl.depthMask(tmpDepthMask);
    gl.depthFunc(tmpDepthFunc);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  ol.DEBUG && console.assert(this.styles_.length === this.styleIndices_.length,
      'number of styles and styleIndices match');
  ol.DEBUG && console.assert(this.startIndices.length - 1 === this.startIndicesFeature.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex;
  featureIndex = this.startIndices.length - 2;
  end = this.startIndices[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, nextStyle);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      start = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || ol.extent.intersects(
              /** @type {Array<number>} */ (opt_hitExtent),
              feature.getGeometry().getExtent()))) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.drawElements(gl, context, start, end);

        var result = featureCallback(feature);

        if (result) {
          return result;
        }

      }
      featureIndex--;
      end = start;
    }
  }
  return undefined;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 */
ol.render.webgl.PolygonReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash) {
  ol.DEBUG && console.assert(this.startIndices.length - 1 === this.startIndicesFeature.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex, featureStart;
  featureIndex = this.startIndices.length - 2;
  end = start = this.startIndices[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, nextStyle);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      featureStart = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid]) {
        if (start !== end) {
          this.drawElements(gl, context, start, end);
          gl.clear(gl.DEPTH_BUFFER_BIT);
        }
        end = featureStart;
      }
      featureIndex--;
      start = featureStart;
    }
    if (start !== end) {
      this.drawElements(gl, context, start, end);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }
    start = end = groupStart;
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {Array.<number>} color Color.
 */
ol.render.webgl.PolygonReplay.prototype.setFillStyle_ = function(gl, color) {
  gl.uniform4fv(this.defaultLocations_.u_color, color);
};


/**
 * @inheritDoc
 */
ol.render.webgl.PolygonReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  ol.DEBUG && console.assert(this.state_, 'this.state_ should not be null');
  var fillStyleColor = fillStyle ? fillStyle.getColor() : [0, 0, 0, 0];
  if (!(fillStyleColor instanceof CanvasGradient) &&
      !(fillStyleColor instanceof CanvasPattern)) {
    fillStyleColor = ol.color.asArray(fillStyleColor).map(function(c, i) {
      return i != 3 ? c / 255 : c;
    }) || ol.render.webgl.defaultFillStyle;
  } else {
    fillStyleColor = ol.render.webgl.defaultFillStyle;
  }
  if (!this.state_.fillColor || !ol.array.equals(fillStyleColor, this.state_.fillColor)) {
    this.state_.fillColor = fillStyleColor;
    this.state_.changed = true;
    this.styles_.push(fillStyleColor);
  }
  //Provide a null stroke style, if no strokeStyle is provided. Required for the draw interaction to work.
  if (strokeStyle) {
    this.lineStringReplay.setFillStrokeStyle(null, strokeStyle);
  } else {
    var nullStrokeStyle = new ol.style.Stroke({
      color: [0, 0, 0, 0],
      lineWidth: 0
    });
    this.lineStringReplay.setFillStrokeStyle(null, nullStrokeStyle);
  }
};
