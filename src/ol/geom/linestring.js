goog.provide('ol.geom.LineString');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawLineString} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
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
  return ol.geom.inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getType = function() {
  return ol.geom.GeometryType.LINE_STRING;
};


/**
 * @param {ol.geom.RawLineString} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.LineString.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 1);
  ol.geom.deflateCoordinates(this.flatCoordinates, 0, coordinates, this.stride);
  this.dispatchChangeEvent();
};
