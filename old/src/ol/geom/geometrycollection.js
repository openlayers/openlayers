goog.provide('ol.geom.GeometryCollection');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
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
 * @todo stability experimental
 */
ol.geom.GeometryCollection = function(geometries) {
  goog.base(this);

  for (var i = geometries.length - 1; i >= 0; --i) {
    goog.events.listen(geometries[i], goog.events.EventType.CHANGE,
        this.handleComponentChange, false, this);
  }

  /**
   * @type {Array.<ol.geom.Geometry>}
   * @protected
   */
  this.components = geometries;

};
goog.inherits(ol.geom.GeometryCollection, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.clone = function() {
  var numComponents = this.components.length;
  var components = new Array(numComponents);
  for (var i = 0; i < numComponents; ++i) {
    components[i] = this.components[i].clone();
  }
  return new ol.geom.GeometryCollection(components);
};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.getType = function() {
  return ol.geom.GeometryType.GEOMETRYCOLLECTION;
};
