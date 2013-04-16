goog.provide('ol.geom.AbstractCollection');

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
      minX = Math.min(bounds[0], minX);
      maxX = Math.max(bounds[1], maxX);
      minY = Math.min(bounds[2], minY);
      maxY = Math.max(bounds[3], maxY);
    }
    this.bounds = [minX, maxX, minY, maxY];
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
