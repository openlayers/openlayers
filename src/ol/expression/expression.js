goog.provide('ol.expression');

goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.expression.Call');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Parser');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');


/**
 * Evaluate an expression with a feature.  The feature attributes will be used
 * as the evaluation scope.  The `ol.expression.lib` functions will be used as
 * function scope.  The feature itself will be used as the `this` argument.
 *
 * @param {ol.expression.Expression} expr The expression.
 * @param {ol.Feature} feature The feature.
 * @return {*} The result of the expression.
 */
ol.expression.evaluateFeature = function(expr, feature) {
  return expr.evaluate(
      feature.getAttributes(), ol.expression.lib, feature);
};


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


/**
 * Determines whether an expression is a call expression that calls one of the
 * `ol.expression.lib` functions.
 *
 * @param {ol.expression.Expression} expr The candidate expression.
 * @return {string|undefined} If the candidate expression is a call to a lib
 * function, the return will be the function name.  If not, the return will be
 * `undefined`.
 */
ol.expression.isLibCall = function(expr) {
  var name;
  if (expr instanceof ol.expression.Call) {
    var callee = expr.getCallee();
    if (callee instanceof ol.expression.Identifier) {
      name = callee.getName();
      if (!ol.expression.lib.hasOwnProperty(name)) {
        name = undefined;
      }
    }
  }
  return name;
};


/**
 * Library of well-known functions.  These are available to expressions parsed
 * with `ol.expression.parse`.
 *
 * @type {Object}
 */
ol.expression.lib = {

  /**
   * Determine if a feature's extent intersects the provided extent.
   * @param {number} minX Minimum x-coordinate value.
   * @param {number} maxX Maximum x-coordinate value.
   * @param {number} minY Minimum y-coordinate value.
   * @param {number} maxY Maximum y-coordinate value.
   * @return {boolean} The provided extent intersects the feature's extent.
   * @this {ol.Feature}
   */
  'extent': function(minX, maxX, minY, maxY) {
    var intersects = false;
    var geometry = this.getGeometry();
    if (geometry) {
      intersects = ol.extent.intersects(geometry.getBounds(),
          [minX, maxX, minY, maxY]);
    }
    return intersects;
  },


  /**
   * Determine if a feature's default geometry is of the given type.
   * @param {ol.geom.GeometryType} type Geometry type.
   * @return {boolean} The feature's default geometry is of the given type.
   * @this {ol.Feature}
   */
  'geometryType': function(type) {
    var same = false;
    var geometry = this.getGeometry();
    if (geometry) {
      same = geometry.getType() === type;
    }
    return same;
  }

};
