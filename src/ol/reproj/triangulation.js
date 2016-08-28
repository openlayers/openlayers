goog.provide('ol.reproj.Triangulation');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.proj');


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
   * @param {ol.Coordinate} c A coordinate.
   * @return {ol.Coordinate} Transformed coordinate.
   * @private
   */
  this.transformInv_ = function(c) {
    var key = c[0] + '/' + c[1];
    if (!transformInvCache[key]) {
      transformInvCache[key] = transformInv(c);
    }
    return transformInvCache[key];
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
   * @type {Array.<ol.ReprojTriangle>}
   * @private
   */
  this.triangles_ = [];

  /**
   * Indicates that the triangulation crosses edge of the source projection.
   * @type {boolean}
   * @private
   */
  this.wrapsXInSource_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.canWrapXInSource_ = this.sourceProj_.canWrapX() &&
      !!maxSourceExtent &&
      !!this.sourceProj_.getExtent() &&
      (ol.extent.getWidth(maxSourceExtent) ==
       ol.extent.getWidth(this.sourceProj_.getExtent()));

  /**
   * @type {?number}
   * @private
   */
  this.sourceWorldWidth_ = this.sourceProj_.getExtent() ?
      ol.extent.getWidth(this.sourceProj_.getExtent()) : null;

  /**
   * @type {?number}
   * @private
   */
  this.targetWorldWidth_ = this.targetProj_.getExtent() ?
      ol.extent.getWidth(this.targetProj_.getExtent()) : null;

  var destinationTopLeft = ol.extent.getTopLeft(targetExtent);
  var destinationTopRight = ol.extent.getTopRight(targetExtent);
  var destinationBottomRight = ol.extent.getBottomRight(targetExtent);
  var destinationBottomLeft = ol.extent.getBottomLeft(targetExtent);
  var sourceTopLeft = this.transformInv_(destinationTopLeft);
  var sourceTopRight = this.transformInv_(destinationTopRight);
  var sourceBottomRight = this.transformInv_(destinationBottomRight);
  var sourceBottomLeft = this.transformInv_(destinationBottomLeft);

  this.addQuad_(
      destinationTopLeft, destinationTopRight,
      destinationBottomRight, destinationBottomLeft,
      sourceTopLeft, sourceTopRight, sourceBottomRight, sourceBottomLeft,
      ol.RASTER_REPROJECTION_MAX_SUBDIVISION);

  if (this.wrapsXInSource_) {
    // Fix coordinates (ol.proj returns wrapped coordinates, "unwrap" here).
    // This significantly simplifies the rest of the reprojection process.

    ol.DEBUG && console.assert(this.sourceWorldWidth_ !== null);
    var leftBound = Infinity;
    this.triangles_.forEach(function(triangle, i, arr) {
      leftBound = Math.min(leftBound,
          triangle.source[0][0], triangle.source[1][0], triangle.source[2][0]);
    });

    // Shift triangles to be as close to `leftBound` as possible
    // (if the distance is more than `worldWidth / 2` it can be closer.
    this.triangles_.forEach(function(triangle) {
      if (Math.max(triangle.source[0][0], triangle.source[1][0],
          triangle.source[2][0]) - leftBound > this.sourceWorldWidth_ / 2) {
        var newTriangle = [[triangle.source[0][0], triangle.source[0][1]],
                           [triangle.source[1][0], triangle.source[1][1]],
                           [triangle.source[2][0], triangle.source[2][1]]];
        if ((newTriangle[0][0] - leftBound) > this.sourceWorldWidth_ / 2) {
          newTriangle[0][0] -= this.sourceWorldWidth_;
        }
        if ((newTriangle[1][0] - leftBound) > this.sourceWorldWidth_ / 2) {
          newTriangle[1][0] -= this.sourceWorldWidth_;
        }
        if ((newTriangle[2][0] - leftBound) > this.sourceWorldWidth_ / 2) {
          newTriangle[2][0] -= this.sourceWorldWidth_;
        }

        // Rarely (if the extent contains both the dateline and prime meridian)
        // the shift can in turn break some triangles.
        // Detect this here and don't shift in such cases.
        var minX = Math.min(
            newTriangle[0][0], newTriangle[1][0], newTriangle[2][0]);
        var maxX = Math.max(
            newTriangle[0][0], newTriangle[1][0], newTriangle[2][0]);
        if ((maxX - minX) < this.sourceWorldWidth_ / 2) {
          triangle.source = newTriangle;
        }
      }
    }, this);
  }

  transformInvCache = {};
};


