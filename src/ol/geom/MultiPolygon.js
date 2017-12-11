goog.provide('ol.geom.MultiPolygon');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.area');
goog.require('ol.geom.flat.center');
goog.require('ol.geom.flat.closest');
goog.require('ol.geom.flat.contains');
goog.require('ol.geom.flat.deflate');
goog.require('ol.geom.flat.inflate');
goog.require('ol.geom.flat.interiorpoint');
goog.require('ol.geom.flat.intersectsextent');
goog.require('ol.geom.flat.orient');
goog.require('ol.geom.flat.simplify');


/**
 * @classdesc
 * Multi-polygon geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
ol.geom.MultiPolygon = function(coordinates, opt_layout) {

  ol.geom.SimpleGeometry.call(this);

  /**
   * @type {Array.<Array.<number>>}
   * @private
   */
  this.endss_ = [];

  /**
   * @private
   * @type {number}
   */
  this.flatInteriorPointsRevision_ = -1;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.flatInteriorPoints_ = null;

  /**
   * @private
   * @type {number}
   */
  this.maxDelta_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.maxDeltaRevision_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.orientedRevision_ = -1;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.orientedFlatCoordinates_ = null;

  this.setCoordinates(coordinates, opt_layout);

};
ol.inherits(ol.geom.MultiPolygon, ol.geom.SimpleGeometry);


/**
 * Append the passed polygon to this multipolygon.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @api
 */
ol.geom.MultiPolygon.prototype.appendPolygon = function(polygon) {
  /** @type {Array.<number>} */
  var ends;
  if (!this.flatCoordinates) {
    this.flatCoordinates = polygon.getFlatCoordinates().slice();
    ends = polygon.getEnds().slice();
    this.endss_.push();
  } else {
    var offset = this.flatCoordinates.length;
    ol.array.extend(this.flatCoordinates, polygon.getFlatCoordinates());
    ends = polygon.getEnds().slice();
    var i, ii;
    for (i = 0, ii = ends.length; i < ii; ++i) {
      ends[i] += offset;
    }
  }
  this.endss_.push(ends);
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.MultiPolygon} Clone.
 * @override
 * @api
 */
