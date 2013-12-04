goog.provide('ol.geom.MultiPoint');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.Point');
goog.require('ol.geom.flat');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawMultiPoint} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.MultiPoint = function(coordinates, opt_layout) {
  goog.base(this);
  this.setCoordinates(coordinates, opt_layout);
};
goog.inherits(ol.geom.MultiPoint, ol.geom.Geometry);


/**
 * @return {ol.geom.RawMultiPoint} Coordinates.
 */
ol.geom.MultiPoint.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {Array.<ol.geom.Point>} Points.
 */
ol.geom.MultiPoint.prototype.getPoints = function() {
  // FIXME we should construct the points from the flat coordinates
  var coordinates = this.getCoordinates();
  var points = [];
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    points.push(new ol.geom.Point(coordinates[i]));
  }
  return points;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.Type.MULTI_POINT;
};


/**
 * @param {ol.geom.RawMultiPoint} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.MultiPoint.prototype.setCoordinates =
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
ol.geom.MultiPoint.prototype.setFlatCoordinates =
    function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.dispatchChangeEvent();
};
