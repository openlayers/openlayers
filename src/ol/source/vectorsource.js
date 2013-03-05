goog.provide('ol.source.Vector');

goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.Projection');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Filter');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.geom.GeometryType');
goog.require('ol.source.Source');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            projection: (ol.Projection|undefined)}}
 */
ol.source.VectorOptions;



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.VectorOptions} options Source options.
 */
ol.source.Vector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    projection: options.projection
  });

};
goog.inherits(ol.source.Vector, ol.source.Source);
