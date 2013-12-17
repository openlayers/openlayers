goog.provide('ol.geom.MultiLineString');

goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.closest');
goog.require('ol.geom.flat');
goog.require('ol.geom.simplify');



/**
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.geom.RawMultiLineString} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.MultiLineString = function(coordinates, opt_layout) {

  goog.base(this);

  /**
   * @type {Array.<number>}
   * @private
   */
  this.ends_ = [];

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
goog.inherits(ol.geom.MultiLineString, ol.geom.SimpleGeometry);


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.clone = function() {
  var multiLineString = new ol.geom.MultiLineString(null);
  multiLineString.setFlatCoordinates(
      this.layout, this.flatCoordinates.slice(), this.ends_.slice());
  return multiLineString;
};


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.closestPointXY =
    function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      ol.extent.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.revision) {
    this.maxDelta_ = Math.sqrt(ol.geom.closest.getsMaxSquaredDelta(
        this.flatCoordinates, 0, this.ends_, this.stride, 0));
    this.maxDeltaRevision_ = this.revision;
  }
  return ol.geom.closest.getsClosestPoint(
      this.flatCoordinates, 0, this.ends_, this.stride,
      this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
};


/**
 * @return {ol.geom.RawMultiLineString} Coordinates.
 */
ol.geom.MultiLineString.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinatess(
      this.flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
ol.geom.MultiLineString.prototype.getEnds = function() {
  return this.ends_;
};


/**
 * @return {Array.<ol.geom.LineString>} LineStrings.
 */
ol.geom.MultiLineString.prototype.getLineStrings = function() {
  // FIXME we should construct the line strings from the flat coordinates
  var coordinates = this.getCoordinates();
  var lineStrings = [];
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    lineStrings.push(new ol.geom.LineString(coordinates[i]));
  }
  return lineStrings;
};


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEnds = [];
  simplifiedFlatCoordinates.length = ol.geom.simplify.douglasPeuckers(
      this.flatCoordinates, 0, this.ends_, this.stride, squaredTolerance,
      simplifiedFlatCoordinates, 0, simplifiedEnds);
  var simplifiedMultiLineString = new ol.geom.MultiLineString(null);
  simplifiedMultiLineString.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates, simplifiedEnds);
  return simplifiedMultiLineString;
};


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_LINE_STRING;
};


/**
 * @param {ol.geom.RawMultiLineString} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.MultiLineString.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (goog.isNull(coordinates)) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null, this.ends_);
  } else {
    this.setLayout(opt_layout, coordinates, 2);
    if (goog.isNull(this.flatCoordinates)) {
      this.flatCoordinates = [];
    }
    var ends = ol.geom.flat.deflateCoordinatess(
        this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>} ends Ends.
 */
ol.geom.MultiLineString.prototype.setFlatCoordinates =
    function(layout, flatCoordinates, ends) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.ends_ = ends;
  this.dispatchChangeEvent();
};
