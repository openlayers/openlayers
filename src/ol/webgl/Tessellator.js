/**
 * @module ol/webgl/Tessellator
 */
import LinkedList from '../structs/LinkedList.js';
import RBush from '../structs/RBush.js';
import {linearRingIsClockwise} from '../geom/flat/orient.js';
import {EPSILON, triangleIsCounterClockwise} from '../render/webgl.js';
import {linearRingContainsXY} from '../geom/flat/contains.js';

/**
 * @constructor
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} holeFlatCoordinates Hole flat coordinates.
 * @param {number} stride Stride.
 * @struct
 */
const Tessellator = function(flatCoordinates, holeFlatCoordinates, stride) {

  /**
   * @private
   * @type {ol.structs.LinkedList}
   */
  this.list_ = new LinkedList();


  /**
   * @private
   * @type {ol.structs.RBush}
   */
  this.rtree_ = new RBush();


  /**
   * @private
   * @type {number}
   */
  this.stride_ = stride;


  /**
   * @type {Array.<number>}
   */
  this.indices = [];


  /**
   * @type {Array.<number>}
   */
  this.vertices = [];

  this.prepare_(flatCoordinates, holeFlatCoordinates);
  this.tessellate_(this.list_, this.rtree_);
};


/**
* Prepare the tessellator for tessellating one polygon.
* @param {Array.<number>} flatCoordinates Flat coordinates.
* @param {Array.<Array.<number>>} holeFlatCoordinates Hole flat coordinates.
* @private
 */
Tessellator.prototype.prepare_ = function(flatCoordinates, holeFlatCoordinates) {
  // Triangulate the polygon
  const outerRing = this.list_;
  const rtree = this.rtree_;
  // Initialize the outer ring
  this.processFlatCoordinates_(flatCoordinates, outerRing, rtree, true);
  const maxCoords = this.getMaxCoords_(outerRing);

  // Eliminate holes, if there are any
  if (holeFlatCoordinates.length) {
    let i, ii;
    const holeLists = [];
    for (i = 0, ii = holeFlatCoordinates.length; i < ii; ++i) {
      const holeList = {
        list: new LinkedList(),
        maxCoords: undefined,
        rtree: new RBush()
      };
      holeLists.push(holeList);
      this.processFlatCoordinates_(holeFlatCoordinates[i],
        holeList.list, holeList.rtree, false);
      this.classifyPoints_(holeList.list, holeList.rtree, true);
      holeList.maxCoords = this.getMaxCoords_(holeList.list);
    }
    holeLists.sort(function(a, b) {
      return b.maxCoords[0] === a.maxCoords[0] ?
        a.maxCoords[1] - b.maxCoords[1] : b.maxCoords[0] - a.maxCoords[0];
    });
    for (i = 0; i < holeLists.length; ++i) {
      const currList = holeLists[i].list;
      const start = currList.firstItem();
      let currItem = start;
      let intersection;
      do {
        //TODO: Triangulate holes when they intersect the outer ring.
        if (this.getIntersections_(currItem, rtree).length) {
          intersection = true;
          break;
        }
        currItem = currList.nextItem();
      } while (start !== currItem);
      if (!intersection) {
        if (this.bridgeHole_(currList, holeLists[i].maxCoords[0], outerRing, maxCoords[0], rtree)) {
          rtree.concat(holeLists[i].rtree);
          this.classifyPoints_(outerRing, rtree, false);
        }
      }
    }
  } else {
    this.classifyPoints_(outerRing, rtree, false);
  }
};


/**
 * Inserts flat coordinates in a linked list and adds them to the vertex buffer.
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {ol.structs.LinkedList} list Linked list.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean} clockwise Coordinate order should be clockwise.
 */
