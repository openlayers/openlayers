goog.provide('ol.geom.Polygon');

goog.require('goog.asserts');
goog.require('goog.vec.Float64Array');
goog.require('ol.Extent');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LinearRing');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array.<ol.geom.CoordinateArray>} coordinates Array of rings.  First
 *    is outer, any remaining are inner.
 */
ol.geom.Polygon = function(coordinates) {

  var numRings = coordinates.length,
      dimension;

  /**
   * @type {Array.<ol.geom.LinearRing>}
   */
  this.rings = new Array(numRings);
  for (var i = 0; i < numRings; ++i) {
    this.rings[i] = new ol.geom.LinearRing(coordinates[i]);
    if (!goog.isDef(dimension)) {
      dimension = this.rings[i].dimension;
    } else {
      goog.asserts.assert(this.rings[i].dimension === dimension);
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


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getBounds = function() {
  return this.rings[0].getBounds();
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getType = function() {
  return ol.geom.GeometryType.POLYGON;
};
