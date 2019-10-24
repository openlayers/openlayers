/**
 * Operators and utilities used for style expressions
 * @module ol/style/expressions
 */

import {isStringColor} from '../color.js';

/**
 * Base type used for literal style parameters; can be a number literal or the output of an operator,
 * which in turns takes {@link ExpressionValue} arguments.
 *
 * The following operators can be used:
 *
 * * Reading operators:
 *   * `['get', 'attributeName']` fetches a feature attribute (it will be prefixed by `a_` in the shader)
 *     Note: those will be taken from the attributes provided to the renderer
 *   * `['var', 'varName']` fetches a value from the style variables, or 0 if undefined
 *   * `['time']` returns the time in seconds since the creation of the layer
 *
 * * Math operators:
 *   * `['*', value1, value1]` multiplies `value1` by `value2`
 *   * `['/', value1, value1]` divides `value1` by `value2`
 *   * `['+', value1, value1]` adds `value1` and `value2`
 *   * `['-', value1, value1]` subtracts `value2` from `value1`
 *   * `['clamp', value, low, high]` clamps `value` between `low` and `high`
 *   * `['stretch', value, low1, high1, low2, high2]` maps `value` from [`low1`, `high1`] range to
 *     [`low2`, `high2`] range, clamping values along the way
 *   * `['mod', value1, value1]` returns the result of `value1 % value2` (modulo)
 *   * `['pow', value1, value1]` returns the value of `value1` raised to the `value2` power
 *
 * * Color operators:
 *   * `['interpolate', ratio, color1, color2]` returns a color through interpolation between `color1` and
 *     `color2` with the given `ratio`
 *
 * * Logical operators:
 *   * `['<', value1, value2]` returns `1` if `value1` is strictly lower than value 2, or `0` otherwise.
 *   * `['<=', value1, value2]` returns `1` if `value1` is lower than or equals value 2, or `0` otherwise.
 *   * `['>', value1, value2]` returns `1` if `value1` is strictly greater than value 2, or `0` otherwise.
 *   * `['>=', value1, value2]` returns `1` if `value1` is greater than or equals value 2, or `0` otherwise.
 *   * `['==', value1, value2]` returns `1` if `value1` equals value 2, or `0` otherwise.
 *   * `['!', value1]` returns `0` if `value1` strictly greater than `0`, or `1` otherwise.
 *   * `['between', value1, value2, value3]` returns `1` if `value1` is contained between `value2` and `value3`
 *     (inclusively), or `0` otherwise.
 *   * `['match', input, match1, output1, ...matchN, outputN, fallback]` compares the `input` value against all
 *     provided `matchX` values, returning the output associated with the first valid match. If no match is found,
 *     returns the `fallback` value.
 *     `input` and `matchX` values must all be of the same type, and can be `number` or `string`. `outputX` and
 *     `fallback` values must be of the same type, and can be any kind.
 *
 * Values can either be literals or another operator, as they will be evaluated recursively.
 * Literal values can be of the following types:
 * * `number`
 * * `string`
 * * {@link module:ol/color~Color}
 *
 * @typedef {Array<*>|import("../color.js").Color|string|number|boolean} ExpressionValue
 */

/**
 * Possible inferred types from a given value or expression.
 * Note: these are binary flags.
 * @enum {number}
 */
export const ValueTypes = {
  NUMBER: 0b00001,
  STRING: 0b00010,
  COLOR: 0b00100,
  BOOLEAN: 0b01000,
  NUMBER_ARRAY: 0b10000,
  ANY: 0b11111
};

/**
 * Returns the possible types for a given value (each type being a binary flag)
 * To test a value use e.g. `getValueType(v) & ValueTypes.BOOLEAN`
 * @param {ExpressionValue} value Value
 * @returns {ValueTypes|number} Type or types inferred from the value
 */
export function getValueType(value) {
  if (typeof value === 'number') {
    return ValueTypes.NUMBER;
  }
  if (typeof value === 'boolean') {
    return ValueTypes.BOOLEAN;
  }
  if (typeof value === 'string') {
    if (isStringColor(value)) {
      return ValueTypes.COLOR | ValueTypes.STRING;
    }
    return ValueTypes.STRING;
  }
  if (!Array.isArray(value)) {
    throw new Error(`Unhandled value type: ${JSON.stringify(value)}`);
  }
  const onlyNumbers = value.every(function(v) {
    return typeof v === 'number';
  });
  if (onlyNumbers) {
    if (value.length === 3 || value.length === 4) {
      return ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY;
    }
    return ValueTypes.NUMBER_ARRAY;
  }
  if (typeof value[0] !== 'string') {
    throw new Error(`Expected an expression operator but received: ${JSON.stringify(value)}`);
  }
  switch (value[0]) {
    case 'get':
    case 'var':
    case 'time':
    case '*':
    case '/':
    case '+':
    case '-':
    case 'clamp':
    case 'stretch':
    case 'mod':
    case 'pow':
    case '>':
    case '>=':
    case '<':
    case '<=':
    case '==':
    case '!':
    case 'between':
      return ValueTypes.NUMBER;
    case 'interpolate':
      return ValueTypes.COLOR;
    default:
      throw new Error(`Unrecognized expression operator: ${JSON.stringify(value)}`);
  }
}
