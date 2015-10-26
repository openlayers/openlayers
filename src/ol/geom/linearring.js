goog.provide('ol.geom.LinearRing');

goog.require('ol.extent');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.area');
goog.require('ol.geom.flat.closest');
goog.require('ol.geom.flat.deflate');
goog.require('ol.geom.flat.inflate');
goog.require('ol.geom.flat.simplify');



/**
 * @classdesc
 * Linear ring geometry. Only used as part of polygon; cannot be rendered
 * on its own.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.LinearRing = function(coordinates, opt_layout) {

  goog.base(this);

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

  this.setCoordinates(coordinates, opt_layout);

};
goog.inherits(ol.geom.LinearRing, ol.geom.SimpleGeometry);


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.LinearRing} Clone.
 * @api stable
 */
ol.geom.LinearRing.prototype.clone = function() {
  var linearRing = new ol.geom.LinearRing(null);
  linearRing.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return linearRing;
};


/**
 * @inheritDoc
 */
ol.geom.LinearRing.prototype.closestPointXY =
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
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * Return the area of the linear ring on projected plane.
 * @return {number} Area (on projected plane).
 * @api stable
 */
ol.geom.LinearRing.prototype.getArea = function() {
  return ol.geom.flat.area.linearRing(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the coordinates of the linear ring.
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @api stable
 */
ol.geom.LinearRing.prototype.getCoordinates = function() {
  return ol.geom.flat.inflate.coordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
ol.geom.LinearRing.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = ol.geom.flat.simplify.douglasPeucker(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
  var simplifiedLinearRing = new ol.geom.LinearRing(null);
  simplifiedLinearRing.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates);
  return simplifiedLinearRing;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.LinearRing.prototype.getType = function() {
  return ol.geom.GeometryType.LINEAR_RING;
};


/**
 * Set the coordinates of the linear ring.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.LinearRing.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = ol.geom.flat.deflate.coordinates(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
ol.geom.LinearRing.prototype.setFlatCoordinates =
    function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
