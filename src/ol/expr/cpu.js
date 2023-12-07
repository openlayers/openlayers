/**
 * @module ol/expr/cpu
 */

import {
  ColorType,
  LiteralExpression,
  Ops,
  overlapsType,
  parse,
  typeName,
} from './expression.js';
import {
  fromString,
  lchaToRgba,
  normalize,
  rgbaToLcha,
  withAlpha,
} from '../color.js';

/**
 * @fileoverview This module includes functions to build expressions for evaluation on the CPU.
 * Building is composed of two steps: parsing and compiling.  The parsing step takes an encoded
 * expression and returns an instance of one of the expression classes.  The compiling step takes
 * the expression instance and returns a function that can be evaluated in to return a literal
 * value.  The evaluator function should do as little allocation and work as possible.
 */

export const UNKNOWN_VALUE = null;

/**
 * @typedef {Object} EvaluationContext
 * Each of these values can be set to null, which means that they are not known in the current context.
 * @property {Object|UNKNOWN_VALUE} properties The values for properties used in 'get' expressions.
 * @property {Object|UNKNOWN_VALUE} variables The values for variables used in 'var' expressions.
 * @property {number|UNKNOWN_VALUE} resolution The map resolution.
 * @property {string|number|UNKNOWN_VALUE} featureId The feature id.
 * @property {string|UNKNOWN_VALUE} geometryType Geometry type of the current object.
 */

/**
 * @return {EvaluationContext} A new evaluation context.
 */
export function newEvaluationContext() {
  return {
    variables: UNKNOWN_VALUE,
    properties: UNKNOWN_VALUE,
    resolution: UNKNOWN_VALUE,
    featureId: UNKNOWN_VALUE,
    geometryType: UNKNOWN_VALUE,
  };
}

/**
 * @typedef {import("./expression.js").LiteralValue} LiteralValue
 */

/**
 * @typedef {function(EvaluationContext):LiteralValue} ExpressionEvaluator
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
  const expression = parse(encoded, context);
  if (!overlapsType(type, expression.type)) {
    const expected = typeName(type);
    const actual = typeName(expression.type);
    throw new Error(
      `Expected expression to be of type ${expected}, got ${actual}`
    );
  }
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
    case Ops.String: {
      return compileAssertionExpression(expression, context);
    }
    case Ops.Get:
    case Ops.Var: {
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
      return checkForUnknown(args, (evaluatedArgs) =>
        ''.concat(...evaluatedArgs.map((arg) => arg.toString()))
      );
    }
    case Ops.Resolution: {
      return (context) => context.resolution;
    }
    case Ops.Any:
    case Ops.All:
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
    default: {
      throw new Error(`Unsupported operator ${operator}`);
    }
    // TODO: unimplemented
    // Ops.Zoom
    // Ops.Time
    // Ops.Between
    // Ops.In
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
    case Ops.Number:
    case Ops.String: {
      return (context) => {
        for (let i = 0; i < length; ++i) {
          const value = args[i](context);
          if (value === UNKNOWN_VALUE) {
            return UNKNOWN_VALUE;
          }
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
      return (context) =>
        context.properties === UNKNOWN_VALUE
          ? UNKNOWN_VALUE
          : context.properties[name];
    }
    case Ops.Var: {
      return (context) =>
        context.variables === UNKNOWN_VALUE
          ? UNKNOWN_VALUE
          : context.variables[name];
    }
    default: {
      throw new Error(`Unsupported accessor operator ${expression.operator}`);
    }
  }
}

/**
 * @param {Array<ExpressionEvaluator>} argEvaluators Argument evaluators
 * @param {function(Array): ReturnType} evaluator Final evaluator taking in the evaluated args
 * @return {function(EvaluationContext):ReturnType} the evaluator function; if any arg evaluated to UNKNOWN_VALUE, will return UNKNOWN_VALUE
 * @template ReturnType
 */
