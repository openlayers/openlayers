goog.provide('ol.geom.Polygon');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {Array.<Array.<ol.Coordinate>>} rings Rings.
 */
ol.geom.Polygon = function(rings) {

  goog.base(this);

  /**
   * @private
   * @type {Array.<Array.<ol.Coordinate>>}
   */
  this.rings_ = rings;

};
goog.inherits(ol.geom.Polygon, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.revision) {
    this.extent = ol.extent.createOrUpdateFromRings(this.rings_, this.extent);
    this.extentRevision = this.revision;
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @return {Array.<Array.<ol.Coordinate>>} Rings.
 */
ol.geom.Polygon.prototype.getRings = function() {
  return this.rings_;
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getType = function() {
  return ol.geom.GeometryType.POLYGON;
};


/**
 * @param {Array.<Array.<ol.Coordinate>>} rings Rings.
 */
ol.geom.Polygon.prototype.setRings = function(rings) {
  this.rings_ = rings;
  this.dispatchChangeEvent();
};
