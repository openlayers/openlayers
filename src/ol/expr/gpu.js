/**
 * @module ol/expr/gpu
 */
import PaletteTexture from '../webgl/PaletteTexture.js';
import {
  BooleanType,
  CallExpression,
  ColorType,
  NoneType,
  NumberArrayType,
  NumberType,
  Ops,
  StringType,
  isType,
  overlapsType,
  parse,
  typeName,
} from './expression.js';
import {Uniforms} from '../renderer/webgl/TileLayer.js';
import {asArray} from '../color.js';

/**
 * @param {string} operator Operator
 * @param {CompilationContext} context Compilation context
 * @return {string} A function name based on the operator, unique in the given context
 */
function computeOperatorFunctionName(operator, context) {
  return `operator_${operator}_${Object.keys(context.functions).length}`;
}

/**
 * Will return the number as a float with a dot separator, which is required by GLSL.
 * @param {number} v Numerical value.
 * @return {string} The value as string.
 */
export function numberToGlsl(v) {
  const s = v.toString();
  return s.includes('.') ? s : s + '.0';
}

/**
 * Will return the number array as a float with a dot separator, concatenated with ', '.
 * @param {Array<number>} array Numerical values array.
 * @return {string} The array as a vector, e. g.: `vec3(1.0, 2.0, 3.0)`.
 */
export function arrayToGlsl(array) {
  if (array.length < 2 || array.length > 4) {
    throw new Error(
      '`formatArray` can only output `vec2`, `vec3` or `vec4` arrays.'
    );
  }
  return `vec${array.length}(${array.map(numberToGlsl).join(', ')})`;
}

/**
 * Will normalize and converts to string a `vec4` color array compatible with GLSL.
 * @param {string|import("../color.js").Color} color Color either in string format or [r, g, b, a] array format,
 * with RGB components in the 0..255 range and the alpha component in the 0..1 range.
 * Note that the final array will always have 4 components.
 * @return {string} The color expressed in the `vec4(1.0, 1.0, 1.0, 1.0)` form.
 */
export function colorToGlsl(color) {
  const array = asArray(color);
  const alpha = array.length > 3 ? array[3] : 1;
  // all components are premultiplied with alpha value
  return arrayToGlsl([
    (array[0] / 255) * alpha,
    (array[1] / 255) * alpha,
    (array[2] / 255) * alpha,
    alpha,
  ]);
}

/** @type {Object<string, number>} */
const stringToFloatMap = {};
let stringToFloatCounter = 0;

/**
 * Returns a stable equivalent number for the string literal.
 * @param {string} string String literal value
 * @return {number} Number equivalent
 */
export function getStringNumberEquivalent(string) {
  if (!(string in stringToFloatMap)) {
    stringToFloatMap[string] = stringToFloatCounter++;
  }
  return stringToFloatMap[string];
}

/**
 * Returns a stable equivalent number for the string literal, for use in shaders. This number is then
 * converted to be a GLSL-compatible string.
 * Note: with a float precision of `mediump`, the amount of unique strings supported is 16,777,216
 * @param {string} string String literal value
 * @return {string} GLSL-compatible string containing a number
 */
export function stringToGlsl(string) {
  return numberToGlsl(getStringNumberEquivalent(string));
}

/**
 * Get the uniform name given a variable name.
 * @param {string} variableName The variable name.
 * @return {string} The uniform name.
 */
export function uniformNameForVariable(variableName) {
  return 'u_var_' + variableName;
}

/**
 * @typedef {import('./expression.js').ParsingContext} ParsingContext
 */
/**
 *
 * @typedef {import("./expression.js").Expression} Expression
 */
/**
 *
 * @typedef {import("./expression.js").LiteralExpression} LiteralExpression
 */

/**
 * @typedef {Object} CompilationContextProperty
 * @property {string} name Name
 * @property {number} type Resolved property type
 * @property {function(import("../Feature.js").FeatureLike): *} [evaluator] Function used for evaluating the value;
 */

/**
 * @typedef {Object} CompilationContextVariable
 * @property {string} name Name
 * @property {number} type Resolved variable type
 * @property {function(Object): *} [evaluator] Function used for evaluating the value; argument is the style variables object
 */

