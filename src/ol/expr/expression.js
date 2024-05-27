/**
 * @module ol/expr/expression
 */
import {ascending} from '../array.js';
import {isStringColor} from '../color.js';

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
 * * Reading operators:
 *   * `['band', bandIndex, xOffset, yOffset]` For tile layers only. Fetches pixel values from band
 *     `bandIndex` of the source's data. The first `bandIndex` of the source data is `1`. Fetched values
 *     are in the 0..1 range. {@link import("../source/TileImage.js").default} sources have 4 bands: red,
 *     green, blue and alpha. {@link import("../source/DataTile.js").default} sources can have any number
 *     of bands, depending on the underlying data source and
 *     {@link import("../source/GeoTIFF.js").Options configuration}. `xOffset` and `yOffset` are optional
 *     and allow specifying pixel offsets for x and y. This is used for sampling data from neighboring pixels (WebGL only).
 *   * `['get', 'attributeName', typeHint]` fetches a feature property value, similar to `feature.get('attributeName')`
 *     A type hint can optionally be specified, in case the resulting expression contains a type ambiguity which
 *     will make it invalid. Type hints can be one of: 'string', 'color', 'number', 'boolean', 'number[]'
 *   * `['geometry-type']` returns a feature's geometry type as string, either: 'LineString', 'Point' or 'Polygon'
 *     `Multi*` values are returned as their singular equivalent
 *     `Circle` geometries are returned as 'Polygon'
 *     `GeometryCollection` geometries are returned as the type of the first geometry found in the collection (WebGL only).
 *   * `['resolution']` returns the current resolution
 *   * `['time']` The time in seconds since the creation of the layer (WebGL only).
 *   * `['var', 'varName']` fetches a value from the style variables; will throw an error if that variable is undefined
 *   * `['zoom']` The current zoom level (WebGL only).
 *
 * * Math operators:
 *   * `['*', value1, value2, ...]` multiplies the values (either numbers or colors)
 *   * `['/', value1, value2]` divides `value1` by `value2`
 *   * `['+', value1, value2, ...]` adds the values
 *   * `['-', value1, value2]` subtracts `value2` from `value1`
 *   * `['clamp', value, low, high]` clamps `value` between `low` and `high`
 *   * `['%', value1, value2]` returns the result of `value1 % value2` (modulo)
 *   * `['^', value1, value2]` returns the value of `value1` raised to the `value2` power
 *   * `['abs', value1]` returns the absolute value of `value1`
 *   * `['floor', value1]` returns the nearest integer less than or equal to `value1`
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
 * @property {import("../style/flat.js").FlatStyle|import("../style/webgl.js").WebGLStyle} style The style being parsed
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
    style: {},
  };
}

/**
 * @param {string} typeHint Type hint
 * @return {number} Resulting value type (will be a single type)
 */
function getTypeFromHint(typeHint) {
  switch (typeHint) {
    case 'string':
      return StringType;
    case 'color':
      return ColorType;
    case 'number':
      return NumberType;
    case 'boolean':
      return BooleanType;
    case 'number[]':
      return NumberArrayType;
    default:
      throw new Error(`Unrecognized type hint: ${typeHint}`);
  }
}

/**
 * @typedef {LiteralValue|Array} EncodedExpression
 */

/**
 * @param {EncodedExpression} encoded The encoded expression.
 * @param {ParsingContext} context The parsing context.
 * @param {number} [typeHint] Optional type hint
 * @return {Expression} The parsed expression result.
 */
export function parse(encoded, context, typeHint) {
  switch (typeof encoded) {
    case 'boolean': {
      return new LiteralExpression(BooleanType, encoded);
    }
    case 'number': {
      return new LiteralExpression(
        typeHint === SizeType ? SizeType : NumberType,
        encoded,
      );
    }
    case 'string': {
      let type = StringType;
      if (isStringColor(encoded)) {
        type |= ColorType;
      }
      // apply the given type hint only if it won't result in an empty type
      if (!isType(type & typeHint, NoneType)) {
        type &= typeHint;
      }
      return new LiteralExpression(type, encoded);
    }
    default: {
      // pass
    }
  }

  if (!Array.isArray(encoded)) {
    throw new Error('Expression must be an array or a primitive value');
  }

  if (encoded.length === 0) {
    throw new Error('Empty expression');
  }

  if (typeof encoded[0] === 'string') {
    return parseCallExpression(encoded, context, typeHint);
  }

  for (const item of encoded) {
    if (typeof item !== 'number') {
      throw new Error('Expected an array of numbers');
    }
  }

  let type = NumberArrayType;
  if (encoded.length === 2) {
    type |= SizeType;
  } else if (encoded.length === 3 || encoded.length === 4) {
    type |= ColorType;
  }
  if (typeHint) {
    type &= typeHint;
  }
  return new LiteralExpression(type, encoded);
}

