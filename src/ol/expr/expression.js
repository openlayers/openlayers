/**
 * @module ol/expr/expression
 */
import {ascending} from '../array.js';
import {fromString as colorFromString} from '../color.js';
import {toSize} from '../size.js';

/**
 * @fileoverview This module includes types and functions for parsing array encoded expressions.
 * The result of parsing an encoded expression is one of the specific expression classes.
 * During parsing, information is added to the parsing context about the data accessed by the
 * expression.
 */

/**
 * Base type used for literal style parameters; can be a number literal or the output of an operator,
 * which in turns takes {@link import("./expression.js").ExpressionValue} arguments.
 *
 * See below for details on the available operators (with notes for those that are WebGL or Canvas only).
 *
 * Reading operators:
 *   `['band', bandIndex, xOffset, yOffset]` For tile layers only. Fetches pixel values from band
 *     `bandIndex` of the source's data. The first `bandIndex` of the source data is `1`. Fetched values
 *     are in the 0..1 range. {@link import("../source/TileImage.js").default} sources have 4 bands: red,
 *     green, blue and alpha. {@link import("../source/DataTile.js").default} sources can have any number
 *     of bands, depending on the underlying data source and
 *     {@link import("../source/GeoTIFF.js").Options configuration}. `xOffset` and `yOffset` are optional
 *     and allow specifying pixel offsets for x and y. This is used for sampling data from neighboring pixels (WebGL only).
 *   `['get', attributeName]` fetches a feature property value, similar to `feature.get('attributeName')`.
 *   `['get', attributeName, keyOrArrayIndex, ...]` (Canvas only) Access nested properties and array items of a
 *     feature property. The result is `undefined` when there is nothing at the specified key or index.
 *   `['geometry-type']` returns a feature's geometry type as string, either: 'LineString', 'Point' or 'Polygon'
 *     `Multi*` values are returned as their singular equivalent
 *     `Circle` geometries are returned as 'Polygon'
 *     `GeometryCollection` geometries are returned as the type of the first geometry found in the collection (WebGL only).
 *   `['resolution']` returns the current resolution
 *   `['time']` The time in seconds since the creation of the layer (WebGL only).
 *   `['var', 'varName']` fetches a value from the style variables; will throw an error if that variable is undefined
 *   `['zoom']` The current zoom level (WebGL only).
 *   `['line-metric']` returns the M component of the current point on a line (WebGL only); in case where the geometry layout of the line
 *      does not contain an M component (e.g. XY or XYZ), 0 is returned; 0 is also returned for geometries other than lines.
 *      Please note that the M component will be linearly interpolated between the two points composing a segment.
 *
 * Math operators:
 *   `['*', value1, value2, ...]` multiplies the values (either numbers or colors)
 *   `['/', value1, value2]` divides `value1` by `value2`
 *   `['+', value1, value2, ...]` adds the values
 *   `['-', value1, value2]` subtracts `value2` from `value1`
 *   `['clamp', value, low, high]` clamps `value` between `low` and `high`
 *   `['%', value1, value2]` returns the result of `value1 % value2` (modulo)
 *   `['^', value1, value2]` returns the value of `value1` raised to the `value2` power
 *   `['abs', value1]` returns the absolute value of `value1`
 *   `['floor', value1]` returns the nearest integer less than or equal to `value1`
 *   * `['round', value1]` returns the nearest integer to `value1`
 *   * `['ceil', value1]` returns the nearest integer greater than or equal to `value1`
 *   * `['sin', value1]` returns the sine of `value1`
 *   * `['cos', value1]` returns the cosine of `value1`
 *   * `['atan', value1, value2]` returns `atan2(value1, value2)`. If `value2` is not provided, returns `atan(value1)`
 *   * `['sqrt', value1]` returns the square root of `value1`
 *
 * * Transform operators:
 *   * `['case', condition1, output1, ...conditionN, outputN, fallback]` selects the first output whose corresponding
 *     condition evaluates to `true`. If no match is found, returns the `fallback` value.
 *     All conditions should be `boolean`, output and fallback can be any kind.
 *   * `['match', input, match1, output1, ...matchN, outputN, fallback]` compares the `input` value against all
 *     provided `matchX` values, returning the output associated with the first valid match. If no match is found,
 *     returns the `fallback` value.
 *     `input` and `matchX` values must all be of the same type, and can be `number` or `string`. `outputX` and
 *     `fallback` values must be of the same type, and can be of any kind.
 *   * `['interpolate', interpolation, input, stop1, output1, ...stopN, outputN]` returns a value by interpolating between
 *     pairs of inputs and outputs; `interpolation` can either be `['linear']` or `['exponential', base]` where `base` is
 *     the rate of increase from stop A to stop B (i.e. power to which the interpolation ratio is raised); a value
 *     of 1 is equivalent to `['linear']`.
 *     `input` and `stopX` values must all be of type `number`. `outputX` values can be `number` or `color` values.
 *     Note: `input` will be clamped between `stop1` and `stopN`, meaning that all output values will be comprised
 *     between `output1` and `outputN`.
 *   * `['string', value1, value2, ...]` returns the first value in the list that evaluates to a string.
 *     An example would be to provide a default value for get: `['string', ['get', 'propertyname'], 'default value']]`
 *     (Canvas only).
 *   * `['number', value1, value2, ...]` returns the first value in the list that evaluates to a number.
 *     An example would be to provide a default value for get: `['string', ['get', 'propertyname'], 42]]`
 *     (Canvas only).
 *   * `['coalesce', value1, value2, ...]` returns the first value in the list which is not null or undefined.
 *     An example would be to provide a default value for get: `['coalesce', ['get','propertyname'], 'default value']]`
 *     (Canvas only).
 *
 * * Logical operators:
 *   * `['<', value1, value2]` returns `true` if `value1` is strictly lower than `value2`, or `false` otherwise.
 *   * `['<=', value1, value2]` returns `true` if `value1` is lower than or equals `value2`, or `false` otherwise.
 *   * `['>', value1, value2]` returns `true` if `value1` is strictly greater than `value2`, or `false` otherwise.
 *   * `['>=', value1, value2]` returns `true` if `value1` is greater than or equals `value2`, or `false` otherwise.
 *   * `['==', value1, value2]` returns `true` if `value1` equals `value2`, or `false` otherwise.
 *   * `['!=', value1, value2]` returns `true` if `value1` does not equal `value2`, or `false` otherwise.
 *   * `['!', value1]` returns `false` if `value1` is `true` or greater than `0`, or `true` otherwise.
 *   * `['all', value1, value2, ...]` returns `true` if all the inputs are `true`, `false` otherwise.
 *   * `['any', value1, value2, ...]` returns `true` if any of the inputs are `true`, `false` otherwise.
 *   * `['has', attributeName, keyOrArrayIndex, ...]` returns `true` if feature properties include the (nested) key `attributeName`,
 *     `false` otherwise.
 *   * `['between', value1, value2, value3]` returns `true` if `value1` is contained between `value2` and `value3`
 *     (inclusively), or `false` otherwise.
 *   * `['in', needle, haystack]` returns `true` if `needle` is found in `haystack`, and
 *     `false` otherwise.
 *     This operator has the following limitations:
 *     * `haystack` has to be an array of numbers or strings (searching for a substring in a string is not supported yet)
 *     * Only literal arrays are supported as `haystack` for now; this means that `haystack` cannot be the result of an
 *     expression. If `haystack` is an array of strings, use the `literal` operator to disambiguate from an expression:
 *     `['literal', ['abc', 'def', 'ghi']]`
 *
 * * Conversion operators:
 *   * `['array', value1, ...valueN]` creates a numerical array from `number` values; please note that the amount of
 *     values can currently only be 2, 3 or 4 (WebGL only).
 *   * `['color', red, green, blue, alpha]` or `['color', shade, alpha]` creates a `color` value from `number` values;
 *     the `alpha` parameter is optional; if not specified, it will be set to 1 (WebGL only).
 *     Note: `red`, `green` and `blue` or `shade` components must be values between 0 and 255; `alpha` between 0 and 1.
 *   * `['palette', index, colors]` picks a `color` value from an array of colors using the given index; the `index`
 *     expression must evaluate to a number; the items in the `colors` array must be strings with hex colors
 *     (e.g. `'#86A136'`), colors using the rgba[a] functional notation (e.g. `'rgb(134, 161, 54)'` or `'rgba(134, 161, 54, 1)'`),
 *     named colors (e.g. `'red'`), or array literals with 3 ([r, g, b]) or 4 ([r, g, b, a]) values (with r, g, and b
 *     in the 0-255 range and a in the 0-1 range) (WebGL only).
 *   * `['to-string', value]` converts the input value to a string. If the input is a boolean, the result is "true" or "false".
 *     If the input is a number, it is converted to a string as specified by the "NumberToString" algorithm of the ECMAScript
 *     Language Specification. If the input is a color, it is converted to a string of the form "rgba(r,g,b,a)". (Canvas only)
 *
 * Values can either be literals or another operator, as they will be evaluated recursively.
 * Literal values can be of the following types:
 * * `boolean`
 * * `number`
 * * `number[]` (number arrays can only have a length of 2, 3 or 4)
 * * `string`
 * * {@link module:ol/color~Color}
 *
 * @typedef {Array<*>|import("../color.js").Color|string|number|boolean} ExpressionValue
 * @api
 */