/**
 * @typedef {Object} CompilationContext
 * @property {boolean} [inFragmentShader] If false, means the expression output should be made for a vertex shader
 * @property {Object<string, CompilationContextProperty>} properties The values for properties used in 'get' expressions.
 * @property {Object<string, CompilationContextVariable>} variables The values for variables used in 'var' expressions.
 * @property {Object<string, string>} functions Lookup of functions used by the style.
 * @property {number} [bandCount] Number of bands per pixel.
 * @property {Array<PaletteTexture>} [paletteTextures] List of palettes used by the style.
 * @property {import("../style/webgl.js").WebGLStyle} style Literal style.
 */

/**
 * @return {CompilationContext} A new compilation context.
 */
export function newCompilationContext() {
  return {
    inFragmentShader: false,
    variables: {},
    properties: {},
    functions: {},
    bandCount: 0,
    style: {},
  };
}

const GET_BAND_VALUE_FUNC = 'getBandValue';

export const PALETTE_TEXTURE_ARRAY = 'u_paletteTextures';

/**
 * @typedef {string} CompiledExpression
 */

/**
 * @typedef {function(CompilationContext, CallExpression, number): string} Compiler
 * Third argument is the expected value types
 */

/**
 * @param {import('./expression.js').EncodedExpression} encoded The encoded expression.
 * @param {number} type The expected type.
 * @param {import('./expression.js').ParsingContext} parsingContext The parsing context.
 * @param {CompilationContext} compilationContext An existing compilation context
 * @return {CompiledExpression} The compiled expression.
 */
export function buildExpression(
  encoded,
  type,
  parsingContext,
  compilationContext
) {
  const expression = parse(encoded, parsingContext, type);
  if (isType(expression.type, NoneType)) {
    throw new Error(`No matching type was found`);
  }
  if (!overlapsType(type, expression.type)) {
    const expected = typeName(type);
    const actual = typeName(expression.type);
    throw new Error(
      `Expected expression to be of type ${expected}, got ${actual}`
    );
  }
  return compile(expression, type, compilationContext);
}

/**
 * @param {function(Array<CompiledExpression>, CompilationContext): string} output Function that takes in parsed arguments and returns a string
 * @return {function(CompilationContext, import("./expression.js").CallExpression, number): string} Compiler for the call expression
 */
function createCompiler(output) {
  return (context, expression, type) => {
    const length = expression.args.length;
    const args = new Array(length);
    for (let i = 0; i < length; ++i) {
      args[i] = compile(expression.args[i], type, context);
    }
    return output(args, context);
  };
}

/**
 * @type {Object<string, Compiler>}
 */
