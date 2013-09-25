goog.provide('ol.geom.GeometryCollection');

goog.require('goog.asserts');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');



/**
 * A mixed collection of geometries.  Used one of the fixed type multi-part
 * constructors for collections of the same type.
 *
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {Array.<ol.geom.Geometry>} geometries Array of geometries.
 */
ol.geom.GeometryCollection = function(geometries) {
  goog.base(this);

  /**
   * @type {Array.<ol.geom.Geometry>}
   */
  this.components = geometries;

};
goog.inherits(ol.geom.GeometryCollection, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.getType = function() {
  return ol.geom.GeometryType.GEOMETRYCOLLECTION;
};
