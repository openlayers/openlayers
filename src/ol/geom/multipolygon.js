goog.provide('ol.geom.MultiPolygon');

goog.require('goog.asserts');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @extends {ol.geom.GeometryCollection}
 * @param {Array.<Array.<ol.geom.CoordinateArray>>} coordinates Coordinates
 *    array.
 */
ol.geom.MultiPolygon = function(coordinates) {
  goog.base(this);

  var numParts = coordinates.length,
      dimension;

  /**
   * @type {Array.<ol.geom.Polygon>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Polygon(coordinates[i]);
    if (!goog.isDef(dimension)) {
      dimension = this.components[i].dimension;
    } else {
      goog.asserts.assert(this.components[i].dimension === dimension);
    }
  }

  /**
   * @type {number}
   */
  this.dimension = dimension;
  goog.asserts.assert(this.dimension >= 2);

};
goog.inherits(ol.geom.MultiPolygon, ol.geom.GeometryCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTIPOLYGON;
};
