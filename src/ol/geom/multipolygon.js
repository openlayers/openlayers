goog.provide('ol.geom.MultiPolygon');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} ringss Ringss.
 */
ol.geom.MultiPolygon = function(ringss) {

  goog.base(this);

  /**
   * @private
   * @type {Array.<Array.<Array.<ol.Coordinate>>>}
   */
  this.ringss_ = ringss;

};
goog.inherits(ol.geom.MultiPolygon, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.revision) {
    this.extent = ol.extent.createOrUpdateEmpty(this.extent);
    var ringss = this.ringss_;
    var i, ii;
    for (i = 0, ii = ringss.length; i < ii; ++i) {
      ol.extent.extendRings(this.extent, ringss[i]);
    }
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @return {Array.<Array.<Array.<ol.Coordinate>>>} Ringss.
 */
ol.geom.MultiPolygon.prototype.getRingss = function() {
  return this.ringss_;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_POLYGON;
};


/**
 * @param {Array.<Array.<Array.<ol.Coordinate>>>} ringss Ringss.
 */
ol.geom.MultiPolygon.prototype.setRingss = function(ringss) {
  this.ringss_ = ringss;
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.transform = function(transformFn) {
  var ringss = this.ringss_;
  var i, ii;
  for (i = 0, ii = ringss.length; i < ii; ++i) {
    var rings = ringss[i];
    var j, jj;
    for (j = 0, jj = rings.length; j < jj; ++j) {
      var coordinates = rings[j];
      var k, kk;
      for (k = 0, kk = coordinates.length; k < kk; ++k) {
        var coordinate = coordinates[k];
        transformFn(coordinate, coordinate, 2);
      }
    }
  }
};
