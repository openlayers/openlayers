goog.provide('ol.expr');
goog.provide('ol.expr.functions');

goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.expr.Call');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Parser');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');


/**
 * Evaluate an expression with a feature.  The feature attributes will be used
 * as the evaluation scope.  The `ol.expr.lib` functions will be used as
 * function scope.  The feature itself will be used as the `this` argument.
 *
 * @param {ol.expr.Expression} expr The expression.
 * @param {ol.Feature=} opt_feature The feature.
 * @return {*} The result of the expression.
 */
ol.expr.evaluateFeature = function(expr, opt_feature) {
  var result;
  if (goog.isDef(opt_feature)) {
    result = expr.evaluate(
        opt_feature.getAttributes(), ol.expr.lib, opt_feature);
  } else {
    result = expr.evaluate();
  }
  return result;
};


/**
 * Parse an expression.
 * @param {string} source The expression source (e.g. `'foo + 2'`).
 * @return {ol.expr.Expression} An expression instance that can be
 *     evaluated within some scope to provide a value.
 */
ol.expr.parse = function(source) {
  var parser = new ol.expr.Parser();
  return parser.parse(source);
};


/**
 * Register a library function to be used in expressions.
 * @param {string} name The function name (e.g. 'myFunc').
 * @param {function(this:ol.Feature)} func The function to be called in an
 *     expression.  This function will be called with a feature as the `this`
 *     argument when the expression is evaluated in the context of a features.
 */
ol.expr.register = function(name, func) {
  ol.expr.lib[name] = func;
};


/**
 * Determines whether an expression is a call expression that calls one of the
 * `ol.expr.lib` functions.
 *
 * @param {ol.expr.Expression} expr The candidate expression.
 * @return {string|undefined} If the candidate expression is a call to a lib
 * function, the return will be the function name.  If not, the return will be
 * `undefined`.
 */
ol.expr.isLibCall = function(expr) {
  var name;
  if (expr instanceof ol.expr.Call) {
    var callee = expr.getCallee();
    if (callee instanceof ol.expr.Identifier) {
      name = callee.getName();
      if (!ol.expr.lib.hasOwnProperty(name)) {
        name = undefined;
      }
    }
  }
  return name;
};


/**
 * Library of well-known functions.  These are available to expressions parsed
 * with `ol.expr.parse`.
 *
 * @type {Object.<string, function(...)>}
 */
ol.expr.lib = {};


/**
 * Enumeration of library function names.
 *
 * @enum {string}
 */
ol.expr.functions = {
  EXTENT: 'extent',
  FID: 'fid',
  GEOMETRY_TYPE: 'geometryType'
};


/**
 * Determine if a feature's extent intersects the provided extent.
 * @param {number} minX Minimum x-coordinate value.
 * @param {number} maxX Maximum x-coordinate value.
 * @param {number} minY Minimum y-coordinate value.
 * @param {number} maxY Maximum y-coordinate value.
 * @return {boolean} The provided extent intersects the feature's extent.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.EXTENT] = function(minX, maxX, minY, maxY) {
  var intersects = false;
  var geometry = this.getGeometry();
  if (geometry) {
    intersects = ol.extent.intersects(geometry.getBounds(),
        [minX, maxX, minY, maxY]);
  }
  return intersects;
};


/**
 * Determine if the feature identifier matches any of the provided values.
 * @param {...string} var_args Feature identifiers.
 * @return {boolean} The feature's identifier matches one of the given values.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.FID] = function(var_args) {
  var matches = false;
  var id = this.getFeatureId();
  if (goog.isDef(id)) {
    for (var i = 0, ii = arguments.length; i < ii; ++i) {
      if (arguments[i] === id) {
        matches = true;
        break;
      }
    }
  }
  return matches;
};


/**
 * Determine if a feature's default geometry is of the given type.
 * @param {ol.geom.GeometryType} type Geometry type.
 * @return {boolean} The feature's default geometry is of the given type.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.GEOMETRY_TYPE] = function(type) {
  var same = false;
  var geometry = this.getGeometry();
  if (geometry) {
    same = geometry.getType() === type;
  }
  return same;
};
