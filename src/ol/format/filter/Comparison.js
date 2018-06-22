/**
 * @module ol/format/filter/Comparison
 */
import {inherits} from '../../util.js';
import Filter from '../filter/Filter.js';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property comparison filters.
 *
 * @constructor
 * @abstract
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} propertyName Name of the context property to compare.
 * @extends {module:ol/format/filter/Filter}
 */
const Comparison = function(tagName, propertyName) {

  Filter.call(this, tagName);

  /**
   * @type {!string}
   */
  this.propertyName = propertyName;
};

inherits(Comparison, Filter);

export default Comparison;