Tessellator.prototype.processFlatCoordinates_ = function(
  flatCoordinates, list, rtree, clockwise) {
  const stride = this.stride_;
  const isClockwise = linearRingIsClockwise(flatCoordinates,
    0, flatCoordinates.length, stride);
  let i, ii;
  let n = this.vertices.length / 2;
  /** @type {ol.WebglPolygonVertex} */
  let start;
  /** @type {ol.WebglPolygonVertex} */
  let p0;
  /** @type {ol.WebglPolygonVertex} */
  let p1;
  const extents = [];
  const segments = [];
  if (clockwise === isClockwise) {
    start = this.createPoint_(flatCoordinates[0], flatCoordinates[1], n++);
    p0 = start;
    for (i = stride, ii = flatCoordinates.length; i < ii; i += stride) {
      p1 = this.createPoint_(flatCoordinates[i], flatCoordinates[i + 1], n++);
      segments.push(this.insertItem_(p0, p1, list));
      extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
        Math.max(p0.y, p1.y)]);
      p0 = p1;
    }
    segments.push(this.insertItem_(p1, start, list));
    extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
      Math.max(p0.y, p1.y)]);
  } else {
    const end = flatCoordinates.length - stride;
    start = this.createPoint_(flatCoordinates[end], flatCoordinates[end + 1], n++);
    p0 = start;
    for (i = end - stride, ii = 0; i >= ii; i -= stride) {
      p1 = this.createPoint_(flatCoordinates[i], flatCoordinates[i + 1], n++);
      segments.push(this.insertItem_(p0, p1, list));
      extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
        Math.max(p0.y, p1.y)]);
      p0 = p1;
    }
    segments.push(this.insertItem_(p1, start, list));
    extents.push([Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x),
      Math.max(p0.y, p1.y)]);
  }
  rtree.load(extents, segments);
};


/**
 * Returns the rightmost coordinates of a polygon on the X axis.
 * @private
 * @param {ol.structs.LinkedList} list Polygons ring.
 * @return {Array.<number>} Max X coordinates.
 */
Tessellator.prototype.getMaxCoords_ = function(list) {
  const start = list.firstItem();
  let seg = start;
  let maxCoords = [seg.p0.x, seg.p0.y];

  do {
    seg = list.nextItem();
    if (seg.p0.x > maxCoords[0]) {
      maxCoords = [seg.p0.x, seg.p0.y];
    }
  } while (seg !== start);

  return maxCoords;
};


/**
 * Classifies the points of a polygon list as convex, reflex. Removes collinear vertices.
 * @private
 * @param {ol.structs.LinkedList} list Polygon ring.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 * @param {boolean} ccw The orientation of the polygon is counter-clockwise.
 * @return {boolean} There were reclassified points.
 */
