/**
 * @module ol/expr/wgsl
 */
import {asArray} from '../color.js';
import {toSize} from '../size.js';
import {
  BooleanType,
  CallExpression,
  ColorType,
  newParsingContext,
  NumberArrayType,
  NumberType,
  Ops,
  parse,
  SizeType,
  StringType,
  typeName,
} from './expression.js';

/**
 * @typedef {import('./expression.js').ValueType} ValueType
 */
/**
 * @typedef {import('./expression.js').Expression} Expression
 */
/**
 * @typedef {import('./expression.js').LiteralExpression} LiteralExpression
 */

/**
 * @param {number} v Numerical value.
 * @return {string} WGSL literal.
 */
export function numberToWgsl(v) {
  const s = v.toString();
  return s.includes('.') ? s : s + '.0';
}

/**
 * @param {Array<number>} array Numbers.
 * @return {string} vecN constructor.
 */
export function arrayToWgsl(array) {
  if (array.length < 2 || array.length > 4) {
    throw new Error(
      '`arrayToWgsl` can only output `vec2`, `vec3` or `vec4` arrays.',
    );
  }
  return `vec${array.length}<f32>(${array.map(numberToWgsl).join(', ')})`;
}

/**
 * @param {string|import('../color.js').Color} color Color.
 * @return {string} vec4 WGSL.
 */
export function colorToWgsl(color) {
  const array = asArray(color);
  const alpha = array.length > 3 ? array[3] : 1;
  return arrayToWgsl([array[0] / 255, array[1] / 255, array[2] / 255, alpha]);
}

/**
 * @param {number|import('../size.js').Size} size Size.
 * @return {string} vec2 WGSL.
 */
export function sizeToWgsl(size) {
  return arrayToWgsl(toSize(size));
}

/** @type {Object<string, number>} */
const stringToFloatMap = {};
let stringToFloatCounter = 0;

/**
 * @param {string} string String.
 * @return {number} Number equivalent.
 */
export function getStringNumberEquivalent(string) {
  if (!(string in stringToFloatMap)) {
    stringToFloatMap[string] = stringToFloatCounter++;
  }
  return stringToFloatMap[string];
}

/**
 * @param {string} string String.
 * @return {string} WGSL number.
 */
export function stringToWgsl(string) {
  return numberToWgsl(getStringNumberEquivalent(string));
}

/**
 * @param {string} variableName Variable name.
 * @return {string} Uniform identifier.
 */
export function uniformNameForVariable(variableName) {
  return 'u_var_' + variableName;
}

/**
 * @typedef {Object} CompilationContext
 * @property {Map<string, ValueType>} variables Variables.
 * @property {Map<string, ValueType>} properties Properties.
 * @property {Object<string, string>} functions Helper functions.
 * @property {number} [bandCount] Band count.
 * @property {boolean} featureId Feature id used.
 * @property {boolean} geometryType Geometry type used.
 * @property {import('../style/flat.js').StyleVariables} [inputVariables] Style variables.
 */

/**
 * @param {import('../style/flat.js').StyleVariables} [inputVariables] Style variables.
 * @return {CompilationContext} Context.
 */
export function newCompilationContext(inputVariables) {
  return {
    variables: new Map(),
    properties: new Map(),
    functions: {},
    bandCount: 4,
    featureId: false,
    geometryType: false,
    inputVariables,
  };
}

/**
 * @param {function(Array<string>, CompilationContext): string} output Output.
 * @return {function(CompilationContext, import('./expression.js').CallExpression, number): string} Compiler.
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
 * @type {Object<string, function(CompilationContext, import('./expression.js').CallExpression, number): string>}
 */
