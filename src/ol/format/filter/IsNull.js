/**
 * @module ol/format/filter/IsNull
 */
import ComparisonFilter from './Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNull>` comparison operator.
 * @api
 */
class IsNullFilter extends ComparisonFilter {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   */
  constructor(propertyName) {
    super('PropertyIsNull', propertyName);
  }

}

export default IsNullFilter;