let numTypes = 0;
export const NoneType = 0;
export const BooleanType = 1 << numTypes++;
export const NumberType = 1 << numTypes++;
export const StringType = 1 << numTypes++;
export const ColorType = 1 << numTypes++;
export const NumberArrayType = 1 << numTypes++;
export const SizeType = 1 << numTypes++;
export const AnyType = Math.pow(2, numTypes) - 1;

const typeNames = {
  [BooleanType]: 'boolean',
  [NumberType]: 'number',
  [StringType]: 'string',
  [ColorType]: 'color',
  [NumberArrayType]: 'number[]',
  [SizeType]: 'size',
};

const namedTypes = Object.keys(typeNames).map(Number).sort(ascending);

/**
 * @param {number} type The type.
 * @return {boolean} The type is one of the specific types (not any or a union type).
 */
function isSpecific(type) {
  return type in typeNames;
}

/**
 * Get a string representation for a type.
 * @param {number} type The type.
 * @return {string} The type name.
 */
export function typeName(type) {
  const names = [];
  for (const namedType of namedTypes) {
    if (includesType(type, namedType)) {
      names.push(typeNames[namedType]);
    }
  }
  if (names.length === 0) {
    return 'untyped';
  }
  if (names.length < 3) {
    return names.join(' or ');
  }
  return names.slice(0, -1).join(', ') + ', or ' + names[names.length - 1];
}

