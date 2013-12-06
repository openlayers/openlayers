goog.provide('ol.geom.Polygon');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.flat');
goog.require('ol.geom.simplify');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawPolygon} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
ol.geom.Polygon.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEnds = [];
  simplifiedFlatCoordinates.length = ol.geom.simplify.douglasPeuckers(
      this.flatCoordinates, 0, this.ends_, this.stride, squaredTolerance,
      simplifiedFlatCoordinates, 0, simplifiedEnds);
  var simplifiedPolygon = new ol.geom.Polygon(null);
  simplifiedPolygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates, simplifiedEnds);
  return simplifiedPolygon;
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getType = function() {
  return ol.geom.GeometryType.POLYGON;
};


/**
 * @param {ol.geom.RawPolygon} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.Polygon.prototype.setCoordinates = function(coordinates, opt_layout) {
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
    ol.geom.flat.orientLinearRings(
        this.flatCoordinates, 0, this.ends_, this.stride);
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>} ends Ends.
 */
ol.geom.Polygon.prototype.setFlatCoordinates =
    function(layout, flatCoordinates, ends) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.ends_ = ends;
  this.dispatchChangeEvent();
};
