/**
 * @module ol/format/filter/Contains
 */
import {inherits} from '../../index.js';
import _ol_format_filter_Spatial_ from '../filter/Spatial.js';

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
var _ol_format_filter_Contains_ = function(geometryName, geometry, opt_srsName) {

  _ol_format_filter_Spatial_.call(this, 'Contains', geometryName, geometry, opt_srsName);

};

inherits(_ol_format_filter_Contains_, _ol_format_filter_Spatial_);
export default _ol_format_filter_Contains_;
