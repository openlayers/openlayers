goog.provide('ol.geom.MultiPolygon');

goog.require('goog.asserts');
goog.require('ol.array');
goog.require('ol.extent');
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
 * @api stable
 */
ol.geom.MultiPolygon = function(coordinates, opt_layout) {

  goog.base(this);

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

  this.setCoordinates(coordinates,
      /** @type {ol.geom.GeometryLayout|undefined} */ (opt_layout));

};
goog.inherits(ol.geom.MultiPolygon, ol.geom.SimpleGeometry);


/**
 * @param {ol.geom.Polygon} polygon Polygon.
 * @api stable
 */
ol.geom.MultiPolygon.prototype.appendPolygon = function(polygon) {
  goog.asserts.assert(polygon.getLayout() == this.layout);
  /** @type {Array.<number>} */
  var ends;
  if (goog.isNull(this.flatCoordinates)) {
    this.flatCoordinates = polygon.getFlatCoordinates().slice();
    ends = polygon.getEnds().slice();
    this.endss_.push();
  } else {
    var offset = this.flatCoordinates.length;
    ol.array.safeExtend(this.flatCoordinates, polygon.getFlatCoordinates());
    ends = polygon.getEnds().slice();
    var i, ii;
    for (i = 0, ii = ends.length; i < ii; ++i) {
      ends[i] += offset;
    }
  }
  this.endss_.push(ends);
  this.dispatchChangeEvent();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.MultiPolygon} Clone.
 * @api stable
 */
ol.geom.MultiPolygon.prototype.clone = function() {
  var multiPolygon = new ol.geom.MultiPolygon(null);
  multiPolygon.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(), this.endss_.slice());
  return multiPolygon;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.closestPointXY =
    function(x, y, closestPoint, minSquaredDistance) {
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
 * @return {number} Area (on projected plane).
 * @api stable
 */
ol.geom.MultiPolygon.prototype.getArea = function() {
  return ol.geom.flat.area.linearRingss(
      this.getOrientedFlatCoordinates(), 0, this.endss_, this.stride);
};


/**
 * @return {Array.<Array.<Array.<ol.Coordinate>>>} Coordinates.
 * @api stable
 */
ol.geom.MultiPolygon.prototype.getCoordinates = function() {
  return ol.geom.flat.inflate.coordinatesss(
      this.flatCoordinates, 0, this.endss_, this.stride);
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
 * @return {ol.geom.MultiPoint} Interior points.
 * @api stable
 */
ol.geom.MultiPolygon.prototype.getInteriorPoints = function() {
  var interiorPoints = new ol.geom.MultiPoint(null);
  interiorPoints.setFlatCoordinates(ol.geom.GeometryLayout.XY,
      this.getFlatInteriorPoints().slice());
  return interiorPoints;
};


/**
 * @return {Array.<number>} Oriented flat coordinates.
 */
ol.geom.MultiPolygon.prototype.getOrientedFlatCoordinates = function() {
  if (this.orientedRevision_ != this.getRevision()) {
    var flatCoordinates = this.flatCoordinates;
    if (ol.geom.flat.linearRingssAreOriented(
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
ol.geom.MultiPolygon.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
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
 * @param {number} index Index.
 * @return {ol.geom.Polygon} Polygon.
 * @api stable
 */
ol.geom.MultiPolygon.prototype.getPolygon = function(index) {
  goog.asserts.assert(0 <= index && index < this.endss_.length);
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
 * @return {Array.<ol.geom.Polygon>} Polygons.
 * @api stable
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
 * @api stable
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_POLYGON;
};


/**
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.MultiPolygon.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (goog.isNull(coordinates)) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null, this.endss_);
  } else {
    this.setLayout(opt_layout, coordinates, 3);
    if (goog.isNull(this.flatCoordinates)) {
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
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} endss Endss.
 */
ol.geom.MultiPolygon.prototype.setFlatCoordinates =
    function(layout, flatCoordinates, endss) {
  goog.asserts.assert(!goog.isNull(endss));
  if (goog.isNull(flatCoordinates) || flatCoordinates.length === 0) {
    goog.asserts.assert(endss.length === 0);
  } else {
    goog.asserts.assert(endss.length > 0);
    var ends = endss[endss.length - 1];
    goog.asserts.assert(flatCoordinates.length == ends[ends.length - 1]);
  }
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.endss_ = endss;
  this.dispatchChangeEvent();
};


/**
 * @param {Array.<ol.geom.Polygon>} polygons Polygons.
 */
ol.geom.MultiPolygon.prototype.setPolygons = function(polygons) {
  var layout = ol.geom.GeometryLayout.XY;
  var flatCoordinates = [];
  var endss = [];
  var i, ii, ends;
  for (i = 0, ii = polygons.length; i < ii; ++i) {
    var polygon = polygons[i];
    if (i === 0) {
      layout = polygon.getLayout();
    } else {
      // FIXME better handle the case of non-matching layouts
      goog.asserts.assert(polygon.getLayout() == layout);
    }
    var offset = flatCoordinates.length;
    ends = polygon.getEnds();
    var j, jj;
    for (j = 0, jj = ends.length; j < jj; ++j) {
      ends[j] += offset;
    }
    ol.array.safeExtend(flatCoordinates, polygon.getFlatCoordinates());
    endss.push(ends);
  }
  this.setFlatCoordinates(layout, flatCoordinates, endss);
};
