goog.provide('ol.geom.MultiPoint');

goog.require('goog.asserts');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');



/**
 * @constructor
 * @extends {ol.geom.GeometryCollection}
 * @param {ol.geom.CoordinateArray} coordinates Coordinates array.
 */
ol.geom.MultiPoint = function(coordinates) {
  goog.base(this);

  var numParts = coordinates.length,
      dimension;

  /**
   * @type {Array.<ol.geom.Point>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Point(coordinates[i]);
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
goog.inherits(ol.geom.MultiPoint, ol.geom.GeometryCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.GeometryType.MULTIPOINT;
};
