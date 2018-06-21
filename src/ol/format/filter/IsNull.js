/**
 * @module ol/format/filter/IsNull
 */
import {inherits} from '../../util.js';
import Comparison from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNull>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @extends {module:ol/format/filter/Comparison}
 * @api
 */
const IsNull = function(propertyName) {
  Comparison.call(this, 'PropertyIsNull', propertyName);
};

inherits(IsNull, Comparison);
export default IsNull;
