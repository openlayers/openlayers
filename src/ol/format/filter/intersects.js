import _ol_ from '../../index';
import _ol_format_filter_Spatial_ from '../filter/spatial';

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
var _ol_format_filter_Intersects_ = function(geometryName, geometry, opt_srsName) {

  _ol_format_filter_Spatial_.call(this, 'Intersects', geometryName, geometry, opt_srsName);

};

_ol_.inherits(_ol_format_filter_Intersects_, _ol_format_filter_Spatial_);
export default _ol_format_filter_Intersects_;
