/**
 * @module ol/expr/cpu
 */

import {
  LiteralExpression,
  Ops,
  overlapsType,
  parse,
  typeName,
} from './expression.js';

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
 */

/**
 * @return {EvaluationContext} A new evaluation context.
 */
export function newEvaluationContext() {
  return {
    variables: {},
    properties: {},
    resolution: NaN,
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
    case Ops.Match: {
      return compileMatchExpression(expression, context);
    }
    default: {
      throw new Error(`Unsupported operator ${operator}`);
    }
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
  const nameExpression = expression.args[0];
  if (!(nameExpression instanceof LiteralExpression)) {
    throw new Error('Expected literal name');
  }
  const name = nameExpression.value;
  if (typeof name !== 'string') {
    throw new Error('Expected string name');
  }
  switch (expression.operator) {
    case Ops.Get: {
      return (context) => context.properties[name];
    }
    case Ops.Var: {
      return (context) => context.variables[name];
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
function compileMatchExpression(expression, context) {
  const length = expression.args.length;
  const args = new Array(length);
  for (let i = 0; i < length; ++i) {
    args[i] = compileExpression(expression.args[i], context);
  }
  return (context) => {
    const value = args[0](context);
    for (let i = 1; i < length; i += 2) {
      if (value === args[i](context)) {
        return args[i + 1](context);
      }
    }
    return args[length - 1](context);
  };
}
