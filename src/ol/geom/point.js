goog.provide('ol.geom.Point');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.Coordinate} coordinates Coordinate values (e.g. [x, y]).
 */
ol.geom.Point = function(coordinates) {
  goog.base(this);

  /**
   * Point coordinate values.
   * @type {ol.Coordinate}
   * @private
   */
  this.coordinates_ = coordinates;

  /**
   * @type {ol.Extent}
   * @private
   */
  this.bounds_ = null;

};
goog.inherits(ol.geom.Point, ol.geom.Geometry);


/**
 * @param {number} dim Coordinate dimension.
 * @return {number} The coordinate value.
 */
ol.geom.Point.prototype.get = function(dim) {
  return this.getCoordinates()[dim];
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getBounds = function() {
  if (goog.isNull(this.bounds_)) {
    var x = this.get(0),
        y = this.get(1);
    this.bounds_ = [x, y, x, y];
  }
  return this.bounds_;
};


/**
 * @inheritDoc
 * @return {ol.Coordinate} Coordinates array.
 */
ol.geom.Point.prototype.getCoordinates = function() {
  return this.coordinates_;
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getType = function() {
  return ol.geom.GeometryType.POINT;
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.transform = function(transform) {
  var coordinates = this.getCoordinates();
  transform(coordinates, coordinates, coordinates.length);
  this.bounds_ = null;
};
