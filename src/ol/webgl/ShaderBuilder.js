/**
 * Classes and utilities for generating shaders from literal style objects
 * @module ol/webgl/ShaderBuilder
 */

import {asArray} from '../color.js';

/**
 * Will return the number as a float with a dot separator, which is required by GLSL.
 * @param {number} v Numerical value.
 * @returns {string} The value as string.
 */
export function formatNumber(v) {
  const s = v.toString();
  return s.indexOf('.') === -1 ? s + '.0' : s;
}

/**
 * Will return the number array as a float with a dot separator, concatenated with ', '.
 * @param {Array<number>} array Numerical values array.
 * @returns {string} The array as string, e. g.: `1.0, 2.0, 3.0`.
 */
export function formatArray(array) {
  return array.map(formatNumber).join(', ');
}

/**
 * Will normalize and converts to string a color array compatible with GLSL.
 * @param {Array<number>} colorArray Color in [r, g, b, a] array form, with RGB components in the
 * 0..255 range and the alpha component in the 0..1 range. Note that if the A component is
 * missing, only 3 values will be output.
 * @returns {string} The color components concatenated in `1.0, 1.0, 1.0, 1.0` form.
 */
export function formatColor(colorArray) {
  return colorArray.map(function(c, i) {
    return i < 3 ? c / 255 : c;
  }).map(formatNumber).join(', ');
}

/**
 * Base type for values fed to operators; can be a number literal or the output of another operator
 * @typedef {Array<*>|number} OperatorValue
 */

/**
 * Parses the provided expressions and produces a GLSL-compatible assignment string, such as:
 * `['add', ['*', ['get', 'size'], 0.001], 12] => '(a_size * (0.001)) + (12.0)'
 *
 * The following operators can be used:
 * * `['get', 'attributeName']` fetches a feature attribute (it will be prefixed by `a_` in the shader)
 * * `['*', value1, value1]` multiplies value1 by value2
 * * `['+', value1, value1]` adds value1 and value2
 * * `['clamp', value1, value2, value3]` clamps value1 between values2 and value3
 * * `['stretch', value1, value2, value3, value4, value5]` maps value1 from [value2, value3] range to
 *   [value4, value5] range, clamping values along the way
 *
 * Values can either be literals (numbers) or another operator, as they will be evaluated recursively.
 *
 * Also takes in an array where new attributes will be pushed, so that the user of the `parse` function
 * knows which attributes are expected to be available at evaluation time.
 *
 * A prefix must be specified so that the attributes can either be written as `a_name` or `v_name` in
 * the final assignment string.
 *
 * @param {OperatorValue} value Either literal or an operator.
 * @param {Array<string>} attributes Array containing the attribute names **without a prefix**;
 * it passed along recursively
 * @param {string} attributePrefix Prefix added to attribute names in the final output (typically `a_` or `v_`).
 * @returns {string} Assignment string.
 */
export function parse(value, attributes, attributePrefix) {
  const v = value;
  function p(value) {
    return parse(value, attributes, attributePrefix);
  }
  if (Array.isArray(v)) {
    switch (v[0]) {
      case 'get':
        if (attributes.indexOf(v[1]) === -1) {
          attributes.push(v[1]);
        }
        return attributePrefix + v[1];
      case '*': return `(${p(v[1])} * ${p(v[2])})`;
      case '+': return `(${p(v[1])} + ${p(v[2])})`;
      case 'clamp': return `clamp(${p(v[1])}, ${p(v[2])}, ${p(v[3])})`;
      case 'stretch': return `(clamp(${p(v[1])}, ${p(v[2])}, ${p(v[3])}) * ((${p(v[5])} - ${p(v[4])}) / (${p(v[3])} - ${p(v[2])})) + ${p(v[4])})`;
      default: throw new Error('Unrecognized literal style expression: ' + JSON.stringify(value));
    }
  } else if (typeof value === 'number') {
    return formatNumber(value);
  } else {
    throw new Error('Invalid value type in expression: ' + JSON.stringify(value));
  }
}

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
      expression: expression
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
   * @returns {string} Previously set size expression
   */
  getSizeExpression() {
    return this.sizeExpression;
  }

  /**
   * @returns {string} Previously set symbol offset expression
   */
  getOffsetExpression() {
    return this.offsetExpression;
  }

  /**
   * @returns {string} Previously set color expression
   */
  getColorExpression() {
    return this.colorExpression;
  }

  /**
   * @returns {string} Previously set texture coordinate expression
   */
  getTextureCoordinateExpression() {
    return this.texCoordExpression;
  }

  /**
   * Generates a symbol vertex shader from the builder parameters,
   * intended to be used on point geometries.
   *
   * Three uniforms are hardcoded in all shaders: `u_projectionMatrix`, `u_offsetScaleMatrix` and
   * `u_offsetRotateMatrix`.
   *
   * The following attributes are hardcoded and expected to be present in the vertex buffers:
   * `vec2 a_position`, `float a_index` (being the index of the vertex in the quad, 0 to 3).
   *
   * The following varyings are hardcoded and gives the coordinate of the pixel both in the quad and on the texture:
   * `vec2 v_quadCoord`, `vec2 v_texCoord`
   *
   * @returns {string} The full shader as a string.
   */
  getSymbolVertexShader() {
    const offsetMatrix = this.rotateWithView ?
      'u_offsetScaleMatrix * u_offsetRotateMatrix' :
      'u_offsetScaleMatrix';

    return `precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
${this.uniforms.map(function(uniform) {
    return 'uniform ' + uniform + ';';
  }).join('\n')}
attribute vec2 a_position;
attribute float a_index;
${this.attributes.map(function(attribute) {
    return 'attribute ' + attribute + ';';
  }).join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${this.varyings.map(function(varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  }).join('\n')}
void main(void) {
  mat4 offsetMatrix = ${offsetMatrix};
  vec2 size = ${this.sizeExpression};
  vec2 offset = ${this.offsetExpression};
  float offsetX = a_index == 0.0 || a_index == 3.0 ? offset.x - size.x / 2.0 : offset.x + size.x / 2.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? offset.y - size.y / 2.0 : offset.y + size.y / 2.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = ${this.texCoordExpression};
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.q;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.p;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
${this.varyings.map(function(varying) {
    return '  ' + varying.name + ' = ' + varying.expression + ';';
  }).join('\n')}
}`;
  }

  /**
   * Generates a symbol fragment shader from the builder parameters,
   * intended to be used on point geometries.
   *
   * Expects the following varyings to be transmitted by the vertex shader:
   * `vec2 v_quadCoord`, `vec2 v_texCoord`
   *
   * @returns {string} The full shader as a string.
   */
  getSymbolFragmentShader() {
    return `precision mediump float;
${this.uniforms.map(function(uniform) {
    return 'uniform ' + uniform + ';';
  }).join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${this.varyings.map(function(varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  }).join('\n')}
void main(void) {
  gl_FragColor = ${this.colorExpression};
  gl_FragColor.rgb *= gl_FragColor.a;
}`;
  }
}

