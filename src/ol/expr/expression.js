/**
 * @module ol/expr/expression
 */
import {ascending} from '../array.js';
import {fromString, isStringColor} from '../color.js';

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
 * @property {boolean} featureId The style uses the feature id.
 * @property {import("../style/literal").LiteralStyle} style The style being parsed
 */

/**
 * @return {ParsingContext} A new parsing context.
 */
export function newParsingContext() {
  return {
    variables: new Set(),
    properties: new Set(),
    featureId: false,
    style: {},
  };
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
      return new LiteralExpression(NumberType, encoded);
    }
    case 'string': {
      let type = StringType;
      if (isStringColor(encoded)) {
        type |= ColorType;
      }
      if (typeHint) {
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
  if (encoded.length === 3 || encoded.length === 4) {
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
  Case: 'case',
  In: 'in',
  Number: 'number',
  String: 'string',
  Array: 'array',
  Color: 'color',
  Id: 'id',
};

/**
 * @typedef {function(Array, ParsingContext, number):Expression} Parser
 * Third argument is a type hint
 */

/**
 * @type {Object<string, Parser>}
 */
const parsers = {
  [Ops.Get]: createParser(AnyType, withArgsCount(1, 1), withGetArgs),
  [Ops.Var]: createParser(AnyType, withArgsCount(1, 1), withVarArgs),
  [Ops.Id]: createParser(NumberType | StringType, withNoArgs, usesFeatureId),
  [Ops.Concat]: createParser(
    StringType,
    withArgsCount(2, Infinity),
    parseArgsOfType(AnyType)
  ),
  [Ops.GeometryType]: createParser(StringType, withNoArgs),
  [Ops.Resolution]: createParser(NumberType, withNoArgs),
  [Ops.Zoom]: createParser(NumberType, withNoArgs),
  [Ops.Time]: createParser(NumberType, withNoArgs),
  [Ops.Any]: createParser(
    BooleanType,
    withArgsCount(2, Infinity),
    parseArgsOfType(BooleanType)
  ),
  [Ops.All]: createParser(
    BooleanType,
    withArgsCount(2, Infinity),
    parseArgsOfType(BooleanType)
  ),
  [Ops.Not]: createParser(
    BooleanType,
    withArgsCount(1, 1),
    parseArgsOfType(BooleanType)
  ),
  [Ops.Equal]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType
  ),
  [Ops.NotEqual]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType
  ),
  [Ops.GreaterThan]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType
  ),
  [Ops.GreaterThanOrEqualTo]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType
  ),
  [Ops.LessThan]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType
  ),
  [Ops.LessThanOrEqualTo]: createParser(
    BooleanType,
    withArgsCount(2, 2),
    parseArgsOfType(AnyType),
    narrowArgsType
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
    narrowArgsType
  ),
  [Ops.Divide]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType)
  ),
  [Ops.Add]: createParser(
    NumberType,
    withArgsCount(2, Infinity),
    parseArgsOfType(NumberType)
  ),
  [Ops.Subtract]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType)
  ),
  [Ops.Clamp]: createParser(
    NumberType,
    withArgsCount(3, 3),
    parseArgsOfType(NumberType)
  ),
  [Ops.Mod]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType)
  ),
  [Ops.Pow]: createParser(
    NumberType,
    withArgsCount(2, 2),
    parseArgsOfType(NumberType)
  ),
  [Ops.Abs]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
  ),
  [Ops.Floor]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
  ),
  [Ops.Ceil]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
  ),
  [Ops.Round]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
  ),
  [Ops.Sin]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
  ),
  [Ops.Cos]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
  ),
  [Ops.Atan]: createParser(
    NumberType,
    withArgsCount(1, 2),
    parseArgsOfType(NumberType)
  ),
  [Ops.Sqrt]: createParser(
    NumberType,
    withArgsCount(1, 1),
    parseArgsOfType(NumberType)
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
    parseMatchArgs
  ),
  [Ops.Between]: createParser(
    BooleanType,
    withArgsCount(3, 3),
    parseArgsOfType(NumberType)
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
    parseInterpolateArgs
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
    parseCaseArgs
  ),
  [Ops.In]: createParser(BooleanType, withArgsCount(2, 2), parseInArgs),
  [Ops.Number]: createParser(
    NumberType,
    withArgsCount(1, Infinity),
    parseArgsOfType(AnyType)
  ),
  [Ops.String]: createParser(
    StringType,
    withArgsCount(1, Infinity),
    parseArgsOfType(AnyType)
  ),
  [Ops.Array]: createParser(
    NumberArrayType,
    withArgsCount(1, Infinity),
    parseArgsOfType(NumberType)
  ),
  [Ops.Color]: createParser(
    ColorType,
    withArgsCount(3, 4),
    parseArgsOfType(NumberType)
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
  return [arg];
}

/**
 * @type ArgValidator
 */
