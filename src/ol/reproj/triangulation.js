goog.provide('ol.reproj.Triangulation');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.extent');
goog.require('ol.proj');


/**
 * Single triangle; consists of 3 source points and 3 target points.
 *
 * @typedef {{source: Array.<ol.Coordinate>,
 *            target: Array.<ol.Coordinate>}}
 */
ol.reproj.Triangle;



/**
 * @classdesc
 * Class containing triangulation of the given target extent.
 * Used for determining source data and the reprojection itself.
 *
 * @param {ol.proj.Projection} sourceProj Source projection.
 * @param {ol.proj.Projection} targetProj Target projection.
 * @param {ol.Extent} targetExtent Target extent to triangulate.
 * @param {ol.Extent} maxSourceExtent Maximal source extent that can be used.
 * @param {number} errorThreshold Acceptable error (in source units).
 * @constructor
 */
ol.reproj.Triangulation = function(sourceProj, targetProj, targetExtent,
    maxSourceExtent, errorThreshold) {

  /**
   * @type {ol.proj.Projection}
   * @private
   */
  this.sourceProj_ = sourceProj;

  /**
   * @type {ol.proj.Projection}
   * @private
   */
  this.targetProj_ = targetProj;

  /** @type {!Object.<string, ol.Coordinate>} */
  var transformInvCache = {};
  var transformInv = ol.proj.getTransform(this.targetProj_, this.sourceProj_);

  /**
   * @param {ol.Coordinate} c
   * @return {ol.Coordinate}
   * @private
   */
  this.transformInv_ = function(c) {
    var key = c[0] + '/' + c[1];
    return transformInvCache[key] || (transformInvCache[key] = transformInv(c));
  };

  /**
   * @type {ol.Extent}
   * @private
   */
  this.maxSourceExtent_ = maxSourceExtent;

  /**
   * @type {number}
   * @private
   */
  this.errorThresholdSquared_ = errorThreshold * errorThreshold;

  /**
   * @type {Array.<ol.reproj.Triangle>}
   * @private
   */
  this.triangles_ = [];

  /**
   * @type {ol.Extent}
   * @private
   */
  this.trianglesSourceExtent_ = null;

  /**
   * Indicates that source coordinates has to be shifted during reprojection.
   * This is needed when the triangulation crosses
   * edge of the source projection (dateline).
   * @type {boolean}
   * @private
   */
  this.wrapsXInSource_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.canWrapXInSource_ = this.sourceProj_.canWrapX() &&
      !goog.isNull(maxSourceExtent) &&
      !goog.isNull(this.sourceProj_.getExtent()) &&
      (ol.extent.getWidth(maxSourceExtent) ==
       ol.extent.getWidth(this.sourceProj_.getExtent()));

  /**
   * @type {?number}
   * @private
   */
  this.sourceWorldWidth_ = !goog.isNull(this.sourceProj_.getExtent()) ?
      ol.extent.getWidth(this.sourceProj_.getExtent()) : null;

  /**
   * @type {?number}
   * @private
   */
  this.targetWorldWidth_ = !goog.isNull(this.targetProj_.getExtent()) ?
      ol.extent.getWidth(this.targetProj_.getExtent()) : null;

  var tlDst = ol.extent.getTopLeft(targetExtent);
  var trDst = ol.extent.getTopRight(targetExtent);
  var brDst = ol.extent.getBottomRight(targetExtent);
  var blDst = ol.extent.getBottomLeft(targetExtent);
  var tlDstSrc = this.transformInv_(tlDst);
  var trDstSrc = this.transformInv_(trDst);
  var brDstSrc = this.transformInv_(brDst);
  var blDstSrc = this.transformInv_(blDst);

  this.addQuad_(tlDst, trDst, brDst, blDst,
                tlDstSrc, trDstSrc, brDstSrc, blDstSrc,
                ol.RASTER_REPROJ_MAX_SUBDIVISION);

  transformInvCache = {};
};


