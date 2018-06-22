/**
 * @module ol/format/filter/And
 */
import {inherits} from '../../util.js';
import LogicalNary from '../filter/LogicalNary.js';

/**
 * @classdesc
 * Represents a logical `<And>` operator between two or more filter conditions.
 *
 * @constructor
 * @abstract
 * @param {...module:ol/format/filter/Filter} conditions Conditions.
 * @extends {module:ol/format/filter/LogicalNary}
 */
const And = function(conditions) {
  const params = ['And'].concat(Array.prototype.slice.call(arguments));
  LogicalNary.apply(this, params);
};

inherits(And, LogicalNary);

export default And;
