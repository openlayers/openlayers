goog.provide('ol.format.filter.Spatial');

goog.require('ol');
goog.require('ol.format.filter.Filter');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Represents a spatial operator to test whether a geometry-valued property
 * relates to a given geometry.
 *
 * deprecated: This class will no longer be exported starting from the next major version.
 *
 * @constructor
 * @abstract
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.filter.Filter}
 * @api
 */
ol.format.filter.Spatial = function(tagName, geometryName, geometry, opt_srsName) {

  ol.format.filter.Filter.call(this, tagName);

  /**
   * @public
   * @type {!string}
   */
  this.geometryName = geometryName || 'the_geom';

  /**
   * @public
   * @type {ol.geom.Geometry}
   */
  this.geometry = geometry;

  /**
   * @public
   * @type {string|undefined}
   */
  this.srsName = opt_srsName;
};
ol.inherits(ol.format.filter.Spatial, ol.format.filter.Filter);
