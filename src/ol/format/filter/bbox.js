goog.provide('ol.format.filter.Bbox');

goog.require('ol');
goog.require('ol.format.filter.Filter');


/**
 * @classdesc
 * Represents a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.Extent} extent Extent.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.filter.Filter}
 * @api
 */
ol.format.filter.Bbox = function(geometryName, extent, opt_srsName) {

  ol.format.filter.Filter.call(this, 'BBOX');

  /**
   * @public
   * @type {!string}
   */
  this.geometryName = geometryName;

  /**
   * @public
   * @type {ol.Extent}
   */
  this.extent = extent;

  /**
   * @public
   * @type {string|undefined}
   */
  this.srsName = opt_srsName;
};
ol.inherits(ol.format.filter.Bbox, ol.format.filter.Filter);
