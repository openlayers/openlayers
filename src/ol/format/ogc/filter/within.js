goog.provide('ol.format.ogc.filter.Within');

goog.require('ol');
goog.require('ol.format.ogc.filter.Spatial');


/**
 * @classdesc
 * Represents a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.ogc.filter.Spatial}
 * @api
 */
ol.format.ogc.filter.Within = function(geometryName, geometry, opt_srsName) {

  ol.format.ogc.filter.Spatial.call(this, 'Within', geometryName, geometry, opt_srsName);

};
ol.inherits(ol.format.ogc.filter.Within, ol.format.ogc.filter.Spatial);
