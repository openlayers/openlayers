/**
 * @module ol/format/filter/Intersects
 */
import {inherits} from '../../util.js';
import Spatial from '../filter/Spatial.js';

/**
 * @classdesc
 * Represents a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 *
 * @constructor
 * @param {!string} geometryName Geometry name to use.
 * @param {!module:ol/geom/Geometry} geometry Geometry.
 * @param {string=} opt_srsName SRS name. No srsName attribute will be
 *    set on geometries when this is not provided.
 * @extends {module:ol/format/filter/Spatial}
 * @api
 */
const Intersects = function(geometryName, geometry, opt_srsName) {

  Spatial.call(this, 'Intersects', geometryName, geometry, opt_srsName);

};

inherits(Intersects, Spatial);
export default Intersects;
