goog.provide('ol.geom.Point');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawPoint} coordinate Coordinate.
 */
ol.geom.Point = function(coordinate) {

  goog.base(this);

  /**
   * @private
   * @type {ol.geom.RawPoint}
   */
  this.coordinate_ = coordinate;

};
goog.inherits(ol.geom.Point, ol.geom.Geometry);


/**
 * @return {ol.geom.RawPoint} Coordinate.
 */
ol.geom.Point.prototype.getCoordinate = function() {
  return this.coordinate_;
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.revision) {
    this.extent = ol.extent.createOrUpdateFromCoordinate(
        this.coordinate_, this.extent);
    this.extentRevision = this.revision;
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getType = function() {
  return ol.geom.GeometryType.POINT;
};


/**
 * @param {ol.geom.RawPoint} coordinate Coordinate.
 */
ol.geom.Point.prototype.setCoordinate = function(coordinate) {
  this.coordinate_ = coordinate;
  this.dispatchChangeEvent();
};
