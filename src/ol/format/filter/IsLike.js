/**
 * @module ol/format/filter/IsLike
 */
import Comparison from './Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsLike>` comparison operator.
 * @api
 */
class IsLike extends Comparison {
  /**
   * [constructor description]
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!string} pattern Text pattern.
   * @param {string} [wildCard] Pattern character which matches any sequence of
   *    zero or more string characters. Default is '*'.
   * @param {string} [singleChar] pattern character which matches any single
   *    string character. Default is '.'.
   * @param {string} [escapeChar] Escape character which can be used to escape
   *    the pattern characters. Default is '!'.
   * @param {boolean} [matchCase] Case-sensitive?
   */
  constructor(
    propertyName,
    pattern,
    wildCard,
    singleChar,
    escapeChar,
    matchCase,
  ) {
    super('PropertyIsLike', propertyName);

    /**
     * @type {!string}
     */
    this.pattern = pattern;

    /**
     * @type {!string}
     */
    this.wildCard = wildCard !== undefined ? wildCard : '*';

    /**
     * @type {!string}
     */
    this.singleChar = singleChar !== undefined ? singleChar : '.';

    /**
     * @type {!string}
     */
    this.escapeChar = escapeChar !== undefined ? escapeChar : '!';

    /**
     * @type {boolean|undefined}
     */
    this.matchCase = matchCase;
  }
}

export default IsLike;
