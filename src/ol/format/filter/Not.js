/**
 * @module ol/format/filter/Not
 */
import {inherits} from '../../util.js';
import Filter from '../filter/Filter.js';

/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @constructor
 * @param {!module:ol/format/filter/Filter} condition Filter condition.
 * @extends {module:ol/format/filter/Filter}
 * @api
 */
const Not = function(condition) {

  Filter.call(this, 'Not');

  /**
   * @type {!module:ol/format/filter/Filter}
   */
  this.condition = condition;
};

inherits(Not, Filter);
export default Not;