/**
 * Adds triangle to the triangulation.
 * @param {ol.Coordinate} a The target a coordinate.
 * @param {ol.Coordinate} b The target b coordinate.
 * @param {ol.Coordinate} c The target c coordinate.
 * @param {ol.Coordinate} aSrc The source a coordinate.
 * @param {ol.Coordinate} bSrc The source b coordinate.
 * @param {ol.Coordinate} cSrc The source c coordinate.
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
 * @param {ol.Coordinate} a The target a coordinate.
 * @param {ol.Coordinate} b The target b coordinate.
 * @param {ol.Coordinate} c The target c coordinate.
 * @param {ol.Coordinate} d The target d coordinate.
 * @param {ol.Coordinate} aSrc The source a coordinate.
 * @param {ol.Coordinate} bSrc The source b coordinate.
 * @param {ol.Coordinate} cSrc The source c coordinate.
 * @param {ol.Coordinate} dSrc The source d coordinate.
 * @param {number} maxSubdivision Maximal allowed subdivision of the quad.
 * @private
 */
ol.reproj.Triangulation.prototype.addQuad_ = function(a, b, c, d,
    aSrc, bSrc, cSrc, dSrc, maxSubdivision) {

  var sourceQuadExtent = ol.extent.boundingExtent([aSrc, bSrc, cSrc, dSrc]);
  var sourceCoverageX = this.sourceWorldWidth_ ?
      ol.extent.getWidth(sourceQuadExtent) / this.sourceWorldWidth_ : null;
  var sourceWorldWidth = /** @type {number} */ (this.sourceWorldWidth_);

  // when the quad is wrapped in the source projection
  // it covers most of the projection extent, but not fully
  var wrapsX = this.sourceProj_.canWrapX() &&
               sourceCoverageX > 0.5 && sourceCoverageX < 1;

  var needsSubdivision = false;

  if (maxSubdivision > 0) {
    if (this.targetProj_.isGlobal() && this.targetWorldWidth_) {
      var targetQuadExtent = ol.extent.boundingExtent([a, b, c, d]);
      var targetCoverageX =
          ol.extent.getWidth(targetQuadExtent) / this.targetWorldWidth_;
      needsSubdivision |=
          targetCoverageX > ol.RASTER_REPROJECTION_MAX_TRIANGLE_WIDTH;
    }
    if (!wrapsX && this.sourceProj_.isGlobal() && sourceCoverageX) {
      needsSubdivision |=
          sourceCoverageX > ol.RASTER_REPROJECTION_MAX_TRIANGLE_WIDTH;
    }
  }

  if (!needsSubdivision && this.maxSourceExtent_) {
    if (!ol.extent.intersects(sourceQuadExtent, this.maxSourceExtent_)) {
      // whole quad outside source projection extent -> ignore
      return;
    }
  }

  if (!needsSubdivision) {
    if (!isFinite(aSrc[0]) || !isFinite(aSrc[1]) ||
        !isFinite(bSrc[0]) || !isFinite(bSrc[1]) ||
        !isFinite(cSrc[0]) || !isFinite(cSrc[1]) ||
        !isFinite(dSrc[0]) || !isFinite(dSrc[1])) {
      if (maxSubdivision > 0) {
        needsSubdivision = true;
      } else {
        return;
      }
    }
  }

  if (maxSubdivision > 0) {
    if (!needsSubdivision) {
      var center = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
      var centerSrc = this.transformInv_(center);

      var dx;
      if (wrapsX) {
        var centerSrcEstimX =
            (ol.math.modulo(aSrc[0], sourceWorldWidth) +
             ol.math.modulo(cSrc[0], sourceWorldWidth)) / 2;
        dx = centerSrcEstimX -
            ol.math.modulo(centerSrc[0], sourceWorldWidth);
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

        this.addQuad_(
            a, b, bc, da, aSrc, bSrc, bcSrc, daSrc, maxSubdivision - 1);
        this.addQuad_(
            da, bc, c, d, daSrc, bcSrc, cSrc, dSrc, maxSubdivision - 1);
      } else {
        // split vertically (left & right)
        var ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        var abSrc = this.transformInv_(ab);
        var cd = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2];
        var cdSrc = this.transformInv_(cd);

        this.addQuad_(
            a, ab, cd, d, aSrc, abSrc, cdSrc, dSrc, maxSubdivision - 1);
        this.addQuad_(
            ab, b, c, cd, abSrc, bSrc, cSrc, cdSrc, maxSubdivision - 1);
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
 *
 * @return {ol.Extent} Calculated extent.
 */
ol.reproj.Triangulation.prototype.calculateSourceExtent = function() {
  var extent = ol.extent.createEmpty();

  this.triangles_.forEach(function(triangle, i, arr) {
    var src = triangle.source;
    ol.extent.extendCoordinate(extent, src[0]);
    ol.extent.extendCoordinate(extent, src[1]);
    ol.extent.extendCoordinate(extent, src[2]);
  });

  return extent;
};


/**
 * @return {Array.<ol.ReprojTriangle>} Array of the calculated triangles.
 */
ol.reproj.Triangulation.prototype.getTriangles = function() {
  return this.triangles_;
};
