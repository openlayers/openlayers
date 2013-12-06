goog.provide('ol.geom.LineString');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.flat');
goog.require('ol.geom.simplify');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawLineString} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.LineString = function(coordinates, opt_layout) {
  goog.base(this);
  this.setCoordinates(coordinates, opt_layout);
};
goog.inherits(ol.geom.LineString, ol.geom.Geometry);


/**
 * @return {ol.geom.RawLineString} Coordinates.
 */
ol.geom.LineString.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {number} Length.
 */
ol.geom.LineString.prototype.getLength = function() {
  return ol.geom.flat.lineStringLength(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = ol.geom.simplify.douglasPeucker(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
  var simplifiedLineString = new ol.geom.LineString(null);
  simplifiedLineString.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates);
  return simplifiedLineString;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getType = function() {
  return ol.geom.GeometryType.LINE_STRING;
};


/**
 * @param {ol.geom.RawLineString} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
    this.flatCoordinates.length = ol.geom.flat.deflateCoordinates(
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
