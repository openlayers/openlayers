goog.provide('ol.format.ogc.filter.IsLike');

goog.require('ol');
goog.require('ol.format.ogc.filter.Comparison');


/**
 * @classdesc
 * Represents a `<PropertyIsLike>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} pattern Text pattern.
 * @param {string=} opt_wildCard Pattern character which matches any sequence of
 *    zero or more string characters. Default is '*'.
 * @param {string=} opt_singleChar pattern character which matches any single
 *    string character. Default is '.'.
 * @param {string=} opt_escapeChar Escape character which can be used to escape
 *    the pattern characters. Default is '!'.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.IsLike = function(propertyName, pattern,
    opt_wildCard, opt_singleChar, opt_escapeChar, opt_matchCase) {
  ol.format.ogc.filter.Comparison.call(this, 'PropertyIsLike', propertyName);

  /**
   * @public
   * @type {!string}
   */
  this.pattern = pattern;

  /**
   * @public
   * @type {!string}
   */
  this.wildCard = (opt_wildCard !== undefined) ? opt_wildCard : '*';

  /**
   * @public
   * @type {!string}
   */
  this.singleChar = (opt_singleChar !== undefined) ? opt_singleChar : '.';

  /**
   * @public
   * @type {!string}
   */
  this.escapeChar = (opt_escapeChar !== undefined) ? opt_escapeChar : '!';

  /**
   * @public
   * @type {boolean|undefined}
   */
  this.matchCase = opt_matchCase;
};
ol.inherits(ol.format.ogc.filter.IsLike, ol.format.ogc.filter.Comparison);
