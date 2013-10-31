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
  var scope;
  if (goog.isDef(opt_feature)) {
    scope = opt_feature.getAttributes();
  }
  return expr.evaluate(scope, ol.expr.lib, opt_feature);
};


/**
 * Parse an expression.
 * @param {string} source The expression source (e.g. `'foo + 2'`).
 * @return {ol.expr.Expression} An expression instance that can be
 *     evaluated within some scope to provide a value.
 * @todo stability experimental
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
 * @todo stability experimental
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
  CONCAT: 'concat',
  COUNTER: 'counter',
  EXTENT: 'extent',
  FID: 'fid',
  GEOMETRY_TYPE: 'geometryType',
  RENDER_INTENT: 'renderIntent',
  INTERSECTS: 'intersects',
  CONTAINS: 'contains',
  DWITHIN: 'dwithin',
  WITHIN: 'within',
  LIKE: 'like',
  IEQ: 'ieq',
  INEQ: 'ineq'
};


/**
 * Concatenate strings.  All provided arguments will be cast to string and
 * concatenated.
 * @param {...string} var_args Strings to concatenate.
 * @return {string} All input arguments concatenated as strings.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.CONCAT] = function(var_args) {
  var str = '';
  for (var i = 0, ii = arguments.length; i < ii; ++i) {
    str += String(arguments[i]);
  }
  return str;
};


/**
 * Returns a counter which increases every time this function is called.
 * @param {number=} opt_start Start. If not provided, the counter starts at 1.
 * @return {number} Counter.
 */
ol.expr.lib[ol.expr.functions.COUNTER] = (function() {
  var counter = 0;
  return function(opt_start) {
    var result = ++counter;
    if (goog.isDef(opt_start)) {
      result += opt_start;
    }
    return result;
  };
})();


/**
 * Determine if a feature's extent intersects the provided extent.
 * @param {number} minX Minimum x-coordinate value.
 * @param {number} minY Minimum y-coordinate value.
 * @param {number} maxX Maximum x-coordinate value.
 * @param {number} maxY Maximum y-coordinate value.
 * @param {string=} opt_projection Projection of the extent.
 * @param {string=} opt_attribute Name of the geometry attribute to use.
 * @return {boolean} The provided extent intersects the feature's extent.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.EXTENT] = function(minX, minY, maxX, maxY,
    opt_projection, opt_attribute) {
  var intersects = false;
  var geometry = goog.isDef(opt_attribute) ?
      this.get(opt_attribute) : this.getGeometry();
  if (geometry) {
    intersects = ol.extent.intersects(geometry.getBounds(),
        [minX, minY, maxX, maxY]);
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
  var id = this.getId();
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
 * Determine if two strings are like one another, based on simple pattern
 * matching.
 * @param {string} value The string to test.
 * @param {string} pattern The comparison pattern.
 * @param {string} wildCard The wildcard character to use.
 * @param {string} singleChar The single character to use.
 * @param {string} escapeChar The escape character to use.
 * @param {boolean} matchCase Should we match case or not?
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.LIKE] = function(value, pattern, wildCard,
    singleChar, escapeChar, matchCase) {
  if (wildCard == '.') {
    throw new Error('"." is an unsupported wildCard character for ' +
        'the "like" function');
  }
  // set UMN MapServer defaults for unspecified parameters
  wildCard = goog.isDef(wildCard) ? wildCard : '*';
  singleChar = goog.isDef(singleChar) ? singleChar : '.';
  escapeChar = goog.isDef(escapeChar) ? escapeChar : '!';
  pattern = pattern.replace(
      new RegExp('\\' + escapeChar + '(.|$)', 'g'), '\\$1');
  pattern = pattern.replace(
      new RegExp('\\' + singleChar, 'g'), '.');
  pattern = pattern.replace(
      new RegExp('\\' + wildCard, 'g'), '.*');
  pattern = pattern.replace(
      new RegExp('\\\\.\\*', 'g'), '\\' + wildCard);
  pattern = pattern.replace(
      new RegExp('\\\\\\.', 'g'), '\\' + singleChar);
  var modifiers = (matchCase === false) ? 'gi' : 'g';
  return new RegExp(pattern, modifiers).test(value);
};


/**
 * Case insensitive comparison for equality.
 * @param {*} first First value.
 * @param {*} second Second value.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.IEQ] = function(first, second) {
  if (goog.isString(first) && goog.isString(second)) {
    return first.toUpperCase() == second.toUpperCase();
  } else {
    return first == second;
  }
};


/**
 * Case insensitive comparison for non-equality.
 * @param {*} first First value.
 * @param {*} second Second value.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.INEQ] = function(first, second) {
  if (goog.isString(first) && goog.isString(second)) {
    return first.toUpperCase() != second.toUpperCase();
  } else {
    return first != second;
  }
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


/**
 * Determine if a feature's renderIntent matches the given one.
 * @param {string} renderIntent Render intent.
 * @return {boolean} The feature's renderIntent matches the given one.
 * @this {ol.Feature}
 */
ol.expr.lib[ol.expr.functions.RENDER_INTENT] = function(renderIntent) {
  return this.renderIntent == renderIntent;
};


ol.expr.lib[ol.expr.functions.INTERSECTS] = function(geom, opt_projection,
    opt_attribute) {
  throw new Error('Spatial function not implemented: ' +
      ol.expr.functions.INTERSECTS);
};


ol.expr.lib[ol.expr.functions.WITHIN] = function(geom, opt_projection,
    opt_attribute) {
  throw new Error('Spatial function not implemented: ' +
      ol.expr.functions.WITHIN);
};


ol.expr.lib[ol.expr.functions.CONTAINS] = function(geom, opt_projeciton,
    opt_attribute) {
  throw new Error('Spatial function not implemented: ' +
      ol.expr.functions.CONTAINS);
};


ol.expr.lib[ol.expr.functions.DWITHIN] = function(geom, distance, units,
    opt_projection, opt_attribute) {
  throw new Error('Spatial function not implemented: ' +
      ol.expr.functions.DWITHIN);
};