/**
 * @type {Object<string, string>}
 */
export const Ops = {
  Get: 'get',
  Var: 'var',
  Concat: 'concat',
  GeometryType: 'geometry-type',
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
};

/**
 * @typedef {function(Array, ParsingContext, number):Expression} Parser
 * Third argument is a type hint
 */

/**
 * @type {Object<string, Parser>}
 */
const parsers = {
  [Ops.Get]: createParser(
    ([_, typeHint]) => {
      if (typeHint !== undefined) {
        return getTypeFromHint(
          /** @type {string} */ (
            /** @type {LiteralExpression} */ (typeHint).value
          ),
        );
      }
      return AnyType;
    },
    withArgsCount(1, 2),
    withGetArgs,
  ),
  [Ops.Var]: createParser(
    ([firstArg]) => firstArg.type,
    withArgsCount(1, 1),
    withVarArgs,
  ),
  [Ops.Id]: createParser(NumberType | StringType, withNoArgs, usesFeatureId),
  [Ops.Concat]: createParser(
    StringType,
    withArgsCount(2, Infinity),
    parseArgsOfType(AnyType),
  ),
  [Ops.GeometryType]: createParser(StringType, withNoArgs, usesGeometryType),
  [Ops.Resolution]: createParser(NumberType, withNoArgs),
  [Ops.Zoom]: createParser(NumberType, withNoArgs),
  [Ops.Time]: createParser(NumberType, withNoArgs),
  [Ops.Any]: createParser(
    BooleanType,
    withArgsCount(2, Infinity),
    parseArgsOfType(BooleanType),
  ),
  [Ops.All]: createParser(
    BooleanType,
    withArgsCount(2, Infinity),
    parseArgsOfType(BooleanType),
  ),
  [Ops.Not]: createParser(
    BooleanType,
    withArgsCount(1, 1),
    parseArgsOfType(BooleanType),
  ),
  [Ops.Equal]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.NotEqual]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.GreaterThan]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.GreaterThanOrEqualTo]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.LessThan]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.LessThanOrEqualTo]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.Multiply]: createParser(
    (parsedArgs) => {
      let outputType = NumberType | ColorType;
      for (let i = 0; i < parsedArgs.length; i++) {
        outputType &= parsedArgs[i].type;
      }
      return outputType;
    },
    withArgsCount(2, Infinity),
    parseArgsOfType(NumberType | ColorType),
    narrowArgsType,
  ),
  [Ops.Coalesce]: createParser(
    (parsedArgs) => {
      let type = AnyType;
      for (let i = 1; i < parsedArgs.length; i += 2) {
        type &= parsedArgs[i].type;
      }
      type &= parsedArgs[parsedArgs.length - 1].type;
      return type;
    },
    withArgsCount(2, Infinity),
    parseArgsOfType(AnyType),
    narrowArgsType,
  ),
  [Ops.Divide]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType),
  ),
  [Ops.Add]: createParser(
    NumberType,
    withArgsCount(2, Infinity),
    parseArgsOfType(NumberType),
  ),
  [Ops.Subtract]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType),
  ),
  [Ops.Clamp]: createParser(
    NumberType,
    withArgsCount(3, 3),
    parseArgsOfType(NumberType),
  ),
  [Ops.Mod]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType),
  ),
  [Ops.Pow]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType),
  ),
  [Ops.Abs]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Floor]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Ceil]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Round]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Sin]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Cos]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Atan]: createParser(
    NumberType,
    withArgsCount(1, 2),
    parseArgsOfType(NumberType),
  ),
  [Ops.Sqrt]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType),
  ),
  [Ops.Match]: createParser(
    (parsedArgs) => {
      let type = AnyType;
      for (let i = 2; i < parsedArgs.length; i += 2) {
        type &= parsedArgs[i].type;
      }
      type &= parsedArgs[parsedArgs.length - 1].type;
      return type;
    },
    withArgsCount(4, Infinity),
    withEvenArgs,
    parseMatchArgs,
  ),
  [Ops.Between]: createParser(
    BooleanType,
    withArgsCount(3, 3),
    parseArgsOfType(NumberType),
  ),
  [Ops.Interpolate]: createParser(
    (parsedArgs) => {
      let type = ColorType | NumberType;
      for (let i = 3; i < parsedArgs.length; i += 2) {
        type &= parsedArgs[i].type;
      }
      return type;
    },
    withArgsCount(6, Infinity),
    withEvenArgs,
    parseInterpolateArgs,
  ),
  [Ops.Case]: createParser(
    (parsedArgs) => {
      let type = AnyType;
      for (let i = 1; i < parsedArgs.length; i += 2) {
        type &= parsedArgs[i].type;
      }
      type &= parsedArgs[parsedArgs.length - 1].type;
      return type;
    },
    withArgsCount(3, Infinity),
    withOddArgs,
    parseCaseArgs,
  ),
  [Ops.In]: createParser(BooleanType, withArgsCount(2, 2), parseInArgs),
  [Ops.Number]: createParser(
    NumberType,
    withArgsCount(1, Infinity),
    parseArgsOfType(AnyType),
  ),
  [Ops.String]: createParser(
    StringType,
    withArgsCount(1, Infinity),
    parseArgsOfType(AnyType),
  ),
  [Ops.Array]: createParser(
    (parsedArgs) => {
      return parsedArgs.length === 2
        ? NumberArrayType | SizeType
        : parsedArgs.length === 3 || parsedArgs.length === 4
          ? NumberArrayType | ColorType
          : NumberArrayType;
    },
    withArgsCount(1, Infinity),
    parseArgsOfType(NumberType),
  ),
  [Ops.Color]: createParser(
    ColorType,
    withArgsCount(1, 4),
    parseArgsOfType(NumberType),
  ),
  [Ops.Band]: createParser(
    NumberType,
    withArgsCount(1, 3),
    parseArgsOfType(NumberType),
  ),
  [Ops.Palette]: createParser(ColorType, withArgsCount(2, 2), parsePaletteArgs),
  [Ops.ToString]: createParser(
    StringType,
    withArgsCount(1, 1),
    parseArgsOfType(BooleanType | NumberType | StringType | ColorType),
  ),
};

