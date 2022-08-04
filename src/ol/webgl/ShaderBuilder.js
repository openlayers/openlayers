/**
 * Classes and utilities for generating shaders from literal style objects
 * @module ol/webgl/ShaderBuilder
 */

import {
  ValueTypes,
  expressionToGlsl,
  getStringNumberEquivalent,
  uniformNameForVariable,
} from '../style/expressions.js';

/**
 * @typedef {Object} VaryingDescription
 * @property {string} name Varying name, as will be declared in the header.
 * @property {string} type Varying type, either `float`, `vec2`, `vec4`...
 * @property {string} expression Expression which will be assigned to the varying in the vertex shader, and
 * passed on to the fragment shader.
 */

/**
 * @classdesc
 * This class implements a classic builder pattern for generating many different types of shaders.
 * Methods can be chained, e. g.:
 *
 * ```js
 * const shader = new ShaderBuilder()
 *   .addVarying('v_width', 'float', 'a_width')
 *   .addUniform('u_time')
 *   .setColorExpression('...')
 *   .setSizeExpression('...')
 *   .outputSymbolFragmentShader();
 * ```
 */
export class ShaderBuilder {
  constructor() {
    /**
     * Uniforms; these will be declared in the header (should include the type).
     * @type {Array<string>}
     * @private
     */
    this.uniforms = [];

    /**
     * Attributes; these will be declared in the header (should include the type).
     * @type {Array<string>}
     * @private
     */
    this.attributes = [];

    /**
     * Varyings with a name, a type and an expression.
     * @type {Array<VaryingDescription>}
     * @private
     */
    this.varyings = [];

    /**
     * @type {string}
     * @private
     */
    this.sizeExpression = 'vec2(1.0)';

    /**
     * @type {string}
     * @private
     */
    this.rotationExpression = '0.0';

    /**
     * @type {string}
     * @private
     */
    this.offsetExpression = 'vec2(0.0)';

    /**
     * @type {string}
     * @private
     */
    this.colorExpression = 'vec4(1.0)';

    /**
     * @type {string}
     * @private
     */
    this.texCoordExpression = 'vec4(0.0, 0.0, 1.0, 1.0)';

    /**
     * @type {string}
     * @private
     */
    this.discardExpression = 'false';

    /**
     * @type {boolean}
     * @private
     */
    this.rotateWithView = false;
  }

  /**
   * Adds a uniform accessible in both fragment and vertex shaders.
   * The given name should include a type, such as `sampler2D u_texture`.
   * @param {string} name Uniform name
   * @return {ShaderBuilder} the builder object
   */
  addUniform(name) {
    this.uniforms.push(name);
    return this;
  }

  /**
   * Adds an attribute accessible in the vertex shader, read from the geometry buffer.
   * The given name should include a type, such as `vec2 a_position`.
   * @param {string} name Attribute name
   * @return {ShaderBuilder} the builder object
   */
  addAttribute(name) {
    this.attributes.push(name);
    return this;
  }

  /**
   * Adds a varying defined in the vertex shader and accessible from the fragment shader.
   * The type and expression of the varying have to be specified separately.
   * @param {string} name Varying name
   * @param {'float'|'vec2'|'vec3'|'vec4'} type Type
   * @param {string} expression Expression used to assign a value to the varying.
   * @return {ShaderBuilder} the builder object
   */
  addVarying(name, type, expression) {
    this.varyings.push({
      name: name,
      type: type,
      expression: expression,
    });
    return this;
  }

  /**
   * Sets an expression to compute the size of the shape.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `vec2` value.
   * @param {string} expression Size expression
   * @return {ShaderBuilder} the builder object
   */
  setSizeExpression(expression) {
    this.sizeExpression = expression;
    return this;
  }

  /**
   * Sets an expression to compute the rotation of the shape.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `float` value in radians.
   * @param {string} expression Size expression
   * @return {ShaderBuilder} the builder object
   */
  setRotationExpression(expression) {
    this.rotationExpression = expression;
    return this;
  }

  /**
   * Sets an expression to compute the offset of the symbol from the point center.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `vec2` value.
   * Note: will only be used for point geometry shaders.
   * @param {string} expression Offset expression
   * @return {ShaderBuilder} the builder object
   */
  setSymbolOffsetExpression(expression) {
    this.offsetExpression = expression;
    return this;
  }