/**
 * @param {number} broad The broad type.
 * @param {number} specific The specific type.
 * @return {boolean} The broad type includes the specific type.
 */
export function includesType(broad, specific) {
  return (broad & specific) === specific;
}

/**
 * @param {number} oneType One type.
 * @param {number} otherType Another type.
 * @return {boolean} The set of types overlap (share a common specific type)
 */
export function overlapsType(oneType, otherType) {
  return !!(oneType & otherType);
}

/**
 * @param {number} type The type.
 * @param {number} expected The expected type.
 * @return {boolean} The given type is exactly the expected type.
 */
export function isType(type, expected) {
  return type === expected;
}

/**
 * @typedef {boolean|number|string|Array<number>} LiteralValue
 */

export class LiteralExpression {
  /**
   * @param {number} type The value type.
   * @param {LiteralValue} value The literal value.
   */
  constructor(type, value) {
    if (!isSpecific(type)) {
      throw new Error(
        `literal expressions must have a specific type, got ${typeName(type)}`,
      );
    }
    this.type = type;
    this.value = value;
  }
}

export class CallExpression {
  /**
   * @param {number} type The return type.
   * @param {string} operator The operator.
   * @param {...Expression} args The arguments.
   */
  constructor(type, operator, ...args) {
    this.type = type;
    this.operator = operator;
    this.args = args;
  }
}

/**
 * @typedef {LiteralExpression|CallExpression} Expression
 */

/**
 * @typedef {Object} ParsingContext
 * @property {Set<string>} variables Variables referenced with the 'var' operator.
 * @property {Set<string>} properties Properties referenced with the 'get' operator.
 * @property {boolean} featureId The style uses the feature id.
 * @property {boolean} geometryType The style uses the feature geometry type.
 * @property {boolean} mapState The style uses the map state (view state or time elapsed).
 */

