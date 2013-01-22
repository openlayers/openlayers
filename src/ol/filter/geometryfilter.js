goog.provide('ol.filter.Geometry');
goog.provide('ol.filter.GeometryType');

goog.require('ol.Feature');
goog.require('ol.filter.Filter');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @implements {ol.filter.Filter}
 * @param {ol.geom.GeometryType} type The geometry type.
 */
ol.filter.Geometry = function(type) {

  /**
   * @type {ol.geom.GeometryType}
   * @private
   */
  this.type_ = type;

};


/**
 * @inheritDoc
 */
ol.filter.Geometry.prototype.evaluate = function(feature) {
  var geometry = feature.getGeometry();
  return goog.isNull(geometry) ? false : geometry.getType() === this.type_;
};


/**
 * @return {ol.geom.GeometryType} The geometry type.
 */
ol.filter.Geometry.prototype.getType = function() {
  return this.type_;
};

