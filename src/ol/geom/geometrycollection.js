goog.provide('ol.geom.GeometryCollection');

goog.require('ol.Extent');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');



/**
 * A collection of geometries.  This constructor should not called.  Instead
 * create one of the fixed type collections.
 * @constructor
 * @extends {ol.geom.Geometry}
 */
ol.geom.GeometryCollection = function() {

  goog.base(this);

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
goog.inherits(ol.geom.GeometryCollection, ol.geom.Geometry);


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
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.getType = function() {
  return ol.geom.GeometryType.GEOMETRYCOLLECTION;
};