/**
 * @return {ParsingContext} A new parsing context.
 */
export function newParsingContext() {
  return {
    variables: new Set(),
    properties: new Set(),
    featureId: false,
    geometryType: false,
    mapState: false,
  };
}

/**
 * @typedef {LiteralValue|Array} EncodedExpression
 */

/**
 * @param {EncodedExpression} encoded The encoded expression.
 * @param {number} expectedType The expected type.
 * @param {ParsingContext} context The parsing context.
 * @return {Expression} The parsed expression result.
 */
export function parse(encoded, expectedType, context) {
  switch (typeof encoded) {
    case 'boolean': {
      if (isType(expectedType, StringType)) {
        return new LiteralExpression(StringType, encoded ? 'true' : 'false');
      }
      if (!includesType(expectedType, BooleanType)) {
        throw new Error(
          `got a boolean, but expected ${typeName(expectedType)}`,
        );
      }
      return new LiteralExpression(BooleanType, encoded);
    }
    case 'number': {
      if (isType(expectedType, SizeType)) {
        return new LiteralExpression(SizeType, toSize(encoded));
      }
      if (isType(expectedType, BooleanType)) {
        return new LiteralExpression(BooleanType, !!encoded);
      }
      if (isType(expectedType, StringType)) {
        return new LiteralExpression(StringType, encoded.toString());
      }
      if (!includesType(expectedType, NumberType)) {
        throw new Error(`got a number, but expected ${typeName(expectedType)}`);
      }
      return new LiteralExpression(NumberType, encoded);
    }
    case 'string': {
      if (isType(expectedType, ColorType)) {
        return new LiteralExpression(ColorType, colorFromString(encoded));
      }
      if (isType(expectedType, BooleanType)) {
        return new LiteralExpression(BooleanType, !!encoded);
      }
      if (!includesType(expectedType, StringType)) {
        throw new Error(`got a string, but expected ${typeName(expectedType)}`);
      }
      return new LiteralExpression(StringType, encoded);
    }
    default: {
      // pass
    }
  }

  if (!Array.isArray(encoded)) {
    throw new Error('expression must be an array or a primitive value');
  }

  if (encoded.length === 0) {
    throw new Error('empty expression');
  }

  if (typeof encoded[0] === 'string') {
    return parseCallExpression(encoded, expectedType, context);
  }

  for (const item of encoded) {
    if (typeof item !== 'number') {
      throw new Error('expected an array of numbers');
    }
  }

  if (isType(expectedType, SizeType)) {
    if (encoded.length !== 2) {
      throw new Error(
        `expected an array of two values for a size, got ${encoded.length}`,
      );
    }
    return new LiteralExpression(SizeType, encoded);
  }

  if (isType(expectedType, ColorType)) {
    if (encoded.length === 3) {
      return new LiteralExpression(ColorType, [...encoded, 1]);
    }
    if (encoded.length === 4) {
      return new LiteralExpression(ColorType, encoded);
    }
    throw new Error(
      `expected an array of 3 or 4 values for a color, got ${encoded.length}`,
    );
  }

  if (!includesType(expectedType, NumberArrayType)) {
    throw new Error(
      `got an array of numbers, but expected ${typeName(expectedType)}`,
    );
  }

  return new LiteralExpression(NumberArrayType, encoded);
}

/**
 * @type {Object<string, string>}
 */
export const Ops = {
  Get: 'get',
  Var: 'var',
  Concat: 'concat',
  GeometryType: 'geometry-type',
  LineMetric: 'line-metric',
  Any: 'any',
  All: 'all',
  Not: '!',
  Resolution: 'resolution',
  Zoom: 'zoom',
  Time: 'time',
  Equal: '==',
  NotEqual: '!=',
  GreaterThan: '>',
  GreaterThanOrEqualTo: '>=',
  LessThan: '<',
  LessThanOrEqualTo: '<=',
  Multiply: '*',
  Divide: '/',
  Add: '+',
  Subtract: '-',
  Clamp: 'clamp',
  Mod: '%',
  Pow: '^',
  Abs: 'abs',
  Floor: 'floor',
  Ceil: 'ceil',
  Round: 'round',
  Sin: 'sin',
  Cos: 'cos',
  Atan: 'atan',
  Sqrt: 'sqrt',
  Match: 'match',
  Between: 'between',
  Interpolate: 'interpolate',
  Coalesce: 'coalesce',
  Case: 'case',
  In: 'in',
  Number: 'number',
  String: 'string',
  Array: 'array',
  Color: 'color',
  Id: 'id',
  Band: 'band',
  Palette: 'palette',
  ToString: 'to-string',
  Has: 'has',
};

