goog.provide('ol.geom.MultiPoint');

goog.require('ol.geom.Geometry');
goog.require('ol.geom.flat');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawMultiPoint} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
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
  return ol.geom.inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.Type.MULTI_POINT;
};


/**
 * @param {ol.geom.RawMultiPoint} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.MultiPoint.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 1);
  ol.geom.flat.deflateCoordinates(
      this.flatCoordinates, 0, coordinates, this.stride);
  this.dispatchChangeEvent();
};