const compilers = {
  [Ops.Get]: (context, expression) => {
    const firstArg = /** @type {LiteralExpression} */ (expression.args[0]);
    const propName = /** @type {string} */ (firstArg.value);
    const isExisting = propName in context.properties;
    if (!isExisting) {
      context.properties[propName] = {
        name: propName,
        type: expression.type,
      };
    }
    const prefix = context.inFragmentShader ? 'v_prop_' : 'a_prop_';
    return prefix + propName;
  },
  [Ops.GeometryType]: (context, expression, type) => {
    const propName = 'geometryType';
    const computeType = (geometry) => {
      const type = geometry.getType();
      switch (type) {
        case 'Point':
        case 'LineString':
        case 'Polygon':
          return type;
        case 'MultiPoint':
        case 'MultiLineString':
        case 'MultiPolygon':
          return type.substring(5);
        case 'Circle':
          return 'Polygon';
        case 'GeometryCollection':
          return computeType(geometry.getGeometries()[0]);
        default:
      }
    };
    const isExisting = propName in context.properties;
    if (!isExisting) {
      context.properties[propName] = {
        name: propName,
        type: StringType,
        evaluator: (feature) => {
          return computeType(feature.getGeometry());
        },
      };
    }
    const prefix = context.inFragmentShader ? 'v_prop_' : 'a_prop_';
    return prefix + propName;
  },
  [Ops.Var]: (context, expression) => {
    const firstArg = /** @type {LiteralExpression} */ (expression.args[0]);
    const varName = /** @type {string} */ (firstArg.value);
    const isExisting = varName in context.variables;
    if (!isExisting) {
      context.variables[varName] = {
        name: varName,
        type: expression.type,
      };
    }
    return uniformNameForVariable(varName);
  },
  [Ops.Resolution]: () => 'u_resolution',
  [Ops.Zoom]: () => 'u_zoom',
  [Ops.Time]: () => 'u_time',
  [Ops.Any]: createCompiler((compiledArgs) => `(${compiledArgs.join(` || `)})`),
  [Ops.All]: createCompiler((compiledArgs) => `(${compiledArgs.join(` && `)})`),
  [Ops.Not]: createCompiler(([value]) => `(!${value})`),
  [Ops.Equal]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} == ${secondValue})`
  ),
  [Ops.NotEqual]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} != ${secondValue})`
  ),
  [Ops.GreaterThan]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} > ${secondValue})`
  ),
  [Ops.GreaterThanOrEqualTo]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} >= ${secondValue})`
  ),
  [Ops.LessThan]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} < ${secondValue})`
  ),
  [Ops.LessThanOrEqualTo]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} <= ${secondValue})`
  ),
  [Ops.Multiply]: createCompiler(
    (compiledArgs) => `(${compiledArgs.join(' * ')})`
  ),
  [Ops.Divide]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} / ${secondValue})`
  ),
  [Ops.Add]: createCompiler((compiledArgs) => `(${compiledArgs.join(' + ')})`),
  [Ops.Subtract]: createCompiler(
    ([firstValue, secondValue]) => `(${firstValue} - ${secondValue})`
  ),
  [Ops.Clamp]: createCompiler(
    ([value, min, max]) => `clamp(${value}, ${min}, ${max})`
  ),
  [Ops.Mod]: createCompiler(([value, modulo]) => `mod(${value}, ${modulo})`),
  [Ops.Pow]: createCompiler(([value, power]) => `pow(${value}, ${power})`),
  [Ops.Abs]: createCompiler(([value]) => `abs(${value})`),
  [Ops.Floor]: createCompiler(([value]) => `floor(${value})`),
  [Ops.Ceil]: createCompiler(([value]) => `ceil(${value})`),
  [Ops.Round]: createCompiler(([value]) => `floor(${value} + 0.5)`),
  [Ops.Sin]: createCompiler(([value]) => `sin(${value})`),
  [Ops.Cos]: createCompiler(([value]) => `cos(${value})`),
  [Ops.Atan]: createCompiler(([firstValue, secondValue]) => {
    return secondValue !== undefined
      ? `atan(${firstValue}, ${secondValue})`
      : `atan(${firstValue})`;
  }),
  [Ops.Sqrt]: createCompiler(([value]) => `sqrt(${value})`),
  [Ops.Match]: createCompiler((compiledArgs) => {
    const input = compiledArgs[0];
    const fallback = compiledArgs[compiledArgs.length - 1];
    let result = null;
    for (let i = compiledArgs.length - 3; i >= 1; i -= 2) {
      const match = compiledArgs[i];
      const output = compiledArgs[i + 1];
      result = `(${input} == ${match} ? ${output} : ${result || fallback})`;
    }
    return result;
  }),
  [Ops.Between]: createCompiler(
    ([value, min, max]) => `(${value} >= ${min} && ${value} <= ${max})`
  ),
  [Ops.Interpolate]: createCompiler(([exponent, input, ...compiledArgs]) => {
    let result = '';
    for (let i = 0; i < compiledArgs.length - 2; i += 2) {
      const stop1 = compiledArgs[i];
      const output1 = result || compiledArgs[i + 1];
      const stop2 = compiledArgs[i + 2];
      const output2 = compiledArgs[i + 3];
      let ratio;
      if (exponent === numberToGlsl(1)) {
        ratio = `(${input} - ${stop1}) / (${stop2} - ${stop1})`;
      } else {
        ratio = `(pow(${exponent}, (${input} - ${stop1})) - 1.0) / (pow(${exponent}, (${stop2} - ${stop1})) - 1.0)`;
      }
      result = `mix(${output1}, ${output2}, clamp(${ratio}, 0.0, 1.0))`;
    }
    return result;
  }),
  [Ops.Case]: createCompiler((compiledArgs) => {
    const fallback = compiledArgs[compiledArgs.length - 1];
    let result = null;
    for (let i = compiledArgs.length - 3; i >= 0; i -= 2) {
      const condition = compiledArgs[i];
      const output = compiledArgs[i + 1];
      result = `(${condition} ? ${output} : ${result || fallback})`;
    }
    return result;
  }),
  [Ops.In]: createCompiler(([needle, ...haystack], context) => {
    const funcName = computeOperatorFunctionName('in', context);
    const tests = [];
    for (let i = 0; i < haystack.length; i += 1) {
      tests.push(`  if (inputValue == ${haystack[i]}) { return true; }`);
    }
    context.functions[funcName] = `bool ${funcName}(float inputValue) {
${tests.join('\n')}
  return false;
}`;
    return `${funcName}(${needle})`;
  }),
  [Ops.Array]: createCompiler(
    (args) => `vec${args.length}(${args.join(', ')})`
  ),
  [Ops.Color]: createCompiler((compiledArgs) => {
    const rgb = compiledArgs.slice(0, 3).map((color) => `${color} / 255.0`);
    if (compiledArgs.length === 3) {
      return `vec4(${rgb.join(', ')}, 1.0)`;
    }
    const alpha = compiledArgs[3];
    return `(${alpha} * vec4(${rgb.join(', ')}, 1.0))`;
  }),
  [Ops.Band]: createCompiler(([band, xOffset, yOffset], context) => {
    if (!(GET_BAND_VALUE_FUNC in context.functions)) {
      let ifBlocks = '';
      const bandCount = context.bandCount || 1;
      for (let i = 0; i < bandCount; i++) {
        const colorIndex = Math.floor(i / 4);
        let bandIndex = i % 4;
        if (i === bandCount - 1 && bandIndex === 1) {
          // LUMINANCE_ALPHA - band 1 assigned to rgb and band 2 assigned to alpha
          bandIndex = 3;
        }
        const textureName = `${Uniforms.TILE_TEXTURE_ARRAY}[${colorIndex}]`;
        ifBlocks += `  if (band == ${i + 1}.0) {
    return texture2D(${textureName}, v_textureCoord + vec2(dx, dy))[${bandIndex}];
  }
