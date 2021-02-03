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
   * @param {string} [opt_wildCard] Pattern character which matches any sequence of
   *    zero or more string characters. Default is '*'.
   * @param {string} [opt_singleChar] pattern character which matches any single
   *    string character. Default is '.'.
   * @param {string} [opt_escapeChar] Escape character which can be used to escape
   *    the pattern characters. Default is '!'.
   * @param {boolean} [opt_matchCase] Case-sensitive?
   */
  constructor(
    propertyName,
    pattern,
    opt_wildCard,
    opt_singleChar,
    opt_escapeChar,
    opt_matchCase
  ) {
    super('PropertyIsLike', propertyName);

    /**
     * @type {!string}
     */
    this.pattern = pattern;

    /**
     * @type {!string}
     */
    this.wildCard = opt_wildCard !== undefined ? opt_wildCard : '*';

    /**
     * @type {!string}
     */
    this.singleChar = opt_singleChar !== undefined ? opt_singleChar : '.';

    /**
     * @type {!string}
     */
    this.escapeChar = opt_escapeChar !== undefined ? opt_escapeChar : '!';

    /**
     * @type {boolean|undefined}
     */
    this.matchCase = opt_matchCase;
  }
}

export default IsLike;
