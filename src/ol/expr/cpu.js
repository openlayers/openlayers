/**
 * @module ol/expr/cpu
 */

import {
  fromString,
  lchaToRgba,
  rgbaToLcha,
  toString,
  withAlpha,
} from '../color.js';
import {ColorType, LiteralExpression, Ops, parse} from './expression.js';

/**
 * @fileoverview This module includes functions to build expressions for evaluation on the CPU.
 * Building is composed of two steps: parsing and compiling.  The parsing step takes an encoded
 * expression and returns an instance of one of the expression classes.  The compiling step takes
 * the expression instance and returns a function that can be evaluated in to return a literal
 * value.  The evaluator function should do as little allocation and work as possible.
 */

/**
 * @typedef {Object} EvaluationContext
 * @property {Object} properties The values for properties used in 'get' expressions.
 * @property {Object} variables The values for variables used in 'var' expressions.
 * @property {number} resolution The map resolution.
 * @property {string|number|null} featureId The feature id.
 * @property {string} geometryType Geometry type of the current object.
 */

/**
 * @return {EvaluationContext} A new evaluation context.
 */
export function newEvaluationContext() {
  return {
    variables: {},
    properties: {},
    resolution: NaN,
    featureId: null,
    geometryType: '',
  };
}

/**
 * @typedef {function(EvaluationContext):import("./expression.js").LiteralValue} ExpressionEvaluator
 */

/**
 * @typedef {function(EvaluationContext):boolean} BooleanEvaluator
 */

/**
 * @typedef {function(EvaluationContext):number} NumberEvaluator
 */

/**
 * @typedef {function(EvaluationContext):string} StringEvaluator
 */

/**
 * @typedef {function(EvaluationContext):(Array<number>|string)} ColorLikeEvaluator
 */

/**
 * @typedef {function(EvaluationContext):Array<number>} NumberArrayEvaluator
 */

/**
 * @typedef {function(EvaluationContext):Array<number>} CoordinateEvaluator
 */

/**
 * @typedef {function(EvaluationContext):(Array<number>)} SizeEvaluator
 */

/**
 * @typedef {function(EvaluationContext):(Array<number>|number)} SizeLikeEvaluator
 */

/**
 * @param {import('./expression.js').EncodedExpression} encoded The encoded expression.
 * @param {number} type The expected type.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The expression evaluator.
 */
export function buildExpression(encoded, type, context) {
  const expression = parse(encoded, type, context);
  return compileExpression(expression, context);
}

/**
 * @param {import("./expression.js").Expression} expression The expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileExpression(expression, context) {
  if (expression instanceof LiteralExpression) {
    // convert colors to array if possible
    if (expression.type === ColorType && typeof expression.value === 'string') {
      const colorValue = fromString(expression.value);
      return function () {
        return colorValue;
      };
    }
    return function () {
      return expression.value;
    };
  }
  const operator = expression.operator;
  switch (operator) {
    case Ops.Number:
    case Ops.String:
    case Ops.Coalesce: {
      return compileAssertionExpression(expression, context);
    }
    case Ops.Get:
    case Ops.Var:
    case Ops.Has: {
      return compileAccessorExpression(expression, context);
    }
    case Ops.Id: {
      return (context) => context.featureId;
    }
    case Ops.GeometryType: {
      return (context) => context.geometryType;
    }
    case Ops.Concat: {
      const args = expression.args.map((e) => compileExpression(e, context));
      return (context) =>
        ''.concat(...args.map((arg) => arg(context).toString()));
    }
    case Ops.Resolution: {
      return (context) => context.resolution;
    }
    case Ops.Any:
    case Ops.All:
    case Ops.Between:
    case Ops.In:
    case Ops.Not: {
      return compileLogicalExpression(expression, context);
    }
    case Ops.Equal:
    case Ops.NotEqual:
    case Ops.LessThan:
    case Ops.LessThanOrEqualTo:
    case Ops.GreaterThan:
    case Ops.GreaterThanOrEqualTo: {
      return compileComparisonExpression(expression, context);
    }
    case Ops.Multiply:
    case Ops.Divide:
    case Ops.Add:
    case Ops.Subtract:
    case Ops.Clamp:
    case Ops.Mod:
    case Ops.Pow:
    case Ops.Abs:
    case Ops.Floor:
    case Ops.Ceil:
    case Ops.Round:
    case Ops.Sin:
    case Ops.Cos:
    case Ops.Atan:
    case Ops.Sqrt: {
      return compileNumericExpression(expression, context);
    }
    case Ops.Case: {
      return compileCaseExpression(expression, context);
    }
    case Ops.Match: {
      return compileMatchExpression(expression, context);
    }
    case Ops.Interpolate: {
      return compileInterpolateExpression(expression, context);
    }
    case Ops.ToString: {
      return compileConvertExpression(expression, context);
    }
    default: {
      throw new Error(`Unsupported operator ${operator}`);
    }
    // TODO: unimplemented
    // Ops.Zoom
    // Ops.Time
    // Ops.Array
    // Ops.Color
    // Ops.Band
    // Ops.Palette
  }
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileAssertionExpression(expression, context) {
  const type = expression.operator;
  const length = expression.args.length;

  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  switch (type) {
    case Ops.Coalesce: {
      return (context) => {
        for (let i = 0; i < length; ++i) {
          const value = args[i](context);
          if (typeof value !== 'undefined' && value !== null) {
            return value;
          }
        }
        throw new Error('Expected one of the values to be non-null');
      };
    }
    case Ops.Number:
    case Ops.String: {
      return (context) => {
        for (let i = 0; i < length; ++i) {
          const value = args[i](context);
          if (typeof value === type) {
            return value;
          }
        }
        throw new Error(`Expected one of the values to be a ${type}`);
      };
    }
    default: {
      throw new Error(`Unsupported assertion operator ${type}`);
    }
  }
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileAccessorExpression(expression, context) {
  const nameExpression = /** @type {LiteralExpression} */ (expression.args[0]);
  const name = /** @type {string} */ (nameExpression.value);
  switch (expression.operator) {
    case Ops.Get: {
      return (context) => {
        const args = expression.args;
        let value = context.properties[name];
        for (let i = 1, ii = args.length; i < ii; ++i) {
          const keyExpression = /** @type {LiteralExpression} */ (args[i]);
          const key = /** @type {string|number} */ (keyExpression.value);
          value = value[key];
        }
        return value;
      };
    }
    case Ops.Var: {
      return (context) => context.variables[name];
    }
    case Ops.Has: {
      return (context) => {
        const args = expression.args;
        if (!(name in context.properties)) {
          return false;
        }
        let value = context.properties[name];
        for (let i = 1, ii = args.length; i < ii; ++i) {
          const keyExpression = /** @type {LiteralExpression} */ (args[i]);
          const key = /** @type {string|number} */ (keyExpression.value);
          if (!value || !Object.hasOwn(value, key)) {
            return false;
          }
          value = value[key];
        }
        return true;
      };
    }
    default: {
      throw new Error(`Unsupported accessor operator ${expression.operator}`);
    }
  }
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {BooleanEvaluator} The evaluator function.
 */
