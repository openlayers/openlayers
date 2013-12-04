goog.provide('ol.geom.LinearRing');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.flat');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawLinearRing} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.LinearRing = function(coordinates, opt_layout) {
  goog.base(this);
  this.setCoordinates(coordinates, opt_layout);
};
goog.inherits(ol.geom.LinearRing, ol.geom.Geometry);


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
ol.geom.LinearRing.prototype.getType = function() {
  return ol.geom.Type.LINEAR_RING;
};


/**
 * @param {ol.geom.RawLinearRing} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.LinearRing.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 1);
  ol.geom.flat.deflateCoordinates(
      this.flatCoordinates, 0, coordinates, this.stride);
  this.dispatchChangeEvent();
};
