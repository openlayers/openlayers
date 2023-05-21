/**
 * Utilities for parsing literal style objects
 * @module ol/webgl/styleparser
 */
import {ShaderBuilder} from './ShaderBuilder.js';
import {
  ValueTypes,
  expressionToGlsl,
  getStringNumberEquivalent,
  uniformNameForVariable,
} from '../style/expressions.js';
import {asArray} from '../color.js';

/**
 * @param {import('../style/literal.js').SymbolType} type Symbol type
 * @param {string} sizeExpressionGlsl Size expression
 * @return {string} The GLSL opacity function
 */
export function getSymbolOpacityGlslFunction(type, sizeExpressionGlsl) {
  switch (type) {
    case 'square':
    case 'image':
      return '1.0';
    // taken from https://thebookofshaders.com/07/
    case 'circle':
      return `(1.0-smoothstep(1.-4./${sizeExpressionGlsl},1.,dot(v_quadCoord-.5,v_quadCoord-.5)*4.))`;
    case 'triangle':
      const st = '(v_quadCoord*2.-1.)';
      const a = `(atan(${st}.x,${st}.y))`;
      return `(1.0-smoothstep(.5-3./${sizeExpressionGlsl},.5,cos(floor(.5+${a}/2.094395102)*2.094395102-${a})*length(${st})))`;
    default:
      throw new Error(`Unexpected symbol type: ${type}`);
  }
}

/**
 * Packs all components of a color into a two-floats array
 * @param {import("../color.js").Color|string} color Color as array of numbers or string
 * @return {Array<number>} Vec2 array containing the color in compressed form
 */
export function packColor(color) {
  const array = asArray(color);
  const r = array[0] * 256;
  const g = array[1];
  const b = array[2] * 256;
  const a = Math.round(array[3] * 255);
  return [r + g, b + a];
}

const UNPACK_COLOR_FN = `vec4 unpackColor(vec2 packedColor) {
  return fract(packedColor[1] / 256.0) * vec4(
    fract(floor(packedColor[0] / 256.0) / 256.0),
    fract(packedColor[0] / 256.0),
    fract(floor(packedColor[1] / 256.0) / 256.0),
    1.0
  );
}`;

/**
 * @param {ValueTypes} type Value type
 * @return {1|2|3|4} The amount of components for this value
 */
function getGlslSizeFromType(type) {
  if (type === ValueTypes.COLOR) {
    return 2;
  }
  if (type === ValueTypes.NUMBER_ARRAY) {
    return 4;
  }
  return 1;
}

/**
 * @param {ValueTypes} type Value type
 * @return {'float'|'vec2'|'vec3'|'vec4'} The corresponding GLSL type for this value
 */
function getGlslTypeFromType(type) {
  const size = getGlslSizeFromType(type);
  if (size > 1) {
    return /** @type {'vec2'|'vec3'|'vec4'} */ (`vec${size}`);
  }
  return 'float';
}

/**
 * @param {import("../style/literal").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 * @return {boolean} Whether a symbol style was found
 */
function parseSymbolProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  if (!('symbol' in style)) {
    return false;
  }

  const symbStyle = style.symbol;
  const size = symbStyle.size !== undefined ? symbStyle.size : 1;
  const color = symbStyle.color || 'white';
  const texCoord = symbStyle.textureCoord || [0, 0, 1, 1];
  const offset = symbStyle.offset || [0, 0];
  const opacity = symbStyle.opacity !== undefined ? symbStyle.opacity : 1;
  const rotation = symbStyle.rotation !== undefined ? symbStyle.rotation : 0;

  const parsedSize = expressionToGlsl(
    vertContext,
    size,
    ValueTypes.NUMBER_ARRAY | ValueTypes.NUMBER
  );
  const parsedOffset = expressionToGlsl(
    vertContext,
    offset,
    ValueTypes.NUMBER_ARRAY
  );
  const parsedTexCoord = expressionToGlsl(
    vertContext,
    texCoord,
    ValueTypes.NUMBER_ARRAY
  );
  const parsedRotation = expressionToGlsl(
    vertContext,
    rotation,
    ValueTypes.NUMBER
  );

  const parsedColor = expressionToGlsl(fragContext, color, ValueTypes.COLOR);
  const parsedOpacity = expressionToGlsl(
    fragContext,
    opacity,
    ValueTypes.NUMBER
  );

  const visibleSize = `vec2(${expressionToGlsl(
    fragContext,
    size,
    ValueTypes.NUMBER_ARRAY | ValueTypes.NUMBER
  )}).x`;
  const opacityFilter = getSymbolOpacityGlslFunction(
    symbStyle.symbolType,
    visibleSize
  );

  const colorExpression = `vec4(${parsedColor}.rgb, ${parsedColor}.a * ${parsedOpacity} * ${opacityFilter})`;

  builder
    .setSymbolSizeExpression(`vec2(${parsedSize})`)
    .setSymbolRotationExpression(parsedRotation)
    .setSymbolOffsetExpression(parsedOffset)
    .setTextureCoordinateExpression(parsedTexCoord)
    .setSymbolRotateWithView(!!symbStyle.rotateWithView)
    .setSymbolColorExpression(colorExpression);

  if (symbStyle.symbolType === 'image' && symbStyle.src) {
    const texture = new Image();
    texture.crossOrigin =
      symbStyle.crossOrigin === undefined ? 'anonymous' : symbStyle.crossOrigin;
    texture.src = symbStyle.src;
    builder
      .addUniform('sampler2D u_texture')
      .setSymbolColorExpression(
        `${colorExpression} * texture2D(u_texture, v_texCoord)`
      );
    uniforms['u_texture'] = texture;
  }

  return true;
}

/**
 * @param {import("../style/literal").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 * @return {boolean} Whether a stroke style was found
 */
function parseStrokeProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  // do not apply a stroke style if these properties are missing
  if (!('stroke-color' in style) && !('stroke-width' in style)) {
    return false;
  }

  const color = style['stroke-color'] || 'white';
  const width = style['stroke-width'] || 1;
  const parsedColor = expressionToGlsl(fragContext, color, ValueTypes.COLOR);
  const parsedWidth = expressionToGlsl(vertContext, width, ValueTypes.NUMBER);

  builder
    .setStrokeColorExpression(parsedColor)
    .setStrokeWidthExpression(parsedWidth);

  return true;
}

/**
 * @param {import("../style/literal").LiteralStyle} style Style
 * @param {ShaderBuilder} builder Shader Builder
 * @param {Object<string,import("../webgl/Helper").UniformValue>} uniforms Uniforms
 * @param {import("../style/expressions.js").ParsingContext} vertContext Vertex shader parsing context
 * @param {import("../style/expressions.js").ParsingContext} fragContext Fragment shader parsing context
 * @return {boolean} Whether a fill style was found
 */
function parseFillProperties(
  style,
  builder,
  uniforms,
  vertContext,
  fragContext
) {
  // do not apply a fill style if these properties are missing
  if (!('fill-color' in style)) {
    return false;
  }

  const color = style['fill-color'] || 'rgba(255, 255, 255, 0.3)';
  const parsedColor = expressionToGlsl(fragContext, color, ValueTypes.COLOR);

  builder.setFillColorExpression(parsedColor);

  return true;
}

/**
 * @typedef {Object} StyleParseResult
 * @property {ShaderBuilder} builder Shader builder pre-configured according to a given style
 * @property {boolean} hasSymbol Has a symbol style defined
 * @property {boolean} hasStroke Has a stroke style defined
 * @property {boolean} hasFill Has a fill style defined
 * @property {import("../render/webgl/VectorStyleRenderer.js").UniformDefinitions} uniforms Uniform definitions
 * @property {import("../render/webgl/VectorStyleRenderer.js").AttributeDefinitions} attributes Attribute definitions
 */

/**
 * Parses a {@link import("../style/literal").LiteralStyle} object and returns a {@link ShaderBuilder}
 * object that has been configured according to the given style, as well as `attributes` and `uniforms`
 * arrays to be fed to the `WebGLPointsRenderer` class.
 *
 * Also returns `uniforms` and `attributes` properties as expected by the
 * {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 * @param {import("../style/literal").LiteralStyle} style Literal style.
 * @return {StyleParseResult} Result containing shader params, attributes and uniforms.
 */
