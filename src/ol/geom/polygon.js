goog.provide('ol.geom.Polygon');

goog.require('ol.geom.Geometry');
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

  this.setCoordinates(coordinates, opt_layout);

};
goog.inherits(ol.geom.Polygon, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.containsXY = function(x, y) {
  return ol.geom.flatLinearRingsContainsXY(
      this.flatCoordinates, 0, this.ends_, this.stride, x, y);
};


/**
 * @return {ol.geom.RawPolygon} Coordinates.
 */
ol.geom.Polygon.prototype.getCoordinates = function() {
  return ol.geom.inflateCoordinatess(
      this.flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
ol.geom.Polygon.prototype.getEnds = function() {
  return this.ends_;
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
ol.geom.Polygon.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 2);
  ol.geom.flat.deflateCoordinatess(
      this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
  ol.geom.orientFlatLinearRings(
      this.flatCoordinates, 0, this.ends_, this.stride);
  this.dispatchChangeEvent();
};
