/**
 * @module ol/format/filter/Spatial
 */
import {inherits} from '../../util.js';
import Filter from '../filter/Filter.js';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Represents a spatial operator to test whether a geometry-valued property
 * relates to a given geometry.
 *
 * @constructor
 * @abstract
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} geometryName Geometry name to use.
 * @param {!module:ol/geom/Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {module:ol/format/filter/Filter}
 */
const Spatial = function(tagName, geometryName, geometry, opt_srsName) {

  Filter.call(this, tagName);

  /**
   * @type {!string}
   */
  this.geometryName = geometryName || 'the_geom';

  /**
   * @type {module:ol/geom/Geometry}
   */
  this.geometry = geometry;

  /**
   * @type {string|undefined}
   */
  this.srsName = opt_srsName;
};

inherits(Spatial, Filter);

export default Spatial;