/**
 * Adds triangle to the triangulation.
 * @param {ol.Coordinate} a
 * @param {ol.Coordinate} b
 * @param {ol.Coordinate} c
 * @param {ol.Coordinate} aSrc
 * @param {ol.Coordinate} bSrc
 * @param {ol.Coordinate} cSrc
 * @private
 */
ol.reproj.Triangulation.prototype.addTriangle_ = function(a, b, c,
    aSrc, bSrc, cSrc) {
  this.triangles_.push({
    source: [aSrc, bSrc, cSrc],
    target: [a, b, c]
  });
};


/**
 * Adds quad (points in clock-wise order) to the triangulation
 * (and reprojects the vertices) if valid.
 * Performs quad subdivision if needed to increase precision.
 *
 * @param {ol.Coordinate} a
 * @param {ol.Coordinate} b
 * @param {ol.Coordinate} c
 * @param {ol.Coordinate} d
 * @param {ol.Coordinate} aSrc
 * @param {ol.Coordinate} bSrc
 * @param {ol.Coordinate} cSrc
 * @param {ol.Coordinate} dSrc
 * @param {number} maxSubdiv Maximal allowed subdivision of the quad.
 * @private
 */
ol.reproj.Triangulation.prototype.addQuad_ = function(a, b, c, d,
    aSrc, bSrc, cSrc, dSrc, maxSubdiv) {

  var srcQuadExtent = ol.extent.boundingExtent([aSrc, bSrc, cSrc, dSrc]);
  var srcCoverageX = !goog.isNull(this.sourceWorldWidth_) ?
      ol.extent.getWidth(srcQuadExtent) / this.sourceWorldWidth_ : null;

  // when the quad is wrapped in the source projection
  // it covers most of the projection extent, but not fully
  var wrapsX = this.sourceProj_.canWrapX() &&
               srcCoverageX > 0.5 && srcCoverageX < 1;

  var needsSubdivision = false;

  if (maxSubdiv > 0) {
    if (this.targetProj_.isGlobal() && !goog.isNull(this.targetWorldWidth_)) {
      var tgtQuadExtent = ol.extent.boundingExtent([a, b, c, d]);
      var tgtCoverageX =
          ol.extent.getWidth(tgtQuadExtent) / this.targetWorldWidth_;
      needsSubdivision |= tgtCoverageX > ol.RASTER_REPROJ_MAX_TRIANGLE_WIDTH;
    }
    if (!wrapsX && this.sourceProj_.isGlobal() && !goog.isNull(srcCoverageX)) {
      needsSubdivision |= srcCoverageX > ol.RASTER_REPROJ_MAX_TRIANGLE_WIDTH;
    }
  }

  if (!needsSubdivision && !goog.isNull(this.maxSourceExtent_)) {
    if (!ol.extent.intersects(srcQuadExtent, this.maxSourceExtent_)) {
      // whole quad outside source projection extent -> ignore
      return;
    }
  }

  if (!needsSubdivision) {
    if (!isFinite(aSrc[0]) || !isFinite(aSrc[1]) ||
        !isFinite(bSrc[0]) || !isFinite(bSrc[1]) ||
        !isFinite(cSrc[0]) || !isFinite(cSrc[1]) ||
        !isFinite(dSrc[0]) || !isFinite(dSrc[1])) {
      if (maxSubdiv > 0) {
        needsSubdivision = true;
      } else {
        return;
      }
    }
  }

  if (maxSubdiv > 0) {
    if (!needsSubdivision) {
      var center = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      var centerSrc = this.transformInv_(center);

      var dx;
      if (wrapsX) {
        goog.asserts.assert(!goog.isNull(this.sourceWorldWidth_));
        var centerSrcEstimX =
            (goog.math.modulo(aSrc[0], this.sourceWorldWidth_) +
             goog.math.modulo(cSrc[0], this.sourceWorldWidth_)) / 2;
        dx = centerSrcEstimX -
            goog.math.modulo(centerSrc[0], this.sourceWorldWidth_);
      } else {
        dx = (aSrc[0] + cSrc[0]) / 2 - centerSrc[0];
      }
      var dy = (aSrc[1] + cSrc[1]) / 2 - centerSrc[1];
      var centerSrcErrorSquared = dx * dx + dy * dy;
      needsSubdivision = centerSrcErrorSquared > this.errorThresholdSquared_;
    }
    if (needsSubdivision) {
      if (Math.abs(a[0] - c[0]) <= Math.abs(a[1] - c[1])) {
        // split horizontally (top & bottom)
        var bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
        var bcSrc = this.transformInv_(bc);
        var da = [(d[0] + a[0]) / 2, (d[1] + a[1]) / 2];
        var daSrc = this.transformInv_(da);

        this.addQuad_(a, b, bc, da, aSrc, bSrc, bcSrc, daSrc, maxSubdiv - 1);
        this.addQuad_(da, bc, c, d, daSrc, bcSrc, cSrc, dSrc, maxSubdiv - 1);
      } else {
        // split vertically (left & right)
        var ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        var abSrc = this.transformInv_(ab);
        var cd = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2];
        var cdSrc = this.transformInv_(cd);

        this.addQuad_(a, ab, cd, d, aSrc, abSrc, cdSrc, dSrc, maxSubdiv - 1);
        this.addQuad_(ab, b, c, cd, abSrc, bSrc, cSrc, cdSrc, maxSubdiv - 1);
      }
      return;
    }
  }

  if (wrapsX) {
    if (!this.canWrapXInSource_) {
      return;
    }
    this.wrapsXInSource_ = true;
  }

  this.addTriangle_(a, c, d, aSrc, cSrc, dSrc);
  this.addTriangle_(a, b, c, aSrc, bSrc, cSrc);
};


