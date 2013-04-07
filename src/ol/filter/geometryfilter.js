goog.provide('ol.filter.Geometry');
goog.provide('ol.filter.GeometryType');

goog.require('ol.filter.Filter');
goog.require('ol.geom.GeometryType');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {ol.geom.GeometryType} type The geometry type.
 */
ol.filter.Geometry = function(type) {
  goog.base(this);

  /**
   * @type {ol.geom.GeometryType}
   * @private
   */
  this.type_ = type;

};
goog.inherits(ol.filter.Geometry, ol.filter.Filter);


/**
 * @inheritDoc
 */
ol.filter.Geometry.prototype.applies = function(feature) {
  var geometry = feature.getGeometry();
  return goog.isNull(geometry) ? false : geometry.getType() === this.type_;
};


/**
 * @return {ol.geom.GeometryType} The geometry type.
 */
ol.filter.Geometry.prototype.getType = function() {
  return this.type_;
};
