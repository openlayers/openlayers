goog.provide('ol.source.Vector2');

goog.require('ol.geom2.LineStringCollection');
goog.require('ol.geom2.PointCollection');
goog.require('ol.source.Source');



/**
 * This is an internal class that will be removed from the API.
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.Vector2Options} options Options.
 * @todo stability experimental
 */
ol.source.Vector2 = function(options) {

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

  /**
   * @private
   * @type {Array.<ol.geom2.LineStringCollection>}
   */
  this.lineStringCollections_ = goog.isDef(options.lineStringCollections) ?
      options.lineStringCollections : [];

};
goog.inherits(ol.source.Vector2, ol.source.Source);


/**
 * @return {Array.<ol.geom2.LineStringCollection>} Line string collections.
 */
ol.source.Vector2.prototype.getLineStringCollections = function() {
  return this.lineStringCollections_;
};


/**
 * @return {Array.<ol.geom2.PointCollection>} Point collections.
 */
ol.source.Vector2.prototype.getPointCollections = function() {
  return this.pointCollections_;
};
