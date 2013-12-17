goog.provide('ol.geom.LinearRing');

goog.require('ol.extent');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.closest');
goog.require('ol.geom.flat');
goog.require('ol.geom.simplify');



/**
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.geom.RawLinearRing} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
 * @inheritDoc
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
  if (this.maxDeltaRevision_ != this.revision) {
    this.maxDelta_ = Math.sqrt(ol.geom.closest.getMaxSquaredDelta(
        this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
    this.maxDeltaRevision_ = this.revision;
  }
  return ol.geom.closest.getClosestPoint(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * @return {number} Area.
 */
ol.geom.LinearRing.prototype.getArea = function() {
  return ol.geom.flat.linearRingArea(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {ol.geom.RawLinearRing} Coordinates.
 */
ol.geom.LinearRing.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
ol.geom.LinearRing.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = ol.geom.simplify.douglasPeucker(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
  var simplifiedLinearRing = new ol.geom.LinearRing(null);
  simplifiedLinearRing.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates);
  return simplifiedLinearRing;
};


/**
 * @inheritDoc
 */
ol.geom.LinearRing.prototype.getType = function() {
  return ol.geom.GeometryType.LINEAR_RING;
};


/**
 * @param {ol.geom.RawLinearRing} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.LinearRing.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (goog.isNull(coordinates)) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (goog.isNull(this.flatCoordinates)) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = ol.geom.flat.deflateCoordinates(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
ol.geom.LinearRing.prototype.setFlatCoordinates =
    function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.dispatchChangeEvent();
};
