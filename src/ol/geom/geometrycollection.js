goog.provide('ol.geom.GeometryCollection');

goog.require('goog.asserts');
goog.require('ol.Extent');
goog.require('ol.geom.Geometry');



/**
 * A mixed collection of geometries.  This constructor is typically not called
 * directly.  Instead call @see ol.geom.GeometryCollection#fromGeometries.
 * @constructor
 * @implements {ol.geom.Geometry}
 */
ol.geom.GeometryCollection = function() {

  /**
   * @type {Array.<ol.geom.Geometry>}
   */
  this.components = null;

  /**
   * @type {number}
   */
  this.dimension;

  /**
   * @type {ol.Extent}
   * @protected
   */
  this.bounds = null;

};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.getBounds = function() {
  if (goog.isNull(this.bounds)) {
    var minX,
        minY = minX = Number.POSITIVE_INFINITY,
        maxX,
        maxY = maxX = Number.NEGATIVE_INFINITY,
        components = this.components,
        len = components.length,
        bounds, i;

    for (i = 0; i < len; ++i) {
      bounds = components[i].getBounds();
      minX = Math.min(bounds.minX, minX);
      minY = Math.min(bounds.minY, minY);
      maxX = Math.max(bounds.maxX, maxX);
      maxY = Math.max(bounds.maxY, maxY);
    }
    this.bounds = new ol.Extent(minX, minY, maxX, maxY);
  }
  return this.bounds;
};


/**
 * @param {Array.<ol.geom.Geometry>} components Array of geometries.
 * @return {ol.geom.GeometryCollection} A mixed geometry collection.
 */
ol.geom.GeometryCollection.fromGeometries = function(components) {
  var collection = new ol.geom.GeometryCollection();
  collection.components = components;
  return collection;
};