/**
 * @typedef {function(Array<EncodedExpression>, ParsingContext, Array<Expression>, number?):Array<Expression>|void} ArgValidator
 * An argument validator applies various checks to an encoded expression arguments
 * Returns the parsed arguments if any.
 * Third argument is the array of parsed arguments from previous validators
 * Fourth argument is an optional type hint
 */

/**
 * @type ArgValidator
 */
function withGetArgs(encoded, context) {
  const arg = parse(encoded[1], context);
  if (!(arg instanceof LiteralExpression)) {
    throw new Error('Expected a literal argument for get operation');
  }
  if (typeof arg.value !== 'string') {
    throw new Error('Expected a string argument for get operation');
  }
  context.properties.add(arg.value);
  if (encoded.length === 3) {
    const hint = parse(encoded[2], context);
    return [arg, hint];
  }
  return [arg];
}

/**
 * @type ArgValidator
 */
function withVarArgs(encoded, context, parsedArgs, typeHint) {
  const varName = encoded[1];
  if (typeof varName !== 'string') {
    throw new Error('Expected a string argument for var operation');
  }
  context.variables.add(varName);
  if (
    !('variables' in context.style) ||
    context.style.variables[varName] === undefined
  ) {
    return [new LiteralExpression(AnyType, varName)];
  }
  const initialValue = context.style.variables[varName];
  const arg = /** @type {LiteralExpression} */ (parse(initialValue, context));
  arg.value = varName;
  if (typeHint && !overlapsType(typeHint, arg.type)) {
    throw new Error(
      `The variable ${varName} has type ${typeName(
        arg.type,
      )} but the following type was expected: ${typeName(typeHint)}`,
    );
  }
  return [arg];
}

