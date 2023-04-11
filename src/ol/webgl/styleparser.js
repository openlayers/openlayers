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
 *
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
  const parsedWidth = expressionToGlsl(fragContext, width, ValueTypes.NUMBER);

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
 * @property {Object<string,import("./Helper").UniformValue>} uniforms Uniform definitions.
 * @property {Array<import("../renderer/webgl/PointsLayer").CustomAttribute>} attributes Attribute descriptions.
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
  fragContext.variables.forEach(function (varName) {
    const uniformName = uniformNameForVariable(varName);
    builder.addUniform(`float ${uniformName}`);
    uniforms[uniformName] = function () {
      if (!style.variables || style.variables[varName] === undefined) {
        throw new Error(
          `The following variable is missing from the style: ${varName}`
        );
      }
      let value = style.variables[varName];
      if (typeof value === 'string') {
        value = getStringNumberEquivalent(vertContext, value);
      }
      return value !== undefined ? value : -9999999; // to avoid matching with the first string literal
    };
  });

  // for each feature attribute used in the fragment shader, define a varying that will be used to pass data
  // from the vertex to the fragment shader, as well as an attribute in the vertex shader (if not already present)
  fragContext.attributes.forEach(function (attrName) {
    if (!vertContext.attributes.includes(attrName)) {
      vertContext.attributes.push(attrName);
    }
    builder.addVarying(`v_${attrName}`, 'float', `a_${attrName}`);
  });

  // for each feature attribute used in the vertex shader, define an attribute in the vertex shader.
  vertContext.attributes.forEach(function (attrName) {
    builder.addAttribute(`float a_${attrName}`);
  });

  return {
    builder: builder,
    hasSymbol,
    hasStroke,
    hasFill,
    attributes: vertContext.attributes.map(function (attributeName) {
      return {
        name: attributeName,
        callback: function (feature, props) {
          let value = props[attributeName];
          if (typeof value === 'string') {
            value = getStringNumberEquivalent(vertContext, value);
          }
          return value !== undefined ? value : -9999999; // to avoid matching with the first string literal
        },
      };
    }),
    uniforms: uniforms,
  };
}
