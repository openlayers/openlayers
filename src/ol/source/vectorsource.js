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
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.SourceOptions} options Source options.
 */
ol.source.Vector = function(options) {
  goog.base(this, options);
};
goog.inherits(ol.source.Vector, ol.source.Source);
