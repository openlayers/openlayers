/**
 * @module ol/format/filter/IsNull
 */
import Comparison from './Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNull>` comparison operator.
 * @api
 */
class IsNull extends Comparison {
  /**
   * @param {!string} propertyName Name of the context property to compare.
   */
  constructor(propertyName) {
    super('PropertyIsNull', propertyName);
  }
}

export default IsNull;
