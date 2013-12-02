goog.provide('ol.geom.Polygon');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.flat');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawPolygon} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.Polygon = function(coordinates, opt_layout) {

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
  this.interiorPointRevision_ = -1;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.interiorPoint_ = null;

  this.setCoordinates(coordinates, opt_layout);

};
goog.inherits(ol.geom.Polygon, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.containsXY = function(x, y) {
  return ol.geom.flat.linearRingsContainsXY(
      this.flatCoordinates, 0, this.ends_, this.stride, x, y);
};


/**
 * @return {number} Area.
 */
ol.geom.Polygon.prototype.getArea = function() {
  return ol.geom.flat.linearRingsArea(
      this.flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {ol.geom.RawPolygon} Coordinates.
 */
ol.geom.Polygon.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinatess(
      this.flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
ol.geom.Polygon.prototype.getEnds = function() {
  return this.ends_;
};


/**
 * @return {ol.Coordinate} Interior point.
 */
ol.geom.Polygon.prototype.getInteriorPoint = function() {
  if (this.interiorPointRevision_ != this.revision) {
    var extent = this.getExtent();
    var y = (extent[1] + extent[3]) / 2;
    this.interiorPoint_ = ol.geom.flat.linearRingsGetInteriorPoint(
        this.flatCoordinates, 0, this.ends_, this.stride, y);
    this.interiorPointRevision_ = this.revision;
  }
  return this.interiorPoint_;
};


/**
 * @return {Array.<ol.geom.LinearRing>} Linear rings.
 */
ol.geom.Polygon.prototype.getLinearRings = function() {
  var linearRings = [];
  var coordinates = this.getCoordinates();
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    linearRings.push(new ol.geom.LinearRing(coordinates[i]));
  }
  return linearRings;
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getType = function() {
  return ol.geom.Type.POLYGON;
};


/**
 * @param {ol.geom.RawPolygon} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.Polygon.prototype.setCoordinates = function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 2);
  ol.geom.flat.deflateCoordinatess(
      this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
  ol.geom.flat.orientLinearRings(
      this.flatCoordinates, 0, this.ends_, this.stride);
  this.dispatchChangeEvent();
};
