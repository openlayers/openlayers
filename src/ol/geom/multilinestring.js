goog.provide('ol.geom.MultiLineString');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawMultiLineString} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.MultiLineString = function(coordinates, opt_layout) {

  goog.base(this);

  /**
   * @type {Array.<number>}
   * @private
   */
  this.ends_ = [];

  this.setCoordinates(coordinates, opt_layout);

};
goog.inherits(ol.geom.MultiLineString, ol.geom.Geometry);


/**
 * @return {ol.geom.RawMultiLineString} Coordinates.
 */
ol.geom.MultiLineString.prototype.getCoordinates = function() {
  return ol.geom.inflateCoordinatess(
      this.flatCoordinates, 0, this.ends_, this.stride);
};


/**
 * @return {Array.<number>} Ends.
 */
ol.geom.MultiLineString.prototype.getEnds = function() {
  return this.ends_;
};


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_LINE_STRING;
};


/**
 * @param {ol.geom.RawMultiLineString} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.MultiLineString.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 2);
  ol.geom.deflateCoordinatess(
      this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
  this.dispatchChangeEvent();
};
