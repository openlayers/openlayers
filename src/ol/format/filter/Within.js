/**
 * @module ol/format/filter/Within
 */
import {inherits} from '../../util.js';
import Spatial from '../filter/Spatial.js';

/**
 * @classdesc
 * Represents a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!module:ol/geom/Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {module:ol/format/filter/Spatial}
 * @api
 */
const Within = function(geometryName, geometry, opt_srsName) {

  Spatial.call(this, 'Within', geometryName, geometry, opt_srsName);

};

inherits(Within, Spatial);
export default Within;