export function parseLiteralStyle(style) {
  /**
   * @type {import("../style/expressions.js").ParsingContext}
   */
  const vertContext = {
    inFragmentShader: false,
    variables: [],
    attributes: [],
    stringLiteralsMap: {},
    functions: {},
    style: style,
  };

  /**
   * @type {import("../style/expressions.js").ParsingContext}
   */
  const fragContext = {
    inFragmentShader: true,
    variables: vertContext.variables,
    attributes: [],
    stringLiteralsMap: vertContext.stringLiteralsMap,
    functions: {},
    style: style,
  };

  const builder = new ShaderBuilder();

  /** @type {Object<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  const hasSymbol = parseSymbolProperties(
    style,
    builder,
    uniforms,
    vertContext,
    fragContext
  );
  const hasStroke = parseStrokeProperties(
    style,
    builder,
    uniforms,
    vertContext,
    fragContext
  );
  const hasFill = parseFillProperties(
    style,
    builder,
    uniforms,
    vertContext,
    fragContext
  );

  if (style.filter) {
    const parsedFilter = expressionToGlsl(
      fragContext,
      style.filter,
      ValueTypes.BOOLEAN
    );
    builder.setFragmentDiscardExpression(`!${parsedFilter}`);
  }

  // define one uniform per variable
  fragContext.variables.forEach(function (variable) {
    const uniformName = uniformNameForVariable(variable.name);
    builder.addUniform(`${getGlslTypeFromType(variable.type)} ${uniformName}`);

    let callback;
    if (variable.type === ValueTypes.STRING) {
      callback = () =>
        getStringNumberEquivalent(
          vertContext,
          /** @type {string} */ (style.variables[variable.name])
        );
    } else if (variable.type === ValueTypes.COLOR) {
      callback = () =>
        packColor([
          ...asArray(
            /** @type {string|Array<number>} */ (
              style.variables[variable.name]
            ) || '#eee'
          ),
        ]);
    } else if (variable.type === ValueTypes.BOOLEAN) {
      callback = () =>
        /** @type {boolean} */ (style.variables[variable.name]) ? 1.0 : 0.0;
    } else {
      callback = () => /** @type {number} */ (style.variables[variable.name]);
    }
    uniforms[uniformName] = callback;
  });

  // for each feature attribute used in the fragment shader, define a varying that will be used to pass data
  // from the vertex to the fragment shader, as well as an attribute in the vertex shader (if not already present)
  fragContext.attributes.forEach(function (attribute) {
    if (!vertContext.attributes.find((a) => a.name === attribute.name)) {
      vertContext.attributes.push(attribute);
    }
    let type = getGlslTypeFromType(attribute.type);
    let expression = `a_${attribute.name}`;
    if (attribute.type === ValueTypes.COLOR) {
      type = 'vec4';
      expression = `unpackColor(${expression})`;
      builder.addVertexShaderFunction(UNPACK_COLOR_FN);
    }
    builder.addVarying(`v_${attribute.name}`, type, expression);
  });

  // for each feature attribute used in the vertex shader, define an attribute in the vertex shader.
  vertContext.attributes.forEach(function (attribute) {
    builder.addAttribute(
      `${getGlslTypeFromType(attribute.type)} a_${attribute.name}`
    );
  });

  const attributes = vertContext.attributes.map(function (attribute) {
    let callback;
    if (attribute.type === ValueTypes.STRING) {
      callback = (feature) =>
        getStringNumberEquivalent(vertContext, feature.get(attribute.name));
    } else if (attribute.type === ValueTypes.COLOR) {
      callback = (feature) =>
        packColor([...asArray(feature.get(attribute.name) || '#eee')]);
    } else if (attribute.type === ValueTypes.BOOLEAN) {
      callback = (feature) => (feature.get(attribute.name) ? 1.0 : 0.0);
    } else {
      callback = (feature) => feature.get(attribute.name);
    }

    return {
      name: attribute.name,
      size: getGlslSizeFromType(attribute.type),
      callback,
    };
  });

  return {
    builder: builder,
    hasSymbol,
    hasStroke,
    hasFill,
    attributes: attributes.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.name]: {callback: curr.callback, size: curr.size},
      }),
      {}
    ),
    uniforms: uniforms,
  };
}
