/**
 * @module ol/expr/expression
 */

import {ascending} from '../array.js';

/**
 * @fileoverview This module includes types and functions for parsing array encoded expressions.
 * The result of parsing an encoded expression is one of the specific expression classes.
 * During parsing, information is added to the parsing context about the data accessed by the
 * expression.
 */

let numTypes = 0;
export const NoneType = 0;
export const BooleanType = 1 << numTypes++;
export const NumberType = 1 << numTypes++;
export const StringType = 1 << numTypes++;
export const ColorType = 1 << numTypes++;
export const NumberArrayType = 1 << numTypes++;
export const AnyType = Math.pow(2, numTypes) - 1;

const typeNames = {
  [BooleanType]: 'boolean',
  [NumberType]: 'number',
  [StringType]: 'string',
  [ColorType]: 'color',
  [NumberArrayType]: 'number[]',
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
 */

/**
 * @return {ParsingContext} A new parsing context.
 */
export function newParsingContext() {
  return {
    variables: new Set(),
    properties: new Set(),
  };
}

/**
 * @typedef {LiteralValue|Array} EncodedExpression
 */

/**
 * @param {EncodedExpression} encoded The encoded expression.
 * @param {ParsingContext} context The parsing context.
 * @return {Expression} The parsed expression result.
 */
export function parse(encoded, context) {
  switch (typeof encoded) {
    case 'boolean': {
      return new LiteralExpression(BooleanType, encoded);
    }
    case 'number': {
      return new LiteralExpression(NumberType, encoded);
    }
    case 'string': {
      return new LiteralExpression(StringType, encoded);
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
    return parseCallExpression(encoded, context);
  }

  for (const item of encoded) {
    if (typeof item !== 'number') {
      throw new Error('Expected an array of numbers');
    }
  }

  let type = NumberArrayType;
  if (encoded.length === 3 || encoded.length === 4) {
    type |= ColorType;
  }

  return new LiteralExpression(type, encoded);
}

/**
 * @type {Object<string, string>}
 */
export const Ops = {
  Number: 'number',
  String: 'string',
  Get: 'get',
  Var: 'var',
  Any: 'any',
  All: 'all',
  Not: '!',
  Resolution: 'resolution',
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
};

/**
 * @typedef {function(Array, ParsingContext):Expression} Parser
 */

/**
 * @type {Object<string, Parser>}
 */
const parsers = {
  [Ops.Number]: createParser(withArgs(1, Infinity, AnyType), NumberType),
  [Ops.String]: createParser(withArgs(1, Infinity, AnyType), StringType),
  [Ops.Get]: createParser(withGetArgs, AnyType),
  [Ops.Var]: createParser(withVarArgs, AnyType),
  [Ops.Resolution]: createParser(withNoArgs, NumberType),
  [Ops.Any]: createParser(withArgs(2, Infinity, BooleanType), BooleanType),
  [Ops.All]: createParser(withArgs(2, Infinity, BooleanType), BooleanType),
  [Ops.Not]: createParser(withArgs(1, 1, BooleanType), BooleanType),
  [Ops.Equal]: createParser(withArgs(2, 2, AnyType), BooleanType),
  [Ops.NotEqual]: createParser(withArgs(2, 2, AnyType), BooleanType),
  [Ops.GreaterThan]: createParser(withArgs(2, 2, AnyType), BooleanType),
  [Ops.GreaterThanOrEqualTo]: createParser(
    withArgs(2, 2, AnyType),
    BooleanType
  ),
  [Ops.LessThan]: createParser(withArgs(2, 2, AnyType), BooleanType),
  [Ops.LessThanOrEqualTo]: createParser(withArgs(2, 2, AnyType), BooleanType),
  [Ops.Multiply]: createParser(withArgs(2, Infinity, NumberType), NumberType),
  [Ops.Divide]: createParser(withArgs(2, 2, NumberType), NumberType),
  [Ops.Add]: createParser(withArgs(2, Infinity, NumberType), NumberType),
  [Ops.Subtract]: createParser(withArgs(2, 2, NumberType), NumberType),
  [Ops.Clamp]: createParser(withArgs(3, 3, NumberType), NumberType),
  [Ops.Mod]: createParser(withArgs(2, 2, NumberType), NumberType),
  [Ops.Pow]: createParser(withArgs(2, 2, NumberType), NumberType),
  [Ops.Abs]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Floor]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Ceil]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Round]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Sin]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Cos]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Atan]: createParser(withArgs(1, 2, NumberType), NumberType),
  [Ops.Sqrt]: createParser(withArgs(1, 1, NumberType), NumberType),
  [Ops.Match]: createParser(
    withArgs(4, Infinity, StringType | NumberType),
    AnyType
  ),
};

/**
 * @typedef {function(Array, ParsingContext):Array<Expression>} ArgValidator
 */

/**
 * @type ArgValidator
 */
function withGetArgs(encoded, context) {
  if (encoded.length !== 2) {
    throw new Error('Expected 1 argument for get operation');
  }
  const arg = parse(encoded[1], context);
  if (!(arg instanceof LiteralExpression)) {
    throw new Error('Expected a literal argument for get operation');
  }
  if (typeof arg.value !== 'string') {
    throw new Error('Expected a string argument for get operation');
  }
  context.properties.add(arg.value);
  return [arg];
}

/**
 * @type ArgValidator
 */
function withVarArgs(encoded, context) {
  if (encoded.length !== 2) {
    throw new Error('Expected 1 argument for var operation');
  }
  const arg = parse(encoded[1], context);
  if (!(arg instanceof LiteralExpression)) {
    throw new Error('Expected a literal argument for var operation');
  }
  if (typeof arg.value !== 'string') {
    throw new Error('Expected a string argument for get operation');
  }
  context.variables.add(arg.value);
  return [arg];
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
 * @param {number} argType The argument type.
 * @return {ArgValidator} The argument validator
 */
function withArgs(minArgs, maxArgs, argType) {
  return function (encoded, context) {
    const operation = encoded[0];
    const argCount = encoded.length - 1;
    if (minArgs === maxArgs) {
      if (argCount !== minArgs) {
        const plural = minArgs === 1 ? '' : 's';
        throw new Error(
          `Expected ${minArgs} argument${plural} for operation ${operation}, got ${argCount}`
        );
      }
    } else if (argCount < minArgs || argCount > maxArgs) {
      throw new Error(
        `Expected ${minArgs} to ${maxArgs} arguments for operation ${operation}, got ${argCount}`
      );
    }

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
            ` : got ${gotType} but expected ${expectedType}`
        );
      }
      args[i] = expression;
    }

    return args;
  };
}

/**
 * @param {ArgValidator} argValidator The argument validator.
 * @param {number} returnType The return type.
 * @return {Parser} The parser.
 */
function createParser(argValidator, returnType) {
  return function (encoded, context) {
    const operator = encoded[0];
    const args = argValidator(encoded, context);
    return new CallExpression(returnType, operator, ...args);
  };
}

/**
 * @param {Array} encoded The encoded expression.
 * @param {ParsingContext} context The parsing context.
 * @return {Expression} The parsed expression.
 */
function parseCallExpression(encoded, context) {
  const operator = encoded[0];

  const parser = parsers[operator];
  if (!parser) {
    throw new Error(`Unknown operator: ${operator}`);
  }
  return parser(encoded, context);
}