/**
 * @type ArgValidator
 */
function usesFeatureId(encoded, context) {
  context.featureId = true;
}

/**
 * @type ArgValidator
 */
function usesGeometryType(encoded, context) {
  context.geometryType = true;
}

/**
 * @type ArgValidator
 */
function withNoArgs(encoded, context) {
  const operation = encoded[0];
  if (encoded.length !== 1) {
    throw new Error(`Expected no arguments for ${operation} operation`);
  }
  return [];
}

/**
 * @param {number} minArgs The minimum number of arguments.
 * @param {number} maxArgs The maximum number of arguments.
 * @return {ArgValidator} The argument validator
 */
function withArgsCount(minArgs, maxArgs) {
  return function (encoded, context) {
    const operation = encoded[0];
    const argCount = encoded.length - 1;
    if (minArgs === maxArgs) {
      if (argCount !== minArgs) {
        const plural = minArgs === 1 ? '' : 's';
        throw new Error(
          `Expected ${minArgs} argument${plural} for ${operation}, got ${argCount}`,
        );
      }
    } else if (argCount < minArgs || argCount > maxArgs) {
      const range =
        maxArgs === Infinity
          ? `${minArgs} or more`
          : `${minArgs} to ${maxArgs}`;
      throw new Error(
        `Expected ${range} arguments for ${operation}, got ${argCount}`,
      );
    }
  };
}

/**
 * @param {number} argType The argument type.
 * @return {ArgValidator} The argument validator
 */
function parseArgsOfType(argType) {
  return function (encoded, context) {
    const operation = encoded[0];
    const argCount = encoded.length - 1;
    /**
     * @type {Array<Expression>}
     */
    const args = new Array(argCount);
    for (let i = 0; i < argCount; ++i) {
      const expression = parse(encoded[i + 1], context);
      if (!overlapsType(argType, expression.type)) {
        const gotType = typeName(argType);
        const expectedType = typeName(expression.type);
        throw new Error(
          `Unexpected type for argument ${i} of ${operation} operation` +
            `, got ${gotType} but expected ${expectedType}`,
        );
      }
      expression.type &= argType;
      args[i] = expression;
    }
    return args;
  };
}

/**
 * @type {ArgValidator}
 */
function narrowArgsType(encoded, context, parsedArgs) {
  const operation = encoded[0];
  const argCount = encoded.length - 1;

  // first pass to determine a narrowed down type
  let sameType = AnyType;
  for (let i = 0; i < parsedArgs.length; ++i) {
    sameType &= parsedArgs[i].type;
  }

  if (sameType === NoneType) {
    throw new Error(
      `No common type could be found for arguments of ${operation} operation`,
    );
  }

  // re-parse args
  const args = new Array(argCount);
  for (let i = 0; i < argCount; ++i) {
    args[i] = parse(encoded[i + 1], context, sameType);
  }
  return args;
}

/**
 * @type {ArgValidator}
 */
function withOddArgs(encoded, context) {
  const operation = encoded[0];
  const argCount = encoded.length - 1;
  if (argCount % 2 === 0) {
    throw new Error(
      `An odd amount of arguments was expected for operation ${operation}, got ${JSON.stringify(
        argCount,
      )} instead`,
    );
  }
}

/**
 * @type {ArgValidator}
 */
function withEvenArgs(encoded, context) {
  const operation = encoded[0];
  const argCount = encoded.length - 1;
  if (argCount % 2 === 1) {
    throw new Error(
      `An even amount of arguments was expected for operation ${operation}, got ${JSON.stringify(
        argCount,
      )} instead`,
    );
  }
}

/**
 * @type ArgValidator
 */
