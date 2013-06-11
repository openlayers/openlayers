goog.provide('ol.expression');

goog.require('ol.expression.Parser');


/**
 * Parse an expression
 * @param {string} source The expression source (e.g. `'foo + 2'`).
 * @return {ol.expression.Expression} An expression instance that can be
 *     evaluated within some scope to provide a value.
 */
ol.expression.parse = function(source) {
  var parser = new ol.expression.Parser();
  return parser.parse(source);
};
