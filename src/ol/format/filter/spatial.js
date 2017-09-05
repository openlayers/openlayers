import _ol_ from '../../index';
import _ol_format_filter_Filter_ from '../filter/filter';

/**
 * @classdesc
 * Represents a spatial operator to test whether a geometry-valued property
 * relates to a given geometry.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} geometryName Geometry name to use.
 * @param {!ol.geom.Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {ol.format.filter.Filter}
 * @api
 */
var _ol_format_filter_Spatial_ = function(tagName, geometryName, geometry, opt_srsName) {

  _ol_format_filter_Filter_.call(this, tagName);

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

_ol_.inherits(_ol_format_filter_Spatial_, _ol_format_filter_Filter_);
export default _ol_format_filter_Spatial_;