  /**
   * Sets an expression to compute the color of the shape.
   * This expression can use all the uniforms, varyings and attributes available
   * in the fragment shader, and should evaluate to a `vec4` value.
   * @param {string} expression Color expression
   * @return {ShaderBuilder} the builder object
   */
  setColorExpression(expression) {
    this.colorExpression = expression;
    return this;
  }

  /**
   * Sets an expression to compute the texture coordinates of the vertices.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `vec4` value.
   * @param {string} expression Texture coordinate expression
   * @return {ShaderBuilder} the builder object
   */
  setTextureCoordinateExpression(expression) {
    this.texCoordExpression = expression;
    return this;
  }

  /**
   * Sets an expression to determine whether a fragment (pixel) should be discarded,
   * i.e. not drawn at all.
   * This expression can use all the uniforms, varyings and attributes available
   * in the fragment shader, and should evaluate to a `bool` value (it will be
   * used in an `if` statement)
   * @param {string} expression Fragment discard expression
   * @return {ShaderBuilder} the builder object
   */
  setFragmentDiscardExpression(expression) {
    this.discardExpression = expression;
    return this;
  }

  /**
   * Sets whether the symbols should rotate with the view or stay aligned with the map.
   * Note: will only be used for point geometry shaders.
   * @param {boolean} rotateWithView Rotate with view
   * @return {ShaderBuilder} the builder object
   */
  setSymbolRotateWithView(rotateWithView) {
    this.rotateWithView = rotateWithView;
    return this;
  }

  /**
   * @return {string} Previously set size expression
   */
  getSizeExpression() {
    return this.sizeExpression;
  }

  /**
   * @return {string} Previously set symbol offset expression
   */
  getOffsetExpression() {
    return this.offsetExpression;
  }

  /**
   * @return {string} Previously set color expression
   */
  getColorExpression() {
    return this.colorExpression;
  }

  /**
   * @return {string} Previously set texture coordinate expression
   */
  getTextureCoordinateExpression() {
    return this.texCoordExpression;
  }

  /**
   * @return {string} Previously set fragment discard expression
   */
  getFragmentDiscardExpression() {
    return this.discardExpression;
  }

  /**
   * Generates a symbol vertex shader from the builder parameters,
   * intended to be used on point geometries.
   *
   * Three uniforms are hardcoded in all shaders: `u_projectionMatrix`, `u_offsetScaleMatrix`,
   * `u_offsetRotateMatrix`, `u_time`.
   *
   * The following attributes are hardcoded and expected to be present in the vertex buffers:
   * `vec2 a_position`, `float a_index` (being the index of the vertex in the quad, 0 to 3).
   *
   * The following varyings are hardcoded and gives the coordinate of the pixel both in the quad and on the texture:
   * `vec2 v_quadCoord`, `vec2 v_texCoord`
   *
   * @param {boolean} [forHitDetection] If true, the shader will be modified to include hit detection variables
   * (namely, hit color with encoded feature id).
   * @return {string} The full shader as a string.
   */
  getSymbolVertexShader(forHitDetection) {
    const offsetMatrix = this.rotateWithView
      ? 'u_offsetScaleMatrix * u_offsetRotateMatrix'
      : 'u_offsetScaleMatrix';

    let attributes = this.attributes;
    let varyings = this.varyings;

    if (forHitDetection) {
      attributes = attributes.concat('vec4 a_hitColor');
      varyings = varyings.concat({
        name: 'v_hitColor',
        type: 'vec4',
        expression: 'a_hitColor',
      });
    }

    return `precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
${this.uniforms
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
attribute vec2 a_position;
attribute float a_index;
${attributes
  .map(function (attribute) {
    return 'attribute ' + attribute + ';';
  })
  .join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${varyings
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
void main(void) {
  mat4 offsetMatrix = ${offsetMatrix};
  vec2 halfSize = ${this.sizeExpression} * 0.5;
  vec2 offset = ${this.offsetExpression};
  float angle = ${this.rotationExpression};
  float offsetX;
  float offsetY;
  if (a_index == 0.0) {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  } else if (a_index == 1.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y - halfSize.y) * sin(angle);
    offsetY = (offset.y - halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else if (a_index == 2.0) {
    offsetX = (offset.x + halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x + halfSize.x) * sin(angle);
  } else {
    offsetX = (offset.x - halfSize.x) * cos(angle) + (offset.y + halfSize.y) * sin(angle);
    offsetY = (offset.y + halfSize.y) * cos(angle) - (offset.x - halfSize.x) * sin(angle);
  }
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = ${this.texCoordExpression};
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
${varyings
  .map(function (varying) {
    return '  ' + varying.name + ' = ' + varying.expression + ';';
  })
  .join('\n')}
}`;
  }

