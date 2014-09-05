goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.closest');
goog.require('ol.geom.flat.deflate');
goog.require('ol.geom.flat.inflate');
goog.require('ol.geom.flat.interpolate');
goog.require('ol.geom.flat.length');
goog.require('ol.geom.flat.simplify');



/**
 * @classdesc
 * Linestring geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.LineString = function(coordinates, opt_layout) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.flatMidpoint_ = null;

  /**
   * @private
   * @type {number}
   */
  this.flatMidpointRevision_ = -1;

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

  this.setCoordinates(coordinates,
      /** @type {ol.geom.GeometryLayout|undefined} */ (opt_layout));

};
goog.inherits(ol.geom.LineString, ol.geom.SimpleGeometry);


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @api stable
 */
ol.geom.LineString.prototype.appendCoordinate = function(coordinate) {
  goog.asserts.assert(coordinate.length == this.stride);
  if (goog.isNull(this.flatCoordinates)) {
    this.flatCoordinates = coordinate.slice();
  } else {
    ol.array.safeExtend(this.flatCoordinates, coordinate);
  }
  this.dispatchChangeEvent();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.LineString} Clone.
 * @api stable
 */
ol.geom.LineString.prototype.clone = function() {
  var lineString = new ol.geom.LineString(null);
  lineString.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return lineString;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.closestPointXY =
    function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      ol.extent.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(ol.geom.flat.closest.getMaxSquaredDelta(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return ol.geom.flat.closest.getClosestPoint(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
};


/**
 * Returns the coordinate at `m` using linear interpolation, or `null` if no
 * such coordinate exists.
 *
 * `opt_extrapolate` controls extrapolation beyond the range of Ms in the
 * MultiLineString. If `opt_extrapolate` is `true` then Ms less than the first
 * M will return the first coordinate and Ms greater than the last M will
 * return the last coordinate.
 *
 * @param {number} m M.
 * @param {boolean=} opt_extrapolate Extrapolate.
 * @return {ol.Coordinate} Coordinate.
 * @api stable
 */
ol.geom.LineString.prototype.getCoordinateAtM = function(m, opt_extrapolate) {
  if (this.layout != ol.geom.GeometryLayout.XYM &&
      this.layout != ol.geom.GeometryLayout.XYZM) {
    return null;
  }
  var extrapolate = goog.isDef(opt_extrapolate) ? opt_extrapolate : false;
  return ol.geom.flat.lineStringCoordinateAtM(this.flatCoordinates, 0,
      this.flatCoordinates.length, this.stride, m, extrapolate);
};


/**
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @api stable
 */
ol.geom.LineString.prototype.getCoordinates = function() {
  return ol.geom.flat.inflate.coordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {number} Length (on projected plane).
 * @api stable
 */
ol.geom.LineString.prototype.getLength = function() {
  return ol.geom.flat.length.lineString(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {Array.<number>} Flat midpoint.
 */
ol.geom.LineString.prototype.getFlatMidpoint = function() {
  if (this.flatMidpointRevision_ != this.getRevision()) {
    this.flatMidpoint_ = ol.geom.flat.interpolate.lineString(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
        0.5, this.flatMidpoint_);
    this.flatMidpointRevision_ = this.getRevision();
  }
  return this.flatMidpoint_;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = ol.geom.flat.simplify.douglasPeucker(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
  var simplifiedLineString = new ol.geom.LineString(null);
  simplifiedLineString.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates);
  return simplifiedLineString;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.LineString.prototype.getType = function() {
  return ol.geom.GeometryType.LINE_STRING;
};


/**
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.LineString.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (goog.isNull(coordinates)) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (goog.isNull(this.flatCoordinates)) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = ol.geom.flat.deflate.coordinates(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
ol.geom.LineString.prototype.setFlatCoordinates =
    function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.dispatchChangeEvent();
};