function parseMatchArgs(encoded, context, parsedArgs, typeHint) {
  const argsCount = encoded.length - 1;

  const input = parse(encoded[1], context);
  let inputType = input.type;
  const fallback = parse(encoded[encoded.length - 1], context);
  let outputType =
    typeHint !== undefined ? typeHint & fallback.type : fallback.type;

  // first parse args to figure out possible types
  const args = new Array(argsCount - 2);
  for (let i = 0; i < argsCount - 2; i += 2) {
    const match = parse(encoded[i + 2], context);
    const output = parse(encoded[i + 3], context);
    inputType &= match.type;
    outputType &= output.type;
    args[i] = match;
    args[i + 1] = output;
  }

  // check input and output types validity
  const expectedInputType = StringType | NumberType | BooleanType;
  if (!overlapsType(expectedInputType, inputType)) {
    throw new Error(
      `Expected an input of type ${typeName(
        expectedInputType,
      )} for the interpolate operation` +
        `, got ${typeName(inputType)} instead`,
    );
  }
  inputType &= expectedInputType;
  if (isType(outputType, NoneType)) {
    throw new Error(
      `Could not find a common output type for the following match operation: ` +
        JSON.stringify(encoded),
    );
  }

  // parse again inputs and outputs with common type
  for (let i = 0; i < argsCount - 2; i += 2) {
    const match = parse(encoded[i + 2], context, inputType);
    const output = parse(encoded[i + 3], context, outputType);
    args[i] = match;
    args[i + 1] = output;
  }

  return [
    parse(encoded[1], context, inputType),
    ...args,
    parse(encoded[encoded.length - 1], context, outputType),
  ];
}

/**
 * @type ArgValidator
 */
function parseInterpolateArgs(encoded, context, parsedArgs, typeHint) {
  const interpolationType = encoded[1];
  let interpolation;
  switch (interpolationType[0]) {
    case 'linear':
      interpolation = 1;
      break;
    case 'exponential':
      interpolation = interpolationType[1];
      if (typeof interpolation !== 'number') {
        throw new Error(
          `Expected a number base for exponential interpolation` +
            `, got ${JSON.stringify(interpolation)} instead`,
        );
      }
      break;
    default:
      interpolation = null;
  }
  if (!interpolation) {
    throw new Error(
      `Invalid interpolation type: ${JSON.stringify(interpolationType)}`,
    );
  }
  interpolation = parse(interpolation, context);

  // check input types
  let input = parse(encoded[2], context);
  if (!overlapsType(NumberType, input.type)) {
    throw new Error(
      `Expected an input of type number for the interpolate operation` +
        `, got ${typeName(input.type)} instead`,
    );
  }
  input = parse(encoded[2], context, NumberType); // parse again with narrower output

  const args = new Array(encoded.length - 3);
  for (let i = 0; i < args.length; i += 2) {
    let stop = parse(encoded[i + 3], context);
    if (!overlapsType(NumberType, stop.type)) {
      throw new Error(
        `Expected all stop input values in the interpolate operation to be of type number` +
          `, got ${typeName(stop.type)} at position ${i + 2} instead`,
      );
    }
    let output = parse(encoded[i + 4], context);
    if (!overlapsType(NumberType | ColorType, output.type)) {
      throw new Error(
        `Expected all stop output values in the interpolate operation to be a number or color` +
          `, got ${typeName(output.type)} at position ${i + 3} instead`,
      );
    }
    // parse again with narrower types
    stop = parse(encoded[i + 3], context, NumberType);
    output = parse(encoded[i + 4], context, NumberType | ColorType);
    args[i] = stop;
    args[i + 1] = output;
  }

  return [interpolation, input, ...args];
}

/**
 * @type ArgValidator
 */
function parseCaseArgs(encoded, context, parsedArgs, typeHint) {
  const fallback = parse(encoded[encoded.length - 1], context, typeHint);
  let outputType =
    typeHint !== undefined ? typeHint & fallback.type : fallback.type;

  // first parse args to figure out possible types
  const args = new Array(encoded.length - 1);
  for (let i = 0; i < args.length - 1; i += 2) {
    const condition = parse(encoded[i + 1], context);
    const output = parse(encoded[i + 2], context, typeHint);
    if (!overlapsType(BooleanType, condition.type)) {
      throw new Error(
        `Expected all conditions in the case operation to be of type boolean` +
          `, got ${typeName(condition.type)} at position ${i} instead`,
      );
    }
    outputType &= output.type;
    args[i] = condition;
    args[i + 1] = output;
  }

  if (isType(outputType, NoneType)) {
    throw new Error(
      `Could not find a common output type for the following case operation: ` +
        JSON.stringify(encoded),
    );
  }

  // parse again args with common output type
  for (let i = 0; i < args.length - 1; i += 2) {
    args[i + 1] = parse(encoded[i + 2], context, outputType);
  }
  args[args.length - 1] = parse(
    encoded[encoded.length - 1],
    context,
    outputType,
  );

  return args;
}

