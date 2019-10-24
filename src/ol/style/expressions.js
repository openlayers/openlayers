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
  const valueArr = /** @type {Array<*>} */(value);
  const onlyNumbers = valueArr.every(function(v) {
    return typeof v === 'number';
  });
  if (onlyNumbers) {
    if (valueArr.length === 3 || valueArr.length === 4) {
      return ValueTypes.COLOR | ValueTypes.NUMBER_ARRAY;
    }
    return ValueTypes.NUMBER_ARRAY;
  }
  if (typeof valueArr[0] !== 'string') {
    throw new Error(`Expected an expression operator but received: ${JSON.stringify(valueArr)}`);
  }
  const operator = Operators[valueArr[0]];
  if (operator === undefined) {
    throw new Error(`Unrecognized expression operator: ${JSON.stringify(valueArr)}`);
  }
  return operator.getReturnType(valueArr.slice(1));
}

function assertNumber(value) {
  if (!(getValueType(value) & ValueTypes.NUMBER)) {
    throw new Error(`A numeric value was expected, got ${JSON.stringify(value)} instead`);
  }
}
function assertColor(value) {
  if (!(getValueType(value) & ValueTypes.COLOR)) {
    throw new Error(`A color value was expected, got ${JSON.stringify(value)} instead`);
  }
}
function assertString(value) {
  if (!(getValueType(value) & ValueTypes.STRING)) {
    throw new Error(`A string value was expected, got ${JSON.stringify(value)} instead`);
  }
}
function assertBoolean(value) {
  if (!(getValueType(value) & ValueTypes.BOOLEAN)) {
    throw new Error(`A boolean value was expected, got ${JSON.stringify(value)} instead`);
  }
}
function assertArgsCount(args, count) {
  if (args.length !== count) {
    throw new Error(`Exactly ${count} arguments were expected, got ${args.length} instead`);
  }
}

/**
 * Context available during the parsing of an expression.
 * @typedef {Object} ParsingContext
 * @property {boolean} inFragmentShader If false, means the expression output should be made for a vertex shader
 */

/**
 * An operator declaration must contain two methods: `getReturnType` which returns a type based on
 * the operator arguments, and `toGlsl` which returns a GLSL-compatible string.
 * Note: both methods can process arguments recursively.
 * @typedef {Object} Operator
 * @property {function(...ExpressionValue): ValueTypes|number} getReturnType Returns one or several types
 * @property {function(ParsingContext, ...ExpressionValue): string} toGlsl Returns a GLSL-compatible string
 */

/**
 * Operator declarations
 * @type {Object<string, Operator>}
 */
export const Operators = {
  'get': {
    getReturnType: function(...args) {
      return ValueTypes.ANY;
    },
    toGlsl: function(context, ...args) {
      const prefix = context.inFragmentShader ? 'v_' : 'a_';
      assertArgsCount(args, 1);
      assertString(args[0]);
      return prefix + args[0];
    }
  },
  'var': {
    getReturnType: function(...args) {
      return ValueTypes.ANY;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 1);
      assertString(args[0]);
      return `u_${args[0]}`;
    }
  },
  'time': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 0);
      return 'u_time';
    }
  },
  '*': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} * ${args[1]})`;
    }
  },
  '/': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} / ${args[1]})`;
    }
  },
  '+': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} + ${args[1]})`;
    }
  },
  '-': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} - ${args[1]})`;
    }
  },
  'clamp': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 3);
      assertNumber(args[0]);
      assertNumber(args[1]);
      assertNumber(args[2]);
      return `clamp(${args[0]}, ${args[1]}, ${args[2]})`;
    }
  },
  'stretch': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 5);
      assertNumber(args[0]);
      assertNumber(args[1]);
      assertNumber(args[2]);
      assertNumber(args[3]);
      assertNumber(args[4]);
      const low1 = args[1];
      const high1 = args[2];
      const low2 = args[3];
      const high2 = args[4];
      return `((clamp(${args[0]}, ${low1}, ${high1}) - ${low1}) * ((${high2} - ${low2}) / (${high1} - ${low1})) + ${low2})`;
    }
  },
  'mod': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `mod(${args[0]}, ${args[1]})`;
    }
  },
  'pow': {
    getReturnType: function(...args) {
      return ValueTypes.NUMBER;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `pow(${args[0]}, ${args[1]})`;
    }
  },
  '>': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} > ${args[1]})`;
    }
  },
  '>=': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} >= ${args[1]})`;
    }
  },
  '<': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} < ${args[1]})`;
    }
  },
  '<=': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} <= ${args[1]})`;
    }
  },
  '==': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 2);
      assertNumber(args[0]);
      assertNumber(args[1]);
      return `(${args[0]} == ${args[1]})`;
    }
  },
  '!': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 1);
      assertBoolean(args[0]);
      return `(!${args[0]})`;
    }
  },
  'between': {
    getReturnType: function(...args) {
      return ValueTypes.BOOLEAN;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 3);
      assertNumber(args[0]);
      assertNumber(args[1]);
      assertNumber(args[2]);
      return `(${args[0]} >= ${args[1]} && ${args[0]} <= ${args[2]})`;
    }
  },
  'interpolate': {
    getReturnType: function(...args) {
      return ValueTypes.COLOR;
    },
    toGlsl: function(context, ...args) {
      assertArgsCount(args, 3);
      assertNumber(args[0]);
      assertColor(args[1]);
      assertColor(args[2]);
      return `mix(${args[1]}, ${args[2]}, ${args[0]})`;
    }
  }
};