`;
      }

      context.functions[
        GET_BAND_VALUE_FUNC
      ] = `float getBandValue(float band, float xOffset, float yOffset) {
  float dx = xOffset / ${Uniforms.TEXTURE_PIXEL_WIDTH};
  float dy = yOffset / ${Uniforms.TEXTURE_PIXEL_HEIGHT};
${ifBlocks}
}`;
    }

    return `${GET_BAND_VALUE_FUNC}(${band}, ${xOffset ?? '0.0'}, ${
      yOffset ?? '0.0'
    })`;
  }),
  [Ops.Palette]: (context, expression) => {
    const [index, ...colors] = expression.args;
    const numColors = colors.length;
    const palette = new Uint8Array(numColors * 4);
    for (let i = 0; i < colors.length; i++) {
      const parsedValue = /** @type {string | Array<number>} */ (
        /** @type {LiteralExpression} */ (colors[i]).value
      );
      const color = asArray(parsedValue);
      const offset = i * 4;
      palette[offset] = color[0];
      palette[offset + 1] = color[1];
      palette[offset + 2] = color[2];
      palette[offset + 3] = color[3] * 255;
    }
    if (!context.paletteTextures) {
      context.paletteTextures = [];
    }
    const paletteName = `${PALETTE_TEXTURE_ARRAY}[${context.paletteTextures.length}]`;
    const paletteTexture = new PaletteTexture(paletteName, palette);
    context.paletteTextures.push(paletteTexture);
    const compiledIndex = compile(index, NumberType, context);
    return `texture2D(${paletteName}, vec2((${compiledIndex} + 0.5) / ${numColors}.0, 0.5))`;
  },
  // TODO: unimplemented
  // Ops.Number
  // Ops.String
  // Ops.Concat
};

/**
 * @param {Expression} expression The expression.
 * @param {number} returnType The expected return type.
 * @param {CompilationContext} context The compilation context.
 * @return {CompiledExpression} The compiled expression
 */
function compile(expression, returnType, context) {
  // operator
  if (expression instanceof CallExpression) {
    const compiler = compilers[expression.operator];
    if (compiler === undefined) {
      throw new Error(
        `No compiler defined for this operator: ${JSON.stringify(
          expression.operator
        )}`
      );
    }
    return compiler(context, expression, returnType);
  }

  if ((expression.type & NumberType) > 0) {
    return numberToGlsl(/** @type {number} */ (expression.value));
  }

  if ((expression.type & BooleanType) > 0) {
    return expression.value.toString();
  }

  if ((expression.type & StringType) > 0) {
    return stringToGlsl(expression.value.toString());
  }

  if ((expression.type & ColorType) > 0) {
    return colorToGlsl(
      /** @type {Array<number> | string} */ (expression.value)
    );
  }

  if ((expression.type & NumberArrayType) > 0) {
    return arrayToGlsl(/** @type {Array<number>} */ (expression.value));
  }

  throw new Error(
    `Unexpected expression ${expression.value} (expected type ${typeName(
      returnType
    )})`
  );
}