const compilers = {
  [Ops.Get]: (context, expression) => {
    const firstArg = /** @type {LiteralExpression} */ (expression.args[0]);
    const propName = /** @type {string} */ (firstArg.value);
    return 'a_prop_' + propName;
  },
  [Ops.Id]: (context) => {
    context.featureId = true;
    return 'a_featureId';
  },
  [Ops.GeometryType]: (context) => {
    context.geometryType = true;
    return 'a_geometryType';
  },
  [Ops.Var]: (context, expression) => {
    const firstArg = /** @type {LiteralExpression} */ (expression.args[0]);
    const varName = /** @type {string} */ (firstArg.value);
    return `uniforms.${uniformNameForVariable(varName)}`;
  },
  [Ops.Has]: (context, expression) => {
    const firstArg = /** @type {LiteralExpression} */ (expression.args[0]);
    const propName = /** @type {string} */ (firstArg.value);
    return `(a_prop_${propName} != ${numberToWgsl(-9999999)})`;
  },
  [Ops.Resolution]: () => 'uniforms.resolution',
  [Ops.Zoom]: () => 'uniforms.zoom',
  [Ops.Time]: () => 'uniforms.time',
  [Ops.Any]: createCompiler((args) => `(${args.join(' || ')})`),
  [Ops.All]: createCompiler((args) => `(${args.join(' && ')})`),
  [Ops.Not]: createCompiler(([value]) => `(!${value})`),
  [Ops.Equal]: createCompiler(([a, b]) => `(${a} == ${b})`),
  [Ops.NotEqual]: createCompiler(([a, b]) => `(${a} != ${b})`),
  [Ops.GreaterThan]: createCompiler(([a, b]) => `(${a} > ${b})`),
  [Ops.GreaterThanOrEqualTo]: createCompiler(([a, b]) => `(${a} >= ${b})`),
  [Ops.LessThan]: createCompiler(([a, b]) => `(${a} < ${b})`),
  [Ops.LessThanOrEqualTo]: createCompiler(([a, b]) => `(${a} <= ${b})`),
  [Ops.Multiply]: createCompiler((args) => `(${args.join(' * ')})`),
  [Ops.Divide]: createCompiler(([a, b]) => `(${a} / ${b})`),
  [Ops.Add]: createCompiler((args) => `(${args.join(' + ')})`),
  [Ops.Subtract]: createCompiler(([a, b]) => `(${a} - ${b})`),
  [Ops.Clamp]: createCompiler(
    ([value, min, max]) => `clamp(${value}, ${min}, ${max})`,
  ),
  [Ops.Mod]: createCompiler(
    ([value, modulo]) => `(${value} - ${modulo} * floor(${value} / ${modulo}))`,
  ),
  [Ops.Pow]: createCompiler(([value, power]) => `pow(${value}, ${power})`),
  [Ops.Abs]: createCompiler(([value]) => `abs(${value})`),
  [Ops.Floor]: createCompiler(([value]) => `floor(${value})`),
  [Ops.Ceil]: createCompiler(([value]) => `ceil(${value})`),
  [Ops.Round]: createCompiler(([value]) => `floor(${value} + 0.5)`),
  [Ops.Sin]: createCompiler(([value]) => `sin(${value})`),
  [Ops.Cos]: createCompiler(([value]) => `cos(${value})`),
  [Ops.Atan]: createCompiler(([first, second]) =>
    second !== undefined ? `atan2(${first}, ${second})` : `atan(${first})`,
  ),
  [Ops.Sqrt]: createCompiler(([value]) => `sqrt(${value})`),
  [Ops.Match]: createCompiler((args) => {
    const input = args[0];
    let result = args[args.length - 1];
    for (let i = args.length - 3; i >= 1; i -= 2) {
      result = `select(${result}, ${args[i + 1]}, ${input} == ${args[i]})`;
    }
    return result;
  }),
  [Ops.Between]: createCompiler(
    ([value, min, max]) => `(${value} >= ${min} && ${value} <= ${max})`,
  ),
  [Ops.Interpolate]: createCompiler(([exponent, input, ...stops]) => {
    let result = '';
    for (let i = 0; i < stops.length - 2; i += 2) {
      const stop1 = stops[i];
      const output1 = result || stops[i + 1];
      const stop2 = stops[i + 2];
      const output2 = stops[i + 3];
      const ratio =
        exponent === numberToWgsl(1)
          ? `(${input} - ${stop1}) / (${stop2} - ${stop1})`
          : `(pow(${exponent}, (${input} - ${stop1})) - 1.0) / (pow(${exponent}, (${stop2} - ${stop1})) - 1.0)`;
      result = `mix(${output1}, ${output2}, clamp(${ratio}, 0.0, 1.0))`;
    }
    return result;
  }),
  [Ops.Case]: createCompiler((args) => {
    let result = args[args.length - 1];
    for (let i = args.length - 3; i >= 0; i -= 2) {
      result = `select(${result}, ${args[i + 1]}, ${args[i]})`;
    }
    return result;
  }),
  [Ops.Array]: createCompiler(
    (args) => `vec${args.length}<f32>(${args.join(', ')})`,
  ),
  [Ops.Color]: createCompiler((args) => {
    if (args.length === 1) {
      return `vec4<f32>(vec3<f32>(${args[0]} / 255.0), 1.0)`;
    }
    if (args.length === 2) {
      return `vec4<f32>(vec3<f32>(${args[0]} / 255.0), ${args[1]})`;
    }
    const rgb = args.slice(0, 3).map((c) => `${c} / 255.0`);
    if (args.length === 3) {
      return `vec4<f32>(${rgb.join(', ')}, 1.0)`;
    }
    return `vec4<f32>(${rgb.join(', ')}, ${args[3]})`;
  }),
  [Ops.Band]: createCompiler(([band, xOffset, yOffset], context) => {
    if (!context.functions.getBandValue) {
      const bandCount = context.bandCount || 4;
      let body = '';
      for (let i = 0; i < bandCount; i++) {
        const channel = ['r', 'g', 'b', 'a'][i % 4];
        body += `  if (band == ${numberToWgsl(i + 1)}) { return texel.${channel}; }\n`;
      }
      context.functions.getBandValue = `
fn getBandValue(texCoord: vec2<f32>, band: f32, xOffset: f32, yOffset: f32) -> f32 {
  let uv = texCoord + vec2<f32>(
    xOffset / uniforms.texturePixelWidth,
    yOffset / uniforms.texturePixelHeight
  );
  let texel = textureSample(tileTexture, tileSampler, uv);
${body}  return 0.0;
}
`;
    }
    return `getBandValue(in.texCoord, ${band}, ${xOffset ?? '0.0'}, ${yOffset ?? '0.0'})`;
  }),
  [Ops.Palette]: (context, expression) => {
    const colors = expression.args.slice(1);
    const compiled = colors.map((color) => compile(color, ColorType, context));
    const index = compile(expression.args[0], NumberType, context);
    const name = `ol_palette_${Object.keys(context.functions).length}`;
    const last = Math.max(compiled.length - 1, 0);
    let body = `fn ${name}(index: f32) -> vec4<f32> {\n`;
    body += `  let i = i32(clamp(floor(index + 0.5), 0.0, ${numberToWgsl(last)}));\n`;
    for (let i = 0; i < compiled.length; ++i) {
      body += `  if (i == ${i}) { return ${compiled[i]}; }\n`;
    }
    body += `  return ${compiled[0] || 'vec4<f32>(0.0)'};\n}\n`;
    context.functions[name] = body;
    return `${name}(${index})`;
  },
};

