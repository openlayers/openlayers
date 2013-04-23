goog.provide('ol.source.VectorSource2');

goog.require('ol.geom2.PointCollection');
goog.require('ol.source.Source');



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.VectorSource2Options} options Options.
 */
ol.source.VectorSource2 = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    projection: options.projection
  });

  /**
   * @private
   * @type {Array.<ol.geom2.PointCollection>}
   */
  this.pointCollections_ = goog.isDef(options.pointCollections) ?
      options.pointCollections : [];

};
goog.inherits(ol.source.VectorSource2, ol.source.Source);


/**
 * @return {Array.<ol.geom2.PointCollection>} Point collections.
 */
ol.source.VectorSource2.prototype.getPointCollections = function() {
  return this.pointCollections_;
};
