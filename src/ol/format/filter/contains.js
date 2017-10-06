goog.provide('ol.format.filter.Contains');

goog.require('ol');
goog.require('ol.format.filter.Spatial');


/**
 * @classdesc
 * Represents a `<Contains>` operator to test whether a geometry-valued property
 * contains a given geometry.
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.filter.Spatial}
 * @api
 */
ol.format.filter.Contains = function(geometryName, geometry, opt_srsName) {

  ol.format.filter.Spatial.call(this, 'Contains', geometryName, geometry, opt_srsName);

};
ol.inherits(ol.format.filter.Contains, ol.format.filter.Spatial);