function checkForUnknown(argEvaluators, evaluator) {
  return (context) => {
    const evaluatedArgs = new Array(argEvaluators.length);
    for (let i = 0, ii = evaluatedArgs.length; i < ii; i++) {
      const value = argEvaluators[i](context);
      if (value === UNKNOWN_VALUE) {
        return UNKNOWN_VALUE;
      }
      evaluatedArgs[i] = value;
    }
    return evaluator(evaluatedArgs);
  };
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
      return checkForUnknown([left, right], ([left, right]) => left === right);
    }
    case Ops.NotEqual: {
      return checkForUnknown([left, right], ([left, right]) => left !== right);
    }
    case Ops.LessThan: {
      return checkForUnknown([left, right], ([left, right]) => left < right);
    }
    case Ops.LessThanOrEqualTo: {
      return checkForUnknown([left, right], ([left, right]) => left <= right);
    }
    case Ops.GreaterThan: {
      return checkForUnknown([left, right], ([left, right]) => left > right);
    }
    case Ops.GreaterThanOrEqualTo: {
      return checkForUnknown([left, right], ([left, right]) => left >= right);
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
      return checkForUnknown(args, (evaluatedArgs) => {
        for (let i = 0; i < length; ++i) {
          if (evaluatedArgs[i]) {
            return true;
          }
        }
        return false;
      });
    }
    case Ops.All: {
      return checkForUnknown(args, (evaluatedArgs) => {
        for (let i = 0; i < length; ++i) {
          if (!evaluatedArgs[i]) {
            return false;
          }
        }
        return true;
      });
    }
    case Ops.Not: {
      return checkForUnknown(args, ([arg]) => !arg);
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
      return checkForUnknown(args, (evaluatedArgs) => {
        let value = 1;
        for (let i = 0; i < length; ++i) {
          value *= evaluatedArgs[i];
        }
        return value;
      });
    }
    case Ops.Divide: {
      return checkForUnknown(args, ([first, second]) => first / second);
    }
    case Ops.Add: {
      return checkForUnknown(args, (evaluatedArgs) => {
        let value = 0;
        for (let i = 0; i < length; ++i) {
          value += evaluatedArgs[i];
        }
        return value;
      });
    }
    case Ops.Subtract: {
      return checkForUnknown(args, ([first, second]) => first - second);
    }
    case Ops.Clamp: {
      return checkForUnknown(args, ([value, min, max]) => {
        if (value < min) {
          return min;
        }
        if (value > max) {
          return max;
        }
        return value;
      });
    }
    case Ops.Mod: {
      return checkForUnknown(args, ([first, second]) => first % second);
    }
    case Ops.Pow: {
      return checkForUnknown(args, ([first, second]) =>
        Math.pow(first, second)
      );
    }
    case Ops.Abs: {
      return checkForUnknown(args, ([arg]) => Math.abs(arg));
    }
    case Ops.Floor: {
      return checkForUnknown(args, ([arg]) => Math.floor(arg));
    }
    case Ops.Ceil: {
      return checkForUnknown(args, ([arg]) => Math.ceil(arg));
    }
    case Ops.Round: {
      return checkForUnknown(args, ([arg]) => Math.round(arg));
    }
    case Ops.Sin: {
      return checkForUnknown(args, ([arg]) => Math.sin(arg));
    }
    case Ops.Cos: {
      return checkForUnknown(args, ([arg]) => Math.cos(arg));
    }
    case Ops.Atan: {
      if (length === 2) {
        return checkForUnknown(args, ([first, second]) =>
          Math.atan2(first, second)
        );
      }
      return checkForUnknown(args, ([arg]) => Math.atan(arg));
    }
    case Ops.Sqrt: {
      return checkForUnknown(args, ([arg]) => Math.sqrt(arg));
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
      if (condition === UNKNOWN_VALUE) {
        return UNKNOWN_VALUE;
      }
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
    if (value === UNKNOWN_VALUE) {
      return UNKNOWN_VALUE;
    }
    for (let i = 1; i < length; i += 2) {
      const matched = args[i](context);
      if (matched === UNKNOWN_VALUE) {
        return UNKNOWN_VALUE;
      }
      if (value === matched) {
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
  return checkForUnknown(args, (evaluatedArgs) => {
    const base = evaluatedArgs[0];
    const value = evaluatedArgs[1];

    let previousInput;
    let previousOutput;
    for (let i = 2; i < length; i += 2) {
      const input = evaluatedArgs[i];
      let output = evaluatedArgs[i + 1];
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
            output
          );
        }
        return interpolateNumber(
          base,
          value,
          previousInput,
          previousOutput,
          input,
          output
        );
      }
      previousInput = input;
      previousOutput = output;
    }
    return previousOutput;
  });
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
  return normalize(lchaToRgba(lcha));
}