/**
 * @typedef {function(Array, number, ParsingContext):Expression} Parser
 *
 * Second argument is the expected type.
 */

/**
 * @type {Object<string, Parser>}
 */
const parsers = {
  [Ops.Get]: createCallExpressionParser(hasArgsCount(1, Infinity), withGetArgs),
  [Ops.Var]: createCallExpressionParser(hasArgsCount(1, 1), withVarArgs),
  [Ops.Has]: createCallExpressionParser(hasArgsCount(1, Infinity), withGetArgs),
  [Ops.Id]: createCallExpressionParser(usesFeatureId, withNoArgs),
  [Ops.Concat]: createCallExpressionParser(
    hasArgsCount(2, Infinity),
    withArgsOfType(StringType),
  ),
  [Ops.GeometryType]: createCallExpressionParser(usesGeometryType, withNoArgs),
  [Ops.LineMetric]: createCallExpressionParser(withNoArgs),
  [Ops.Resolution]: createCallExpressionParser(usesMapState, withNoArgs),
  [Ops.Zoom]: createCallExpressionParser(usesMapState, withNoArgs),
  [Ops.Time]: createCallExpressionParser(usesMapState, withNoArgs),
  [Ops.Any]: createCallExpressionParser(
    hasArgsCount(2, Infinity),
    withArgsOfType(BooleanType),
  ),
  [Ops.All]: createCallExpressionParser(
    hasArgsCount(2, Infinity),
    withArgsOfType(BooleanType),
  ),
  [Ops.Not]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(BooleanType),
  ),
  [Ops.Equal]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(AnyType),
  ),
  [Ops.NotEqual]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(AnyType),
  ),
  [Ops.GreaterThan]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.GreaterThanOrEqualTo]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.LessThan]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.LessThanOrEqualTo]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.Multiply]: createCallExpressionParser(
    hasArgsCount(2, Infinity),
    withArgsOfReturnType,
  ),
  [Ops.Coalesce]: createCallExpressionParser(
    hasArgsCount(2, Infinity),
    withArgsOfReturnType,
  ),
  [Ops.Divide]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.Add]: createCallExpressionParser(
    hasArgsCount(2, Infinity),
    withArgsOfType(NumberType),
  ),
  [Ops.Subtract]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.Clamp]: createCallExpressionParser(
    hasArgsCount(3, 3),
    withArgsOfType(NumberType),
  ),
  [Ops.Mod]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.Pow]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.Abs]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Floor]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Ceil]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Round]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Sin]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Cos]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Atan]: createCallExpressionParser(
    hasArgsCount(1, 2),
    withArgsOfType(NumberType),
  ),
  [Ops.Sqrt]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(NumberType),
  ),
  [Ops.Match]: createCallExpressionParser(
    hasArgsCount(4, Infinity),
    hasEvenArgs,
    withMatchArgs,
  ),
  [Ops.Between]: createCallExpressionParser(
    hasArgsCount(3, 3),
    withArgsOfType(NumberType),
  ),
  [Ops.Interpolate]: createCallExpressionParser(
    hasArgsCount(6, Infinity),
    hasEvenArgs,
    withInterpolateArgs,
  ),
  [Ops.Case]: createCallExpressionParser(
    hasArgsCount(3, Infinity),
    hasOddArgs,
    withCaseArgs,
  ),
  [Ops.In]: createCallExpressionParser(hasArgsCount(2, 2), withInArgs),
  [Ops.Number]: createCallExpressionParser(
    hasArgsCount(1, Infinity),
    withArgsOfType(AnyType),
  ),
  [Ops.String]: createCallExpressionParser(
    hasArgsCount(1, Infinity),
    withArgsOfType(AnyType),
  ),
  [Ops.Array]: createCallExpressionParser(
    hasArgsCount(1, Infinity),
    withArgsOfType(NumberType),
  ),
  [Ops.Color]: createCallExpressionParser(
    hasArgsCount(1, 4),
    withArgsOfType(NumberType),
  ),
  [Ops.Band]: createCallExpressionParser(
    hasArgsCount(1, 3),
    withArgsOfType(NumberType),
  ),
  [Ops.Palette]: createCallExpressionParser(
    hasArgsCount(2, 2),
    withPaletteArgs,
  ),
  [Ops.ToString]: createCallExpressionParser(
    hasArgsCount(1, 1),
    withArgsOfType(BooleanType | NumberType | StringType | ColorType),
  ),
};

