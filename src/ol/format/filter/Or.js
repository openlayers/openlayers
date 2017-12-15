/**
 * @module ol/format/filter/Or
 */
import {inherits} from '../../index.js';
import LogicalNary from '../filter/LogicalNary.js';

/**
 * @classdesc
 * Represents a logical `<Or>` operator between two ore more filter conditions.
 *
 * @constructor
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.LogicalNary}
 * @api
 */
var Or = function(conditions) {
  var params = ['Or'].concat(Array.prototype.slice.call(arguments));
  LogicalNary.apply(this, params);
};

inherits(Or, LogicalNary);
export default Or;
