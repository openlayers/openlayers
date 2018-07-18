/**
 * @module ol/format/filter/IsNull
 */
import Comparison from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNull>` comparison operator.
 */
class IsNull extends Comparison {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @api
   */
  constructor(propertyName) {
    super('PropertyIsNull', propertyName);
  }

}

export default IsNull;