function withVarArgs(encoded, context) {
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
function usesFeatureId(encoded, context) {
  context.featureId = true;
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
          `Expected ${minArgs} argument${plural} for ${operation}, got ${argCount}`
        );
      }
    } else if (argCount < minArgs || argCount > maxArgs) {
      const range =
        maxArgs === Infinity
          ? `${minArgs} or more`
          : `${minArgs} to ${maxArgs}`;
      throw new Error(
        `Expected ${range} arguments for ${operation}, got ${argCount}`
      );
    }
  };
}

/**
 * @param {number} argType The argument type.
 * @return {ArgValidator} The argument validator
 */
function parseArgsOfType(argType) {
  return function (encoded, context, parsedArgs, typeHint) {
    const operation = encoded[0];
    const argCount = encoded.length - 1;
    /**
     * @type {Array<Expression>}
     */
    const args = new Array(argCount);
    for (let i = 0; i < argCount; ++i) {
      const expression = parse(encoded[i + 1], context, typeHint);
      if (!overlapsType(argType, expression.type)) {
        const gotType = typeName(argType);
        const expectedType = typeName(expression.type);
        throw new Error(
          `Unexpected type for argument ${i} of ${operation} operation` +
            `, got ${gotType} but expected ${expectedType}`
        );
      }
      args[i] = expression;
    }
    return args;
  };
}

/**
 * @type {ArgValidator}
 */
function narrowArgsType(encoded, context, parsedArgs, typeHint) {
  const operation = encoded[0];
  const argCount = encoded.length - 1;

  // first pass to determine a narrowed down type
  let sameType = typeHint !== undefined ? typeHint : AnyType;
  for (let i = 0; i < parsedArgs.length; ++i) {
    sameType &= parsedArgs[i].type;
  }

  if (sameType === NoneType) {
    throw new Error(
      `No common type could be found for arguments of ${operation} operation`
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
        argCount
      )} instead`
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
        argCount
      )} instead`
    );
  }
}

/**
 * @type ArgValidator
 */
function parseMatchArgs(encoded, context, typeHint) {
  const argsCount = encoded.length - 1;

  const input = parse(encoded[1], context);
  let inputType = input.type;
  const fallback = parse(encoded[encoded.length - 1], context);

  const args = new Array(argsCount - 2);
  for (let i = 0; i < argsCount - 2; i += 2) {
    const match = parse(encoded[i + 2], context);
    const output = parse(encoded[i + 3], context);
    inputType &= match.type;
    args[i] = match;
    args[i + 1] = output;
  }
  const expectedInputType = StringType | NumberType | BooleanType;
  if (!overlapsType(expectedInputType, inputType)) {
    throw new Error(
      `Expected an input of type ${typeName(
        expectedInputType
      )} for the interpolate operation` + `, got ${inputType} instead`
    );
  }

  return [input, ...args, fallback];
}

/**
 * @type ArgValidator
 */
function parseInterpolateArgs(encoded, context) {
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
            `, got ${JSON.stringify(interpolation)} instead`
        );
      }
      break;
    default:
      interpolation = null;
  }
  if (!interpolation) {
    throw new Error(
      `Invalid interpolation type: ${JSON.stringify(interpolationType)}`
    );
  }

  const parsedArgs = [
    parse(interpolation, context),
    ...encoded.slice(2).map((arg) => parse(arg, context)),
  ];

  // check input types
  const input = parsedArgs[1];
  if (!overlapsType(NumberType, input.type)) {
    throw new Error(
      `Expected an input of type number for the interpolate operation` +
        `, got ${typeName(input.type)} instead`
    );
  }
  for (let i = 2; i < parsedArgs.length; i += 2) {
    const input = parsedArgs[i];
    if (!overlapsType(NumberType, input.type)) {
      throw new Error(
        `Expected all stop input values in the interpolate operation to be of type number` +
          `, got ${typeName(input.type)} at position ${i} instead`
      );
    }
    const output = parsedArgs[i + 1];
    if (!overlapsType(NumberType | ColorType, output.type)) {
      throw new Error(
        `Expected all stop output values in the interpolate operation to be a number or color` +
          `, got ${typeName(output.type)} at position ${i + 1} instead`
      );
    }
    if (output instanceof LiteralExpression) {
      if (typeof output.value === 'string') {
        output.value = fromString(output.value);
        output.type = ColorType;
      }
    }
  }

  return parsedArgs;
}

/**
 * @type ArgValidator
 */
function parseCaseArgs(encoded, context) {
  const parsedArgs = encoded.slice(1).map((arg) => parse(arg, context));

  // check condition types
  for (let i = 0; i < parsedArgs.length - 1; i += 2) {
    if (!overlapsType(BooleanType, parsedArgs[i].type)) {
      throw new Error(
        `Expected all conditions in the case operation to be of type boolean` +
          `, got ${typeName(parsedArgs[i].type)} at position ${i} instead`
      );
    }
  }

  return encoded.slice(1).map((arg) => parse(arg, context));
}

/**
 * @type ArgValidator
 */
function parseInArgs(encoded, context) {
  return encoded.slice(1).map((arg) => parse(arg, context));
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
      actualType &= typeHint;
    }
    if (actualType === NoneType) {
      throw new Error(
        `No matching type was found for the following expression: ${JSON.stringify(
          encoded
        )}`
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