/**
 * @typedef {function(Array<EncodedExpression>, number, ParsingContext):Array<Expression>|void} ArgValidator
 *
 * An argument validator applies various checks to an encoded expression arguments and
 * returns the parsed arguments if any.  The second argument is the return type of the call expression.
 */

/**
 * @type {ArgValidator}
 */
function withGetArgs(encoded, returnType, context) {
  const argsCount = encoded.length - 1;
  const args = new Array(argsCount);
  for (let i = 0; i < argsCount; ++i) {
    const key = encoded[i + 1];
    switch (typeof key) {
      case 'number': {
        args[i] = new LiteralExpression(NumberType, key);
        break;
      }
      case 'string': {
        args[i] = new LiteralExpression(StringType, key);
        break;
      }
      default: {
        throw new Error(
          `expected a string key or numeric array index for a get operation, got ${key}`,
        );
      }
    }
    if (i === 0) {
      context.properties.add(String(key));
    }
  }
  return args;
}

/**
 * @type {ArgValidator}
 */
function withVarArgs(encoded, returnType, context) {
  const name = encoded[1];
  if (typeof name !== 'string') {
    throw new Error('expected a string argument for var operation');
  }
  context.variables.add(name);

  return [new LiteralExpression(StringType, name)];
}

/**
 * @type {ArgValidator}
 */
function usesFeatureId(encoded, returnType, context) {
  context.featureId = true;
}

/**
 * @type {ArgValidator}
 */
function usesGeometryType(encoded, returnType, context) {
  context.geometryType = true;
}

/**
 * @type {ArgValidator}
 */
function usesMapState(encoded, returnType, context) {
  context.mapState = true;
}

/**
 * @type {ArgValidator}
 */
function withNoArgs(encoded, returnType, context) {
  const operation = encoded[0];
  if (encoded.length !== 1) {
    throw new Error(`expected no arguments for ${operation} operation`);
  }
  return [];
}

/**
 * @param {number} minArgs The minimum number of arguments.
 * @param {number} maxArgs The maximum number of arguments.
 * @return {ArgValidator} The argument validator
 */
function hasArgsCount(minArgs, maxArgs) {
  return function (encoded, returnType, context) {
    const operation = encoded[0];
    const argCount = encoded.length - 1;
    if (minArgs === maxArgs) {
      if (argCount !== minArgs) {
        const plural = minArgs === 1 ? '' : 's';
        throw new Error(
          `expected ${minArgs} argument${plural} for ${operation}, got ${argCount}`,
        );
      }
    } else if (argCount < minArgs || argCount > maxArgs) {
      const range =
        maxArgs === Infinity
          ? `${minArgs} or more`
          : `${minArgs} to ${maxArgs}`;
      throw new Error(
        `expected ${range} arguments for ${operation}, got ${argCount}`,
      );
    }
  };
}

/**
 * @type {ArgValidator}
 */
function withArgsOfReturnType(encoded, returnType, context) {
  const argCount = encoded.length - 1;
  /**
   * @type {Array<Expression>}
   */
  const args = new Array(argCount);
  for (let i = 0; i < argCount; ++i) {
    const expression = parse(encoded[i + 1], returnType, context);
    args[i] = expression;
  }
  return args;
}

/**
 * @param {number} argType The argument type.
 * @return {ArgValidator} The argument validator
 */
