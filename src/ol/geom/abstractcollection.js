goog.provide('ol.geom.AbstractCollection');

goog.require('ol.Extent');
goog.require('ol.geom.Geometry');



/**
 * A collection of geometries.  This constructor is not to be used directly.
 *
 * @constructor
 * @extends {ol.geom.Geometry}
 */
ol.geom.AbstractCollection = function() {
  goog.base(this);

  /**
   * @type {number}
   */
  this.dimension;

  /**
   * @type {Array.<ol.geom.Geometry>}
   */
  this.components = null;

  /**
   * @type {ol.Extent}
   * @protected
   */
  this.bounds = null;

};
goog.inherits(ol.geom.AbstractCollection, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.AbstractCollection.prototype.getBounds = function() {
  if (goog.isNull(this.bounds)) {
    var minX,
        minY = minX = Infinity,
        maxX,
        maxY = maxX = -Infinity,
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
ol.geom.AbstractCollection.prototype.getCoordinates = function() {
  var count = this.components.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = this.components[i].getCoordinates();
  }
  return coordinates;
};


/**
 * @inheritDoc
 */
ol.geom.AbstractCollection.prototype.getType = goog.abstractMethod;
