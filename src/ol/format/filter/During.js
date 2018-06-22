/**
 * @module ol/format/filter/During
 */
import {inherits} from '../../util.js';
import Comparison from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<During>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} begin The begin date in ISO-8601 format.
 * @param {!string} end The end date in ISO-8601 format.
 * @extends {module:ol/format/filter/Comparison}
 * @api
 */
const During = function(propertyName, begin, end) {
  Comparison.call(this, 'During', propertyName);

  /**
   * @type {!string}
   */
  this.begin = begin;

  /**
   * @type {!string}
   */
  this.end = end;
};

inherits(During, Comparison);
export default During;
