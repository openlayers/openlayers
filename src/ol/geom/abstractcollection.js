goog.provide('ol.geom.AbstractCollection');

goog.require('ol.extent');
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
    var bounds = ol.extent.createEmpty();
    var components = this.components;
    for (var i = 0, ii = components.length; i < ii; ++i) {
      ol.extent.extend(bounds, components[i].getBounds());
    }
    this.bounds = bounds;
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