ol.geom.MultiPolygon.prototype.clone = function() {
  var multiPolygon = new ol.geom.MultiPolygon(null);

  var len = this.endss_.length;
  var newEndss = new Array(len);
  for (var i = 0; i < len; ++i) {
    newEndss[i] = this.endss_[i].slice();
  }

  multiPolygon.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(), newEndss);
  return multiPolygon;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      ol.extent.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(ol.geom.flat.closest.getssMaxSquaredDelta(
        this.flatCoordinates, 0, this.endss_, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return ol.geom.flat.closest.getssClosestPoint(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.containsXY = function(x, y) {
  return ol.geom.flat.contains.linearRingssContainsXY(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride, x, y);
};


/**
 * Return the area of the multipolygon on projected plane.
 * @return {number} Area (on projected plane).
 * @api
 */
ol.geom.MultiPolygon.prototype.getArea = function() {
  return ol.geom.flat.area.linearRingss(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride);
};


/**
 * Get the coordinate array for this geometry.  This array has the structure
 * of a GeoJSON coordinate array for multi-polygons.
 *
 * @param {boolean=} opt_right Orient coordinates according to the right-hand
 *     rule (counter-clockwise for exterior and clockwise for interior rings).
 *     If `false`, coordinates will be oriented according to the left-hand rule
 *     (clockwise for exterior and counter-clockwise for interior rings).
 *     By default, coordinate orientation will depend on how the geometry was
 *     constructed.
 * @return {Array.<Array.<Array.<ol.Coordinate>>>} Coordinates.
 * @override
 * @api
 */
ol.geom.MultiPolygon.prototype.getCoordinates = function(opt_right) {
  var flatCoordinates;
  if (opt_right !== undefined) {
    flatCoordinates = this.getOrientedFlatCoordinates().slice();
    ol.geom.flat.orient.orientLinearRingss(
        flatCoordinates, 0, this.endss_, this.stride, opt_right);
  } else {
    flatCoordinates = this.flatCoordinates;
  }

  return ol.geom.flat.inflate.coordinatesss(
      flatCoordinates, 0, this.endss_, this.stride);
};


/**
 * @return {Array.<Array.<number>>} Endss.
 */
ol.geom.MultiPolygon.prototype.getEndss = function() {
  return this.endss_;
};


/**
 * @return {Array.<number>} Flat interior points.
 */
ol.geom.MultiPolygon.prototype.getFlatInteriorPoints = function() {
  if (this.flatInteriorPointsRevision_ != this.getRevision()) {
    var flatCenters = ol.geom.flat.center.linearRingss(
        this.flatCoordinates, 0, this.endss_, this.stride);
    this.flatInteriorPoints_ = ol.geom.flat.interiorpoint.linearRingss(
        this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride,
        flatCenters);
    this.flatInteriorPointsRevision_ = this.getRevision();
  }
  return this.flatInteriorPoints_;
};


/**
 * Return the interior points as {@link ol.geom.MultiPoint multipoint}.
 * @return {ol.geom.MultiPoint} Interior points as XYM coordinates, where M is
 * the length of the horizontal intersection that the point belongs to.
 * @api
 */
ol.geom.MultiPolygon.prototype.getInteriorPoints = function() {
  var interiorPoints = new ol.geom.MultiPoint(null);
  interiorPoints.setFlatCoordinates(ol.geom.GeometryLayout.XYM,
      this.getFlatInteriorPoints().slice());
  return interiorPoints;
};


/**
 * @return {Array.<number>} Oriented flat coordinates.
 */
ol.geom.MultiPolygon.prototype.getOrientedFlatCoordinates = function() {
  if (this.orientedRevision_ != this.getRevision()) {
    var flatCoordinates = this.flatCoordinates;
    if (ol.geom.flat.orient.linearRingssAreOriented(
        flatCoordinates, 0, this.endss_, this.stride)) {
      this.orientedFlatCoordinates_ = flatCoordinates;
    } else {
      this.orientedFlatCoordinates_ = flatCoordinates.slice();
      this.orientedFlatCoordinates_.length =
          ol.geom.flat.orient.orientLinearRingss(
              this.orientedFlatCoordinates_, 0, this.endss_, this.stride);
    }
    this.orientedRevision_ = this.getRevision();
  }
  return this.orientedFlatCoordinates_;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEndss = [];
  simplifiedFlatCoordinates.length = ol.geom.flat.simplify.quantizess(
      this.flatCoordinates, 0, this.endss_, this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates, 0, simplifiedEndss);
  var simplifiedMultiPolygon = new ol.geom.MultiPolygon(null);
  simplifiedMultiPolygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates, simplifiedEndss);
  return simplifiedMultiPolygon;
};


/**
 * Return the polygon at the specified index.
 * @param {number} index Index.
 * @return {ol.geom.Polygon} Polygon.
 * @api
 */
ol.geom.MultiPolygon.prototype.getPolygon = function(index) {
  if (index < 0 || this.endss_.length <= index) {
    return null;
  }
  var offset;
  if (index === 0) {
    offset = 0;
  } else {
    var prevEnds = this.endss_[index - 1];
    offset = prevEnds[prevEnds.length - 1];
  }
  var ends = this.endss_[index].slice();
  var end = ends[ends.length - 1];
  if (offset !== 0) {
    var i, ii;
    for (i = 0, ii = ends.length; i < ii; ++i) {
      ends[i] -= offset;
    }
  }
  var polygon = new ol.geom.Polygon(null);
  polygon.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(offset, end), ends);
  return polygon;
};


/**
 * Return the polygons of this multipolygon.
 * @return {Array.<ol.geom.Polygon>} Polygons.
 * @api
 */
ol.geom.MultiPolygon.prototype.getPolygons = function() {
  var layout = this.layout;
  var flatCoordinates = this.flatCoordinates;
  var endss = this.endss_;
  var polygons = [];
  var offset = 0;
  var i, ii, j, jj;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i].slice();
    var end = ends[ends.length - 1];
    if (offset !== 0) {
      for (j = 0, jj = ends.length; j < jj; ++j) {
        ends[j] -= offset;
      }
    }
    var polygon = new ol.geom.Polygon(null);
    polygon.setFlatCoordinates(
        layout, flatCoordinates.slice(offset, end), ends);
    polygons.push(polygon);
    offset = end;
  }
  return polygons;
};


/**
 * @inheritDoc
 * @api
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_POLYGON;
};


/**
 * @inheritDoc
 * @api
 */
ol.geom.MultiPolygon.prototype.intersectsExtent = function(extent) {
  return ol.geom.flat.intersectsextent.linearRingss(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride, extent);
};


/**
 * Set the coordinates of the multipolygon.
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
ol.geom.MultiPolygon.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null, this.endss_);
  } else {
    this.setLayout(opt_layout, coordinates, 3);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    var endss = ol.geom.flat.deflate.coordinatesss(
        this.flatCoordinates, 0, coordinates, this.stride, this.endss_);
    if (endss.length === 0) {
      this.flatCoordinates.length = 0;
    } else {
      var lastEnds = endss[endss.length - 1];
      this.flatCoordinates.length = lastEnds.length === 0 ?
        0 : lastEnds[lastEnds.length - 1];
    }
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} endss Endss.
 */
ol.geom.MultiPolygon.prototype.setFlatCoordinates = function(layout, flatCoordinates, endss) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.endss_ = endss;
  this.changed();
};


/**
 * @param {Array.<ol.geom.Polygon>} polygons Polygons.
 */
ol.geom.MultiPolygon.prototype.setPolygons = function(polygons) {
  var layout = this.getLayout();
  var flatCoordinates = [];
  var endss = [];
  var i, ii, ends;
  for (i = 0, ii = polygons.length; i < ii; ++i) {
    var polygon = polygons[i];
    if (i === 0) {
      layout = polygon.getLayout();
    }
    var offset = flatCoordinates.length;
    ends = polygon.getEnds();
    var j, jj;
    for (j = 0, jj = ends.length; j < jj; ++j) {
      ends[j] += offset;
    }
    ol.array.extend(flatCoordinates, polygon.getFlatCoordinates());
    endss.push(ends);
  }
  this.setFlatCoordinates(layout, flatCoordinates, endss);
};
