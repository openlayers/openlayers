import _ol_ from '../../index';
import _ol_format_filter_Filter_ from '../filter/filter';

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
var _ol_format_filter_Bbox_ = function(geometryName, extent, opt_srsName) {

  _ol_format_filter_Filter_.call(this, 'BBOX');

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

_ol_.inherits(_ol_format_filter_Bbox_, _ol_format_filter_Filter_);
export default _ol_format_filter_Bbox_;