function withArgsOfType(argType) {
  return function (encoded, returnType, context) {
    const argCount = encoded.length - 1;
    /**
     * @type {Array<Expression>}
     */
    const args = new Array(argCount);
    for (let i = 0; i < argCount; ++i) {
      const expression = parse(encoded[i + 1], argType, context);
      args[i] = expression;
    }
    return args;
  };
}

/**
 * @type {ArgValidator}
 */
function hasOddArgs(encoded, returnType, context) {
  const operation = encoded[0];
  const argCount = encoded.length - 1;
  if (argCount % 2 === 0) {
    throw new Error(
      `expected an odd number of arguments for ${operation}, got ${argCount} instead`,
    );
  }
}

/**
 * @type {ArgValidator}
 */
function hasEvenArgs(encoded, returnType, context) {
  const operation = encoded[0];
  const argCount = encoded.length - 1;
  if (argCount % 2 === 1) {
    throw new Error(
      `expected an even number of arguments for operation ${operation}, got ${argCount} instead`,
    );
  }
}

/**
 * @type {ArgValidator}
 */
function withMatchArgs(encoded, returnType, context) {
  const argsCount = encoded.length - 1;

  const inputType = StringType | NumberType | BooleanType;

  const input = parse(encoded[1], inputType, context);

  const fallback = parse(encoded[encoded.length - 1], returnType, context);

  const args = new Array(argsCount - 2);
  for (let i = 0; i < argsCount - 2; i += 2) {
    try {
      const match = parse(encoded[i + 2], input.type, context);
      args[i] = match;
    } catch (err) {
      throw new Error(
        `failed to parse argument ${i + 1} of match expression: ${err.message}`,
      );
    }
    try {
      const output = parse(encoded[i + 3], fallback.type, context);
      args[i + 1] = output;
    } catch (err) {
      throw new Error(
        `failed to parse argument ${i + 2} of match expression: ${err.message}`,
      );
    }
  }

  return [input, ...args, fallback];
}

/**
 * @type {ArgValidator}
 */
function withInterpolateArgs(encoded, returnType, context) {
  const interpolationType = encoded[1];
  /**
   * @type {number}
   */
  let base;
  switch (interpolationType[0]) {
    case 'linear':
      base = 1;
      break;
    case 'exponential':
      const b = interpolationType[1];
      if (typeof b !== 'number' || b <= 0) {
        throw new Error(
          `expected a number base for exponential interpolation` +
            `, got ${JSON.stringify(b)} instead`,
        );
      }
      base = b;
      break;
    default:
      throw new Error(
        `invalid interpolation type: ${JSON.stringify(interpolationType)}`,
      );
  }

  const interpolation = new LiteralExpression(NumberType, base);

  let input;
  try {
    input = parse(encoded[2], NumberType, context);
  } catch (err) {
    throw new Error(
      `failed to parse argument 1 in interpolate expression: ${err.message}`,
    );
  }

  const args = new Array(encoded.length - 3);
  for (let i = 0; i < args.length; i += 2) {
    try {
      const stop = parse(encoded[i + 3], NumberType, context);
      args[i] = stop;
    } catch (err) {
      throw new Error(
        `failed to parse argument ${i + 2} for interpolate expression: ${err.message}`,
      );
    }
    try {
      const output = parse(encoded[i + 4], returnType, context);
      args[i + 1] = output;
    } catch (err) {
      throw new Error(
        `failed to parse argument ${i + 3} for interpolate expression: ${err.message}`,
      );
    }
  }

  return [interpolation, input, ...args];
}

/**
 * @type {ArgValidator}
 */
function withCaseArgs(encoded, returnType, context) {
  const fallback = parse(encoded[encoded.length - 1], returnType, context);

  const args = new Array(encoded.length - 1);
  for (let i = 0; i < args.length - 1; i += 2) {
    try {
      const condition = parse(encoded[i + 1], BooleanType, context);
      args[i] = condition;
    } catch (err) {
      throw new Error(
        `failed to parse argument ${i} of case expression: ${err.message}`,
      );
    }
    try {
      const output = parse(encoded[i + 2], fallback.type, context);
      args[i + 1] = output;
    } catch (err) {
      throw new Error(
        `failed to parse argument ${i + 1} of case expression: ${err.message}`,
      );
    }
  }

  args[args.length - 1] = fallback;
  return args;
}