/**
 * @param {Expression} expression Expression.
 * @param {ValueType} returnType Type.
 * @param {CompilationContext} context Context.
 * @return {string} WGSL.
 */
function compile(expression, returnType, context) {
  if (expression instanceof CallExpression) {
    const compiler = compilers[expression.operator];
    if (compiler === undefined) {
      throw new Error(
        `No WGSL compiler for operator: ${JSON.stringify(expression.operator)}`,
      );
    }
    return compiler(context, expression, returnType);
  }

  if ((expression.type & NumberType) > 0) {
    return numberToWgsl(/** @type {number} */ (expression.value));
  }
  if ((expression.type & BooleanType) > 0) {
    return expression.value ? 'true' : 'false';
  }
  if ((expression.type & StringType) > 0) {
    return stringToWgsl(String(expression.value));
  }
  if ((expression.type & ColorType) > 0) {
    return colorToWgsl(/** @type {Array<number>|string} */ (expression.value));
  }
  if ((expression.type & NumberArrayType) > 0) {
    return arrayToWgsl(/** @type {Array<number>} */ (expression.value));
  }
  if ((expression.type & SizeType) > 0) {
    return sizeToWgsl(
      /** @type {number|import('../size.js').Size} */ (expression.value),
    );
  }
  throw new Error(
    `Unexpected expression ${expression.value} (expected type ${typeName(returnType)})`,
  );
}

/**
 * @param {import('./expression.js').EncodedExpression} encoded Encoded.
 * @param {number} type Expected type.
 * @param {import('./expression.js').ParsingContext} parsingContext Parsing context.
 * @param {CompilationContext} compilationContext Compilation context.
 * @return {string} WGSL.
 */