/**
 * Calculates extent of the 'source' coordinates from all the triangles.
 * The left bound of the returned extent can be higher than the right bound,
 * if the triangulation wraps X in source (see
 * {@link ol.reproj.Triangulation#getWrapsXInSource}).
 *
 * @return {ol.Extent} Calculated extent.
 */
ol.reproj.Triangulation.prototype.calculateSourceExtent = function() {
  if (!goog.isNull(this.trianglesSourceExtent_)) {
    return this.trianglesSourceExtent_;
  }

  var extent = ol.extent.createEmpty();

  if (this.wrapsXInSource_) {
    // although only some of the triangles are crossing the dateline,
    // all coordiantes need to be "shifted" to be positive
    // to properly calculate the extent (and then possibly shifted back)

    goog.array.forEach(this.triangles_, function(triangle, i, arr) {
      goog.asserts.assert(!goog.isNull(this.sourceWorldWidth_));
      var src = triangle.source;
      ol.extent.extendCoordinate(extent,
          [goog.math.modulo(src[0][0], this.sourceWorldWidth_), src[0][1]]);
      ol.extent.extendCoordinate(extent,
          [goog.math.modulo(src[1][0], this.sourceWorldWidth_), src[1][1]]);
      ol.extent.extendCoordinate(extent,
          [goog.math.modulo(src[2][0], this.sourceWorldWidth_), src[2][1]]);
    }, this);

    var sourceProjExtent = this.sourceProj_.getExtent();
    var right = sourceProjExtent[2];
    if (extent[0] > right) {
      extent[0] -= this.sourceWorldWidth_;
    }
    if (extent[2] > right) {
      extent[2] -= this.sourceWorldWidth_;
    }
  } else {
    goog.array.forEach(this.triangles_, function(triangle, i, arr) {
      var src = triangle.source;
      ol.extent.extendCoordinate(extent, src[0]);
      ol.extent.extendCoordinate(extent, src[1]);
      ol.extent.extendCoordinate(extent, src[2]);
    });
  }

  this.trianglesSourceExtent_ = extent;
  return extent;
};


/**
 * @return {boolean} Whether the source coordinates are wrapped in X
 *                   (the triangulation "crosses the dateline").
 */
ol.reproj.Triangulation.prototype.getWrapsXInSource = function() {
  return this.wrapsXInSource_;
};


/**
 * @return {Array.<ol.reproj.Triangle>} Array of the calculated triangles.
 */
ol.reproj.Triangulation.prototype.getTriangles = function() {
  return this.triangles_;
};