function compileComparisonExpression(expression, context) {
  const op = expression.operator;
  const left = compileExpression(expression.args[0], context);
  const right = compileExpression(expression.args[1], context);
  switch (op) {
    case Ops.Equal: {
      return (context) => left(context) === right(context);
    }
    case Ops.NotEqual: {
      return (context) => left(context) !== right(context);
    }
    case Ops.LessThan: {
      return (context) => left(context) < right(context);
    }
    case Ops.LessThanOrEqualTo: {
      return (context) => left(context) <= right(context);
    }
    case Ops.GreaterThan: {
      return (context) => left(context) > right(context);
    }
    case Ops.GreaterThanOrEqualTo: {
      return (context) => left(context) >= right(context);
    }
    default: {
      throw new Error(`Unsupported comparison operator ${op}`);
    }
  }
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {BooleanEvaluator} The evaluator function.
 */
function compileLogicalExpression(expression, context) {
  const op = expression.operator;
  const length = expression.args.length;

  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  switch (op) {
    case Ops.Any: {
      return (context) => {
        for (let i = 0; i < length; ++i) {
          if (args[i](context)) {
            return true;
          }
        }
        return false;
      };
    }
    case Ops.All: {
      return (context) => {
        for (let i = 0; i < length; ++i) {
          if (!args[i](context)) {
            return false;
          }
        }
        return true;
      };
    }
    case Ops.Between: {
      return (context) => {
        const value = args[0](context);
        const min = args[1](context);
        const max = args[2](context);
        return value >= min && value <= max;
      };
    }
    case Ops.In: {
      return (context) => {
        const value = args[0](context);
        for (let i = 1; i < length; ++i) {
          if (value === args[i](context)) {
            return true;
          }
        }
        return false;
      };
    }
    case Ops.Not: {
      return (context) => !args[0](context);
    }
    default: {
      throw new Error(`Unsupported logical operator ${op}`);
    }
  }
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {NumberEvaluator} The evaluator function.
 */
function compileNumericExpression(expression, context) {
  const op = expression.operator;
  const length = expression.args.length;

  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  switch (op) {
    case Ops.Multiply: {
      return (context) => {
        let value = 1;
        for (let i = 0; i < length; ++i) {
          value *= args[i](context);
        }
        return value;
      };
    }
    case Ops.Divide: {
      return (context) => args[0](context) / args[1](context);
    }
    case Ops.Add: {
      return (context) => {
        let value = 0;
        for (let i = 0; i < length; ++i) {
          value += args[i](context);
        }
        return value;
      };
    }
    case Ops.Subtract: {
      return (context) => args[0](context) - args[1](context);
    }
    case Ops.Clamp: {
      return (context) => {
        const value = args[0](context);
        const min = args[1](context);
        if (value < min) {
          return min;
        }
        const max = args[2](context);
        if (value > max) {
          return max;
        }
        return value;
      };
    }
    case Ops.Mod: {
      return (context) => args[0](context) % args[1](context);
    }
    case Ops.Pow: {
      return (context) => Math.pow(args[0](context), args[1](context));
    }
    case Ops.Abs: {
      return (context) => Math.abs(args[0](context));
    }
    case Ops.Floor: {
      return (context) => Math.floor(args[0](context));
    }
    case Ops.Ceil: {
      return (context) => Math.ceil(args[0](context));
    }
    case Ops.Round: {
      return (context) => Math.round(args[0](context));
    }
    case Ops.Sin: {
      return (context) => Math.sin(args[0](context));
    }
    case Ops.Cos: {
      return (context) => Math.cos(args[0](context));
    }
    case Ops.Atan: {
      if (length === 2) {
        return (context) => Math.atan2(args[0](context), args[1](context));
      }
      return (context) => Math.atan(args[0](context));
    }
    case Ops.Sqrt: {
      return (context) => Math.sqrt(args[0](context));
    }
    default: {
      throw new Error(`Unsupported numeric operator ${op}`);
    }
  }
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileCaseExpression(expression, context) {
  const length = expression.args.length;
  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  return (context) => {
    for (let i = 0; i < length - 1; i += 2) {
      const condition = args[i](context);
      if (condition) {
        return args[i + 1](context);
      }
    }
    return args[length - 1](context);
  };
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileMatchExpression(expression, context) {
  const length = expression.args.length;
  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  return (context) => {
    const value = args[0](context);
    for (let i = 1; i < length - 1; i += 2) {
      if (value === args[i](context)) {
        return args[i + 1](context);
      }
    }
    return args[length - 1](context);
  };
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileInterpolateExpression(expression, context) {
  const length = expression.args.length;
  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  return (context) => {
    const base = args[0](context);
    const value = args[1](context);

    let previousInput;
    let previousOutput;
    for (let i = 2; i < length; i += 2) {
      const input = args[i](context);
      let output = args[i + 1](context);
      const isColor = Array.isArray(output);
      if (isColor) {
        output = withAlpha(output);
      }
      if (input >= value) {
        if (i === 2) {
          return output;
        }
        if (isColor) {
          return interpolateColor(
            base,
            value,
            previousInput,
            previousOutput,
            input,
            output,
          );
        }
        return interpolateNumber(
          base,
          value,
          previousInput,
          previousOutput,
          input,
          output,
        );
      }
      previousInput = input;
      previousOutput = output;
    }
    return previousOutput;
  };
}

/**
 * @param {import('./expression.js').CallExpression} expression The call expression.
 * @param {import('./expression.js').ParsingContext} context The parsing context.
 * @return {ExpressionEvaluator} The evaluator function.
 */
function compileConvertExpression(expression, context) {
  const op = expression.operator;
  const length = expression.args.length;

  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  switch (op) {
    case Ops.ToString: {
      return (context) => {
        const value = args[0](context);
        if (expression.args[0].type === ColorType) {
          return toString(value);
        }
        return value.toString();
      };
    }
    default: {
      throw new Error(`Unsupported convert operator ${op}`);
    }
  }
}

/**
 * @param {number} base The base.
 * @param {number} value The value.
 * @param {number} input1 The first input value.
 * @param {number} output1 The first output value.
 * @param {number} input2 The second input value.
 * @param {number} output2 The second output value.
 * @return {number} The interpolated value.
 */
function interpolateNumber(base, value, input1, output1, input2, output2) {
  const delta = input2 - input1;
  if (delta === 0) {
    return output1;
  }
  const along = value - input1;
  const factor =
    base === 1
      ? along / delta
      : (Math.pow(base, along) - 1) / (Math.pow(base, delta) - 1);
  return output1 + factor * (output2 - output1);
}

/**
 * @param {number} base The base.
 * @param {number} value The value.
 * @param {number} input1 The first input value.
 * @param {import('../color.js').Color} rgba1 The first output value.
 * @param {number} input2 The second input value.
 * @param {import('../color.js').Color} rgba2 The second output value.
 * @return {import('../color.js').Color} The interpolated color.
 */
function interpolateColor(base, value, input1, rgba1, input2, rgba2) {
  const delta = input2 - input1;
  if (delta === 0) {
    return rgba1;
  }
  const lcha1 = rgbaToLcha(rgba1);
  const lcha2 = rgbaToLcha(rgba2);
  let deltaHue = lcha2[2] - lcha1[2];
  if (deltaHue > 180) {
    deltaHue -= 360;
  } else if (deltaHue < -180) {
    deltaHue += 360;
  }

  const lcha = [
    interpolateNumber(base, value, input1, lcha1[0], input2, lcha2[0]),
    interpolateNumber(base, value, input1, lcha1[1], input2, lcha2[1]),
    lcha1[2] + interpolateNumber(base, value, input1, 0, input2, deltaHue),
    interpolateNumber(base, value, input1, rgba1[3], input2, rgba2[3]),
  ];
  return lchaToRgba(lcha);
}