/**
 * @type {ArgValidator}
 */
function withInArgs(encoded, returnType, context) {
  let haystack = encoded[2];
  if (!Array.isArray(haystack)) {
    throw new Error(
      `the second argument for the "in" operator must be an array`,
    );
  }
  /**
   * @type {number}
   */
  let needleType;
  if (typeof haystack[0] === 'string') {
    if (haystack[0] !== 'literal') {
      throw new Error(
        `for the "in" operator, a string array should be wrapped in a "literal" operator to disambiguate from expressions`,
      );
    }
    if (!Array.isArray(haystack[1])) {
      throw new Error(
        `failed to parse "in" expression: the literal operator must be followed by an array`,
      );
    }
    haystack = haystack[1];
    needleType = StringType;
  } else {
    needleType = NumberType;
  }

  const args = new Array(haystack.length);
  for (let i = 0; i < args.length; i++) {
    try {
      const arg = parse(haystack[i], needleType, context);
      args[i] = arg;
    } catch (err) {
      throw new Error(
        `failed to parse haystack item ${i} for "in" expression: ${err.message}`,
      );
    }
  }

  const needle = parse(encoded[1], needleType, context);
  return [needle, ...args];
}

/**
 * @type {ArgValidator}
 */
function withPaletteArgs(encoded, returnType, context) {
  let index;
  try {
    index = parse(encoded[1], NumberType, context);
  } catch (err) {
    throw new Error(
      `failed to parse first argument in palette expression: ${err.message}`,
    );
  }
  const colors = encoded[2];
  if (!Array.isArray(colors)) {
    throw new Error('the second argument of palette must be an array');
  }
  const parsedColors = new Array(colors.length);
  for (let i = 0; i < parsedColors.length; i++) {
    let color;
    try {
      color = parse(colors[i], ColorType, context);
    } catch (err) {
      throw new Error(
        `failed to parse color at index ${i} in palette expression: ${err.message}`,
      );
    }
    if (!(color instanceof LiteralExpression)) {
      throw new Error(
        `the palette color at index ${i} must be a literal value`,
      );
    }
    parsedColors[i] = color;
  }
  return [index, ...parsedColors];
}

/**
 * @param {Array<ArgValidator>} validators A chain of argument validators.  The last validator is expected
 * to return the parsed arguments.
 * @return {Parser} The parser.
 */
function createCallExpressionParser(...validators) {
  return function (encoded, returnType, context) {
    const operator = encoded[0];

    /**
     * @type {Array<Expression>}
     */
    let args;
    for (let i = 0; i < validators.length; i++) {
      const parsed = validators[i](encoded, returnType, context);
      if (i == validators.length - 1) {
        if (!parsed) {
          throw new Error(
            'expected last argument validator to return the parsed args',
          );
        }
        args = parsed;
      }
    }
    return new CallExpression(returnType, operator, ...args);
  };
}

/**
 * @param {Array} encoded The encoded expression.
 * @param {number} returnType The expected return type of the call expression.
 * @param {ParsingContext} context The parsing context.
 * @return {Expression} The parsed expression.
 */
function parseCallExpression(encoded, returnType, context) {
  const operator = encoded[0];

  const parser = parsers[operator];
  if (!parser) {
    throw new Error(`unknown operator: ${operator}`);
  }
  return parser(encoded, returnType, context);
}

/**
 * Returns a simplified geometry type suited for the `geometry-type` operator
 * @param {import('../geom/Geometry.js').default|import('../render/Feature.js').default} geometry Geometry object
 * @return {'Point'|'LineString'|'Polygon'|''} Simplified geometry type; empty string of no geometry found
 */
export function computeGeometryType(geometry) {
  if (!geometry) {
    return '';
  }
  const type = geometry.getType();
  switch (type) {
    case 'Point':
    case 'LineString':
    case 'Polygon':
      return type;
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
      return /** @type {'Point'|'LineString'|'Polygon'} */ (type.substring(5));
    case 'Circle':
      return 'Polygon';
    case 'GeometryCollection':
      return computeGeometryType(
        /** @type {import("../geom/GeometryCollection.js").default} */ (
          geometry
        ).getGeometries()[0],
      );
    default:
      return '';
  }
}