Tessellator.prototype.classifyPoints_ = function(list, rtree, ccw) {
  let start = list.firstItem();
  let s0 = start;
  let s1 = list.nextItem();
  let pointsReclassified = false;
  do {
    const reflex = ccw ? triangleIsCounterClockwise(s1.p1.x,
      s1.p1.y, s0.p1.x, s0.p1.y, s0.p0.x, s0.p0.y) :
      triangleIsCounterClockwise(s0.p0.x, s0.p0.y, s0.p1.x,
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
 * @return {boolean} Bridging was successful.
 */
Tessellator.prototype.bridgeHole_ = function(hole, holeMaxX,
  list, listMaxX, rtree) {
  let seg = hole.firstItem();
  while (seg.p1.x !== holeMaxX) {
    seg = hole.nextItem();
  }

  const p1 = seg.p1;
  /** @type {ol.WebglPolygonVertex} */
  const p2 = {x: listMaxX, y: p1.y, i: -1};
  let minDist = Infinity;
  let i, ii, bestPoint;
  /** @type {ol.WebglPolygonVertex} */
  let p5;

  const intersectingSegments = this.getIntersections_({p0: p1, p1: p2}, rtree, true);
  for (i = 0, ii = intersectingSegments.length; i < ii; ++i) {
    const currSeg = intersectingSegments[i];
    const intersection = this.calculateIntersection_(p1, p2, currSeg.p0,
      currSeg.p1, true);
    const dist = Math.abs(p1.x - intersection[0]);
    if (dist < minDist && triangleIsCounterClockwise(p1.x, p1.y,
      currSeg.p0.x, currSeg.p0.y, currSeg.p1.x, currSeg.p1.y) !== undefined) {
      minDist = dist;
      p5 = {x: intersection[0], y: intersection[1], i: -1};
      seg = currSeg;
    }
  }
  if (minDist === Infinity) {
    return false;
  }
  bestPoint = seg.p1;

  if (minDist > 0) {
    const pointsInTriangle = this.getPointsInTriangle_(p1, p5, seg.p1, rtree);
    if (pointsInTriangle.length) {
      let theta = Infinity;
      for (i = 0, ii = pointsInTriangle.length; i < ii; ++i) {
        const currPoint = pointsInTriangle[i];
        const currTheta = Math.atan2(p1.y - currPoint.y, p2.x - currPoint.x);
        if (currTheta < theta || (currTheta === theta && currPoint.x < bestPoint.x)) {
          theta = currTheta;
          bestPoint = currPoint;
        }
      }
    }
  }

  seg = list.firstItem();
  while (seg.p1.x !== bestPoint.x || seg.p1.y !== bestPoint.y) {
    seg = list.nextItem();
  }

  //We clone the bridge points as they can have different convexity.
  const p0Bridge = {x: p1.x, y: p1.y, i: p1.i, reflex: undefined};
  const p1Bridge = {x: seg.p1.x, y: seg.p1.y, i: seg.p1.i, reflex: undefined};

  hole.getNextItem().p0 = p0Bridge;
  this.insertItem_(p1, seg.p1, hole, rtree);
  this.insertItem_(p1Bridge, p0Bridge, hole, rtree);
  seg.p1 = p1Bridge;
  hole.setFirstItem();
  list.concat(hole);

  return true;
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 */
Tessellator.prototype.tessellate_ = function(list, rtree) {
  let ccw = false;
  let simple = this.isSimple_(list, rtree);

  // Start clipping ears
  while (list.getLength() > 3) {
    if (simple) {
      if (!this.clipEars_(list, rtree, simple, ccw)) {
        if (!this.classifyPoints_(list, rtree, ccw)) {
          // Due to the behavior of OL's PIP algorithm, the ear clipping cannot
          // introduce touching segments. However, the original data may have some.
          if (!this.resolveSelfIntersections_(list, rtree, true)) {
            break;
          }
        }
      }
    } else {
      if (!this.clipEars_(list, rtree, simple, ccw)) {
        // We ran out of ears, try to reclassify.
        if (!this.classifyPoints_(list, rtree, ccw)) {
          // We have a bad polygon, try to resolve local self-intersections.
          if (!this.resolveSelfIntersections_(list, rtree)) {
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
    let numIndices = this.indices.length;
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
Tessellator.prototype.clipEars_ = function(list, rtree, simple, ccw) {
  let numIndices = this.indices.length;
  let start = list.firstItem();
  let s0 = list.getPrevItem();
  let s1 = start;
  let s2 = list.nextItem();
  let s3 = list.getNextItem();
  let p0, p1, p2;
  let processedEars = false;
  do {
    p0 = s1.p0;
    p1 = s1.p1;
    p2 = s2.p1;
    if (p1.reflex === false) {
      // We might have a valid ear
      let variableCriterion;
      if (simple) {
        variableCriterion = this.getPointsInTriangle_(p0, p1, p2, rtree, true).length === 0;
      } else {
        variableCriterion = ccw ? this.diagonalIsInside_(s3.p1, p2, p1, p0,
          s0.p0) : this.diagonalIsInside_(s0.p0, p0, p1, p2, s3.p1);
      }
      if ((simple || this.getIntersections_({p0: p0, p1: p2}, rtree).length === 0) &&
          variableCriterion) {
        //The diagonal is completely inside the polygon
        if (simple || p0.reflex === false || p2.reflex === false ||
            linearRingIsClockwise([s0.p0.x, s0.p0.y, p0.x,
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
Tessellator.prototype.resolveSelfIntersections_ = function(
  list, rtree, opt_touch) {
  const start = list.firstItem();
  list.nextItem();
  let s0 = start;
  let s1 = list.nextItem();
  let resolvedIntersections = false;

  do {
    const intersection = this.calculateIntersection_(s0.p0, s0.p1, s1.p0, s1.p1,
      opt_touch);
    if (intersection) {
      let breakCond = false;
      const numVertices = this.vertices.length;
      let numIndices = this.indices.length;
      const n = numVertices / 2;
      const seg = list.prevItem();
      list.removeItem();
      rtree.remove(seg);
      breakCond = (seg === start);
      let p;
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
Tessellator.prototype.isSimple_ = function(list, rtree) {
  const start = list.firstItem();
  let seg = start;
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
Tessellator.prototype.isClockwise_ = function(list) {
  const length = list.getLength() * 2;
  const flatCoordinates = new Array(length);
  const start = list.firstItem();
  let seg = start;
  let i = 0;
  do {
    flatCoordinates[i++] = seg.p0.x;
    flatCoordinates[i++] = seg.p0.y;
    seg = list.nextItem();
  } while (seg !== start);
  return linearRingIsClockwise(flatCoordinates, 0, length, 2);
};


/**
 * @private
 * @param {ol.structs.LinkedList} list Linked list of the polygon.
 * @param {ol.structs.RBush} rtree R-Tree of the polygon.
 */
Tessellator.prototype.splitPolygon_ = function(list, rtree) {
  const start = list.firstItem();
  let s0 = start;
  do {
    const intersections = this.getIntersections_(s0, rtree);
    if (intersections.length) {
      const s1 = intersections[0];
      const n = this.vertices.length / 2;
      const intersection = this.calculateIntersection_(s0.p0,
        s0.p1, s1.p0, s1.p1);
      const p = this.createPoint_(intersection[0], intersection[1], n);
      const newPolygon = new LinkedList();
      const newRtree = new RBush();
      this.insertItem_(p, s0.p1, newPolygon, newRtree);
      s0.p1 = p;
      rtree.update([Math.min(s0.p0.x, p.x), Math.min(s0.p0.y, p.y),
        Math.max(s0.p0.x, p.x), Math.max(s0.p0.y, p.y)], s0);
      let currItem = list.nextItem();
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
      this.tessellate_(list, rtree);
      this.classifyPoints_(newPolygon, newRtree, false);
      this.tessellate_(newPolygon, newRtree);
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
Tessellator.prototype.createPoint_ = function(x, y, i) {
  let numVertices = this.vertices.length;
  this.vertices[numVertices++] = x;
  this.vertices[numVertices++] = y;
  /** @type {ol.WebglPolygonVertex} */
  const p = {
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
Tessellator.prototype.insertItem_ = function(p0, p1, list, opt_rtree) {
  const seg = {
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
Tessellator.prototype.removeItem_ = function(s0, s1, list, rtree) {
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
Tessellator.prototype.getPointsInTriangle_ = function(p0, p1, p2, rtree, opt_reflex) {
  const result = [];
  const segmentsInExtent = rtree.getInExtent([Math.min(p0.x, p1.x, p2.x),
    Math.min(p0.y, p1.y, p2.y), Math.max(p0.x, p1.x, p2.x), Math.max(p0.y,
      p1.y, p2.y)]);
  for (let i = 0, ii = segmentsInExtent.length; i < ii; ++i) {
    for (const j in segmentsInExtent[i]) {
      const p = segmentsInExtent[i][j];
      if (typeof p === 'object' && (!opt_reflex || p.reflex)) {
        if ((p.x !== p0.x || p.y !== p0.y) && (p.x !== p1.x || p.y !== p1.y) &&
            (p.x !== p2.x || p.y !== p2.y) && result.indexOf(p) === -1 &&
            linearRingContainsXY([p0.x, p0.y, p1.x, p1.y, p2.x, p2.y], 0, 6, 2, p.x, p.y)) {
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
Tessellator.prototype.getIntersections_ = function(segment, rtree, opt_touch) {
  const p0 = segment.p0;
  const p1 = segment.p1;
  const segmentsInExtent = rtree.getInExtent([Math.min(p0.x, p1.x),
    Math.min(p0.y, p1.y), Math.max(p0.x, p1.x), Math.max(p0.y, p1.y)]);
  const result = [];
  for (let i = 0, ii = segmentsInExtent.length; i < ii; ++i) {
    const currSeg = segmentsInExtent[i];
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
Tessellator.prototype.calculateIntersection_ = function(p0, p1, p2, p3, opt_touch) {
  const denom = (p3.y - p2.y) * (p1.x - p0.x) - (p3.x - p2.x) * (p1.y - p0.y);
  if (denom !== 0) {
    const ua = ((p3.x - p2.x) * (p0.y - p2.y) - (p3.y - p2.y) * (p0.x - p2.x)) / denom;
    const ub = ((p1.x - p0.x) * (p0.y - p2.y) - (p1.y - p0.y) * (p0.x - p2.x)) / denom;
    if ((!opt_touch && ua > EPSILON && ua < 1 - EPSILON &&
        ub > EPSILON && ub < 1 - EPSILON) || (opt_touch &&
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
Tessellator.prototype.diagonalIsInside_ = function(p0, p1, p2, p3, p4) {
  if (p1.reflex === undefined || p3.reflex === undefined) {
    return false;
  }
  const p1IsLeftOf = (p2.x - p3.x) * (p1.y - p3.y) > (p2.y - p3.y) * (p1.x - p3.x);
  const p1IsRightOf = (p4.x - p3.x) * (p1.y - p3.y) < (p4.y - p3.y) * (p1.x - p3.x);
  const p3IsLeftOf = (p0.x - p1.x) * (p3.y - p1.y) > (p0.y - p1.y) * (p3.x - p1.x);
  const p3IsRightOf = (p2.x - p1.x) * (p3.y - p1.y) < (p2.y - p1.y) * (p3.x - p1.x);
  const p1InCone = p3.reflex ? p1IsRightOf || p1IsLeftOf : p1IsRightOf && p1IsLeftOf;
  const p3InCone = p1.reflex ? p3IsRightOf || p3IsLeftOf : p3IsRightOf && p3IsLeftOf;
  return p1InCone && p3InCone;
};


export default Tessellator;
