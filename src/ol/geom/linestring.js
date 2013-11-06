goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 */
ol.geom.LineString = function(coordinates) {

  goog.base(this);

  /**
   * @private
   * @type {Array.<Array.<number>>}
   */
  this.coordinates_ = coordinates;

};
goog.inherits(ol.geom.LineString, ol.geom.Geometry);


/**
 * @return {Array.<Array.<number>>} Coordinates.
 */
ol.geom.LineString.prototype.getCoordinates = function() {
  return this.coordinates_;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.revision) {
    this.extent = ol.extent.createOrUpdateFromCoordinates(
        this.coordinates_, this.extent);
    this.extentRevision = this.revision;
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getType = function() {
  return ol.geom.GeometryType.LINE_STRING;
};


/**
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 */
ol.geom.LineString.prototype.setCoordinates = function(coordinates) {
  this.coordinates_ = coordinates;
  this.dispatchChangeEvent();
};
