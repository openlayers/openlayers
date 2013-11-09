goog.provide('ol.geom.Polygon');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.RawPolygon} rings Rings.
 */
ol.geom.Polygon = function(rings) {

  goog.base(this);

  /**
   * @private
   * @type {ol.geom.RawPolygon}
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
 * @return {ol.geom.RawPolygon} Rings.
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
 * @param {ol.geom.RawPolygon} rings Rings.
 */
ol.geom.Polygon.prototype.setRings = function(rings) {
  this.rings_ = rings;
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.transform = function(transformFn) {
  var rings = this.rings_;
  var i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    var coordinates = rings[i];
    var j, jj;
    for (j = 0, jj = coordinates.length; j < jj; ++j) {
      var coordinate = coordinates[j];
      transformFn(coordinate, coordinate, 2);
    }
  }
};