  /**
   * Generates a symbol fragment shader from the builder parameters,
   * intended to be used on point geometries.
   *
   * Expects the following varyings to be transmitted by the vertex shader:
   * `vec2 v_quadCoord`, `vec2 v_texCoord`
   *
   * @param {boolean} [forHitDetection] If true, the shader will be modified to include hit detection variables
   * (namely, hit color with encoded feature id).
   * @return {string} The full shader as a string.
   */
  getSymbolFragmentShader(forHitDetection) {
    const hitDetectionBypass = forHitDetection
      ? '  if (gl_FragColor.a < 0.1) { discard; } gl_FragColor = v_hitColor;'
      : '';

    let varyings = this.varyings;

    if (forHitDetection) {
      varyings = varyings.concat({
        name: 'v_hitColor',
        type: 'vec4',
        expression: 'a_hitColor',
      });
    }

    return `precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
${this.uniforms
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${varyings
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
void main(void) {
  if (${this.discardExpression}) { discard; }
  gl_FragColor = ${this.colorExpression};
  gl_FragColor.rgb *= gl_FragColor.a;
${hitDetectionBypass}
}`;
  }
}

/**
 * @typedef {Object} StyleParseResult
 * @property {ShaderBuilder} builder Shader builder pre-configured according to a given style
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
  const symbStyle = style.symbol;
  const size = symbStyle.size !== undefined ? symbStyle.size : 1;
  const color = symbStyle.color || 'white';
  const texCoord = symbStyle.textureCoord || [0, 0, 1, 1];
  const offset = symbStyle.offset || [0, 0];
  const opacity = symbStyle.opacity !== undefined ? symbStyle.opacity : 1;
  const rotation = symbStyle.rotation !== undefined ? symbStyle.rotation : 0;

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
  const parsedColor = expressionToGlsl(fragContext, color, ValueTypes.COLOR);
  const parsedOpacity = expressionToGlsl(
    fragContext,
    opacity,
    ValueTypes.NUMBER
  );

  let opacityFilter = '1.0';
  const visibleSize = `vec2(${expressionToGlsl(
    fragContext,
    size,
    ValueTypes.NUMBER_ARRAY | ValueTypes.NUMBER
  )}).x`;
  switch (symbStyle.symbolType) {
    case 'square':
      break;
    case 'image':
      break;
    // taken from https://thebookofshaders.com/07/
    case 'circle':
      opacityFilter = `(1.0-smoothstep(1.-4./${visibleSize},1.,dot(v_quadCoord-.5,v_quadCoord-.5)*4.))`;
      break;
    case 'triangle':
      const st = '(v_quadCoord*2.-1.)';
      const a = `(atan(${st}.x,${st}.y))`;
      opacityFilter = `(1.0-smoothstep(.5-3./${visibleSize},.5,cos(floor(.5+${a}/2.094395102)*2.094395102-${a})*length(${st})))`;
      break;

    default:
      throw new Error('Unexpected symbol type: ' + symbStyle.symbolType);
  }

  const builder = new ShaderBuilder()
    .setSizeExpression(`vec2(${parsedSize})`)
    .setRotationExpression(parsedRotation)
    .setSymbolOffsetExpression(parsedOffset)
    .setTextureCoordinateExpression(parsedTexCoord)
    .setSymbolRotateWithView(!!symbStyle.rotateWithView)
    .setColorExpression(
      `vec4(${parsedColor}.rgb, ${parsedColor}.a * ${parsedOpacity} * ${opacityFilter})`
    );

  if (style.filter) {
    const parsedFilter = expressionToGlsl(
      fragContext,
      style.filter,
      ValueTypes.BOOLEAN
    );
    builder.setFragmentDiscardExpression(`!${parsedFilter}`);
  }

  /** @type {Object<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

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

  if (symbStyle.symbolType === 'image' && symbStyle.src) {
    const texture = new Image();
    texture.crossOrigin =
      symbStyle.crossOrigin === undefined ? 'anonymous' : symbStyle.crossOrigin;
    texture.src = symbStyle.src;
    builder
      .addUniform('sampler2D u_texture')
      .setColorExpression(
        builder.getColorExpression() + ' * texture2D(u_texture, v_texCoord)'
      );
    uniforms['u_texture'] = texture;
  }

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