export function buildExpression(
  encoded,
  type,
  parsingContext,
  compilationContext,
) {
  const expression = parse(encoded, type, parsingContext);
  compilationContext.variables = new Map([
    ...compilationContext.variables,
    ...parsingContext.variables,
  ]);
  compilationContext.properties = new Map([
    ...compilationContext.properties,
    ...parsingContext.properties,
  ]);
  return compile(expression, type, compilationContext);
}

/**
 * @param {CompilationContext} compilationContext Context.
 * @param {import('./expression.js').EncodedExpression} value Encoded expression.
 * @param {number} [expectedType] Type.
 * @param {import('./expression.js').ParsingContext} [parsingContext] Parsing context.
 * @return {string} WGSL.
 */
export function expressionToWgsl(
  compilationContext,
  value,
  expectedType,
  parsingContext,
) {
  return buildExpression(
    value,
    expectedType ?? 0,
    parsingContext ?? newParsingContext(compilationContext.inputVariables),
    compilationContext,
  );
}

/**
 * @typedef {Object} TileStyle
 * @property {Object<string, string|number>} [variables] Style variables.
 * @property {import('./expression.js').EncodedExpression} [color] Color expression.
 * @property {import('./expression.js').EncodedExpression} [brightness] Brightness.
 * @property {import('./expression.js').EncodedExpression} [contrast] Contrast.
 * @property {import('./expression.js').EncodedExpression} [exposure] Exposure.
 * @property {import('./expression.js').EncodedExpression} [saturation] Saturation.
 * @property {import('./expression.js').EncodedExpression} [gamma] Gamma.
 */

/**
 * Build a tile fragment-shader color pipeline (color + adjustments).
 *
 * @param {TileStyle} [style] Style.
 * @param {number} [bandCount] Band count.
 * @return {{fragmentBody: string, functions: string, context: CompilationContext}} WGSL pieces.
 */
export function compileTileColorPipeline(style, bandCount = 4) {
  const context = newCompilationContext(style?.variables);
  context.bandCount = bandCount;
  const pipeline = [];
  if (style?.color !== undefined) {
    const color = buildExpression(
      style.color,
      ColorType,
      newParsingContext(style.variables),
      context,
    );
    pipeline.push(`color = ${color};`);
  }
  if (style?.contrast !== undefined) {
    const contrast = buildExpression(
      style.contrast,
      NumberType,
      newParsingContext(style.variables),
      context,
    );
    pipeline.push(
      `color = vec4<f32>(clamp((${contrast} + 1.0) * color.rgb - vec3<f32>(${contrast} / 2.0), vec3<f32>(0.0), vec3<f32>(1.0)), color.a);`,
    );
  }
  if (style?.exposure !== undefined) {
    const exposure = buildExpression(
      style.exposure,
      NumberType,
      newParsingContext(style.variables),
      context,
    );
    pipeline.push(
      `color = vec4<f32>(clamp((${exposure} + 1.0) * color.rgb, vec3<f32>(0.0), vec3<f32>(1.0)), color.a);`,
    );
  }
  if (style?.saturation !== undefined) {
    const saturation = buildExpression(
      style.saturation,
      NumberType,
      newParsingContext(style.variables),
      context,
    );
    pipeline.push(`{
      let saturation = ${saturation} + 1.0;
      let sr = (1.0 - saturation) * 0.2126;
      let sg = (1.0 - saturation) * 0.7152;
      let sb = (1.0 - saturation) * 0.0722;
      let saturationMatrix = mat3x3<f32>(
        sr + saturation, sr, sr,
        sg, sg + saturation, sg,
        sb, sb, sb + saturation
      );
      color = vec4<f32>(saturationMatrix * color.rgb, color.a);
    }`);
  }
  if (style?.gamma !== undefined) {
    const gamma = buildExpression(
      style.gamma,
      NumberType,
      newParsingContext(style.variables),
      context,
    );
    pipeline.push(
      `color = vec4<f32>(pow(color.rgb, vec3<f32>(1.0 / ${gamma})), color.a);`,
    );
  }
  if (style?.brightness !== undefined) {
    const brightness = buildExpression(
      style.brightness,
      NumberType,
      newParsingContext(style.variables),
      context,
    );
    pipeline.push(
      `color = vec4<f32>(clamp(color.rgb + vec3<f32>(${brightness}), vec3<f32>(0.0), vec3<f32>(1.0)), color.a);`,
    );
  }
  return {
    fragmentBody: pipeline.join('\n  '),
    functions: Object.values(context.functions).join('\n'),
    context,
  };
}