/**
 * @typedef {Object} StyleParseResult
 * @property {ShaderBuilder} builder Shader builder pre-configured according to a given style
 * @property {Object.<string,import("./Helper").UniformValue>} uniforms Uniform definitions.
 * @property {Array<import("../renderer/webgl/PointsLayer").CustomAttribute>} attributes Attribute descriptions.
 */

/**
 * Parses a {@link import("../style/LiteralStyle").LiteralSymbolStyle} object and returns a {@link ShaderBuilder}
 * object that has been configured according to the given style, as well as `attributes` and `uniforms`
 * arrays to be fed to the `WebGLPointsRenderer` class.
 *
 * Also returns `uniforms` and `attributes` properties as expected by the
 * {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 * @param {import("../style/LiteralStyle").LiteralSymbolStyle} style Symbol style.
 * @returns {StyleParseResult} Result containing shader params, attributes and uniforms.
 */
export function parseSymbolStyle(style) {
  const size = Array.isArray(style.size) && typeof style.size[0] == 'number' ?
    style.size : [style.size, style.size];
  const color = (typeof style.color === 'string' ?
    asArray(style.color).map(function(c, i) {
      return i < 3 ? c / 255 : c;
    }) :
    style.color || [255, 255, 255, 1]);
  const texCoord = style.textureCoord || [0, 0, 1, 1];
  const offset = style.offset || [0, 0];
  const opacity = style.opacity !== undefined ? style.opacity : 1;

  const attributes = [];
  const varyings = [];
  function pA(value) {
    return parse(value, attributes, 'a_');
  }
  function pV(value) {
    return parse(value, varyings, 'v_');
  }

  let opacityFilter = '1.0';
  const visibleSize = pV(size[0]);
  switch (style.symbolType) {
    case 'square': break;
    case 'image': break;
    // taken from https://thebookofshaders.com/07/
    case 'circle':
      opacityFilter = `(1.0-smoothstep(1.-4./${visibleSize},1.,dot(v_quadCoord-.5,v_quadCoord-.5)*4.))`;
      break;
    case 'triangle':
      const st = '(v_quadCoord*2.-1.)';
      const a = `(atan(${st}.x,${st}.y))`;
      opacityFilter = `(1.0-smoothstep(.5-3./${visibleSize},.5,cos(floor(.5+${a}/2.094395102)*2.094395102-${a})*length(${st})))`;
      break;

    default: throw new Error('Unexpected symbol type: ' + style.symbolType);
  }

  const builder = new ShaderBuilder()
    .setSizeExpression(`vec2(${pA(size[0])}, ${pA(size[1])})`)
    .setSymbolOffsetExpression(`vec2(${pA(offset[0])}, ${pA(offset[1])})`)
    .setTextureCoordinateExpression(
      `vec4(${pA(texCoord[0])}, ${pA(texCoord[1])}, ${pA(texCoord[2])}, ${pA(texCoord[3])})`)
    .setSymbolRotateWithView(!!style.rotateWithView)
    .setColorExpression(`vec4(${pV(color[0])}, ${pV(color[1])}, ${pV(color[2])}, ${pV(color[3])})` +
      ` * vec4(1.0, 1.0, 1.0, ${pV(opacity)} * ${opacityFilter})`);

  // define the varyings that will be used to pass data from the vertex to the fragment shaders
  // note: these should also be defined as attributes (if not already)
  varyings.forEach(function(varyingName) {
    if (attributes.indexOf(varyingName) === -1) {
      attributes.push(varyingName);
    }
    builder.addVarying(`v_${varyingName}`, 'float', `a_${varyingName}`);
  });

  // define the attributes from the features in the buffer
  attributes.forEach(function(attributeName) {
    builder.addAttribute(`float a_${attributeName}`);
  });


  /** @type {Object.<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  if (style.symbolType === 'image' && style.src) {
    const texture = new Image();
    texture.src = style.src;
    builder.addUniform('sampler2D u_texture')
      .setColorExpression(builder.getColorExpression() +
        ' * texture2D(u_texture, v_texCoord)');
    uniforms['u_texture'] = texture;
  }

  return {
    builder: builder,
    attributes: attributes.map(function(attributeName) {
      return {
        name: attributeName,
        callback: function(feature) {
          return feature.get(attributeName) || 0;
        }
      };
    }),
    uniforms: uniforms
  };
}
