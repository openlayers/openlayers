goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('ol.Extent');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.CoordinateArray} coordinates Coordinates array (e.g.
 *    [[x0, y0], [x1, y1]]).
 */
ol.geom.LineString = function(coordinates) {

  goog.base(this);

  // assume the same dimension for all coordinates
  var dimension = coordinates[0].length,
      count = coordinates.length,
      length = count * dimension;

  /**
   * @type {Array}
   */
  this.coordinates = new Array(length);
  var i, offset, j;
  for (i = 0; i < count; ++i) {
    goog.asserts.assert(coordinates[i].length === dimension);
    offset = i * dimension;
    for (j = 0; j < dimension; ++j) {
      this.coordinates[offset + j] = coordinates[i][j];
    }
  }

  /**
   * @type {number}
   */
  this.dimension = dimension;
  goog.asserts.assert(this.dimension >= 2);

  /**
   * @type {ol.Extent}
   * @private
   */
  this.bounds_ = null;

};
goog.inherits(ol.geom.LineString, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getBounds = function() {
  if (goog.isNull(this.bounds_)) {
    var minX,
        minY = minX = Number.POSITIVE_INFINITY,
        maxX,
        maxY = maxX = Number.NEGATIVE_INFINITY,
        coordinates = this.coordinates,
        len = coordinates.length,
        dim = this.dimension,
        x, y, i;

    for (i = 0; i < len; i += dim) {
      x = coordinates[i];
      y = coordinates[i + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    this.bounds_ = new ol.Extent(minX, minY, maxX, maxY);
  }
  return this.bounds_;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getType = function() {
  return ol.geom.GeometryType.LINESTRING;
};
