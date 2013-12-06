goog.provide('ol.geom.MultiPolygon');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.flat');
goog.require('ol.geom.simplify');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawMultiPolygon} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
  this.interiorPointsRevision_ = -1;

  /**
   * @private
   * @type {Array.<ol.Coordinate>}
   */
  this.interiorPoints_ = null;

  this.setCoordinates(coordinates, opt_layout);

};
goog.inherits(ol.geom.MultiPolygon, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.containsXY = function(x, y) {
  return ol.geom.flat.linearRingssContainsXY(
      this.flatCoordinates, 0, this.endss_, this.stride, x, y);
};


/**
 * @return {number} Area.
 */
ol.geom.MultiPolygon.prototype.getArea = function() {
  return ol.geom.flat.linearRingssArea(
      this.flatCoordinates, 0, this.endss_, this.stride);
};


/**
 * @return {ol.geom.RawMultiPolygon} Coordinates.
 */
ol.geom.MultiPolygon.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinatesss(
      this.flatCoordinates, 0, this.endss_, this.stride);
};


/**
 * @return {Array.<Array.<number>>} Endss.
 */
ol.geom.MultiPolygon.prototype.getEndss = function() {
  return this.endss_;
};


/**
 * @return {Array.<ol.Coordinate>} Interior points.
 */
ol.geom.MultiPolygon.prototype.getInteriorPoints = function() {
  if (this.interiorPointsRevision_ != this.revision) {
    var ys = ol.geom.flat.linearRingssMidYs(
        this.flatCoordinates, 0, this.endss_, this.stride);
    this.interiorPoints_ = ol.geom.flat.linearRingssGetInteriorPoints(
        this.flatCoordinates, 0, this.endss_, this.stride, ys);
    this.interiorPointsRevision_ = this.revision;
  }
  return this.interiorPoints_;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getSimplifiedGeometryInternal =
    function(squaredTolerance) {
  var simplifiedFlatCoordinates = [];
  var simplifiedEndss = [];
  simplifiedFlatCoordinates.length =
      ol.geom.simplify.douglasPeuckerss(this.flatCoordinates, 0,
          this.endss_, this.stride, squaredTolerance, simplifiedFlatCoordinates,
          0, simplifiedEndss);
  var simplifiedMultiPolygon = new ol.geom.MultiPolygon(null);
  simplifiedMultiPolygon.setFlatCoordinates(
      ol.geom.GeometryLayout.XY, simplifiedFlatCoordinates, simplifiedEndss);
  return simplifiedMultiPolygon;
};


/**
 * @return {Array.<ol.geom.Polygon>} Polygons.
 */
ol.geom.MultiPolygon.prototype.getPolygons = function() {
  // FIXME we should construct the polygons directly from the flat coordinates
  var coordinates = this.getCoordinates();
  var polygons = [];
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    polygons.push(new ol.geom.Polygon(coordinates[i]));
  }
  return polygons;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_POLYGON;
};


/**
 * @param {ol.geom.RawMultiPolygon} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
    var endss = ol.geom.flat.deflateCoordinatesss(
        this.flatCoordinates, 0, coordinates, this.stride, this.endss_);
    var lastEnds = endss[endss.length - 1];
    this.flatCoordinates.length = lastEnds.length === 0 ?
        0 : lastEnds[lastEnds.length - 1];
    ol.geom.flat.orientLinearRingss(
        this.flatCoordinates, 0, this.endss_, this.stride);
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
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.endss_ = endss;
  this.dispatchChangeEvent();
};
