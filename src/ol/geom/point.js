goog.provide('ol.geom.Point');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawPoint} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.Point = function(coordinates, opt_layout) {
  goog.base(this);
  this.setCoordinates(coordinates, opt_layout);
};
goog.inherits(ol.geom.Point, ol.geom.Geometry);


/**
 * @return {ol.geom.RawPoint} Coordinates.
 */
ol.geom.Point.prototype.getCoordinates = function() {
  return this.flatCoordinates.slice();
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.revision) {
    this.extent = ol.extent.createOrUpdateFromCoordinate(
        this.flatCoordinates, this.extent);
    this.extentRevision = this.revision;
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.getType = function() {
  return ol.geom.Type.POINT;
};


/**
 * @param {ol.geom.RawPoint} coordinates Coordinates.
 * @param {ol.geom.Layout=} opt_layout Layout.
 */
ol.geom.Point.prototype.setCoordinates = function(coordinates, opt_layout) {
  this.setLayout(opt_layout, coordinates, 0);
  this.flatCoordinates = coordinates;
  this.dispatchChangeEvent();
};