/**
 * @type ArgValidator
 */
function parseInArgs(encoded, context) {
  /** @type {Array<number|string>} */
  let haystack = /** @type {any} */ (encoded[2]);
  if (!Array.isArray(haystack)) {
    throw new Error(
      `The "in" operator was provided a literal value which was not an array as second argument.`,
    );
  }
  if (typeof haystack[0] === 'string') {
    if (haystack[0] !== 'literal') {
      throw new Error(
        `For the "in" operator, a string array should be wrapped in a "literal" operator to disambiguate from expressions.`,
      );
    }
    if (!Array.isArray(haystack[1])) {
      throw new Error(
        `The "in" operator was provided a literal value which was not an array as second argument.`,
      );
    }
    haystack = haystack[1];
  }

  let needleType = StringType | NumberType;
  const args = new Array(haystack.length);
  for (let i = 0; i < args.length; i++) {
    const arg = parse(haystack[i], context);
    needleType &= arg.type;
    args[i] = arg;
  }
  if (isType(needleType, NoneType)) {
    throw new Error(
      `Could not find a common type for the following in operation: ` +
        JSON.stringify(encoded),
    );
  }

  const needle = parse(encoded[1], context, needleType);
  return [needle, ...args];
}

/**
 * @type ArgValidator
 */
function parsePaletteArgs(encoded, context) {
  const index = parse(encoded[1], context, NumberType);
  if (index.type !== NumberType) {
    throw new Error(
      `The first argument of palette must be an number, got ${typeName(
        index.type,
      )} instead`,
    );
  }
  const colors = encoded[2];
  if (!Array.isArray(colors)) {
    throw new Error('The second argument of palette must be an array');
  }
  const parsedColors = new Array(colors.length);
  for (let i = 0; i < parsedColors.length; i++) {
    const color = parse(colors[i], context, ColorType);
    if (!(color instanceof LiteralExpression)) {
      throw new Error(
        `The palette color at index ${i} must be a literal value`,
      );
    }
    if (!overlapsType(color.type, ColorType)) {
      throw new Error(
        `The palette color at index ${i} should be of type color, got ${typeName(
          color.type,
        )} instead`,
      );
    }
    parsedColors[i] = color;
  }
  return [index, ...parsedColors];
}

/**
 * @param {number|function(Array<Expression>):number} returnType The return type of the operator; can be a fixed value or a callback taking the parsed
 * arguments
 * @param {Array<ArgValidator>} argValidators A chain of argument validators; the return value of the last validator
 * will be used as parsed arguments
 * @return {Parser} The parser.
 */
function createParser(returnType, ...argValidators) {
  return function (encoded, context, typeHint) {
    const operator = encoded[0];
    let parsedArgs = [];
    for (let i = 0; i < argValidators.length; i++) {
      parsedArgs =
        argValidators[i](encoded, context, parsedArgs, typeHint) || parsedArgs;
    }
    let actualType =
      typeof returnType === 'function' ? returnType(parsedArgs) : returnType;
    if (typeHint !== undefined) {
      if (!overlapsType(actualType, typeHint)) {
        throw new Error(
          `The following expression was expected to return ${typeName(
            typeHint,
          )}, but returns ${typeName(actualType)} instead: ${JSON.stringify(
            encoded,
          )}`,
        );
      }
      actualType &= typeHint;
    }
    if (actualType === NoneType) {
      throw new Error(
        `No matching type was found for the following expression: ${JSON.stringify(
          encoded,
        )}`,
      );
    }
    return new CallExpression(actualType, operator, ...parsedArgs);
  };
}

/**
 * @param {Array} encoded The encoded expression.
 * @param {ParsingContext} context The parsing context.
 * @param {number} [typeHint] Optional type hint
 * @return {Expression} The parsed expression.
 */
function parseCallExpression(encoded, context, typeHint) {
  const operator = encoded[0];

  const parser = parsers[operator];
  if (!parser) {
    throw new Error(`Unknown operator: ${operator}`);
  }
  return parser(encoded, context, typeHint);
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
