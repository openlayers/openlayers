goog.provide('ol.format.filter.Intersects');

goog.require('ol');
goog.require('ol.format.filter.Spatial');


/**
 * @classdesc
 * Represents a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.filter.Spatial}
 * @api
 */
ol.format.filter.Intersects = function(geometryName, geometry, opt_srsName) {

  ol.format.filter.Spatial.call(this, 'Intersects', geometryName, geometry, opt_srsName);

};
ol.inherits(ol.format.filter.Intersects, ol.format.filter.Spatial);
