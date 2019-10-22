/**
 * Classes and utilities for generating shaders from literal style objects
 * @module ol/webgl/ShaderBuilder
 */

import {asArray, isStringColor} from '../color.js';

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
 * @param {string|import("../color.js").Color} color Color either in string format or [r, g, b, a] array format,
 * with RGB components in the 0..255 range and the alpha component in the 0..1 range. Note that if the A component is
 * missing, only 3 values will be output.
 * @returns {string} The color components concatenated in `1.0, 1.0, 1.0, 1.0` form.
 */
export function formatColor(color) {
  return asArray(color).map(function(c, i) {
    return i < 3 ? c / 255 : c;
  }).map(formatNumber).join(', ');
}

/**
 * Possible inferred types from a given value or expression
 * @enum {number}
 */
const ValueTypes = {
  UNKNOWN: -1,
  NUMBER: 0,
  STRING: 1,
  COLOR: 2,
  COLOR_OR_STRING: 3
};

function getValueType(value) {
  if (typeof value === 'number') {
    return ValueTypes.NUMBER;
  }
  if (typeof value === 'string') {
    if (isStringColor(value)) {
      return ValueTypes.COLOR_OR_STRING;
    }
    return ValueTypes.STRING;
  }
  if (!Array.isArray(value)) {
    throw new Error(`Unrecognized value type: ${JSON.stringify(value)}`);
  }
  if (value.length === 3 || value.length === 4) {
    const onlyNumbers = value.every(function(v) {
      return typeof v === 'number';
    });
    if (onlyNumbers) {
      return ValueTypes.COLOR;
    }
  }
  if (typeof value[0] !== 'string') {
    return ValueTypes.UNKNOWN;
  }
  switch (value[0]) {
    case 'get':
    case 'var':
    case 'time':
    case '*':
    case '+':
    case 'clamp':
    case 'stretch':
    case '>':
    case '>=':
    case '<':
    case '<=':
    case '==':
    case '!':
    case 'between':
      return ValueTypes.NUMBER;
    case 'interpolate':
      return ValueTypes.COLOR;
    default:
      return ValueTypes.UNKNOWN;
  }
}

/**
 * @param {import("../style/LiteralStyle").ExpressionValue} value Either literal or an operator.
 * @returns {boolean} True if a numeric value, false otherwise
 */
export function isValueTypeNumber(value) {
  return getValueType(value) === ValueTypes.NUMBER;
}

/**
 * @param {import("../style/LiteralStyle").ExpressionValue} value Either literal or an operator.
 * @returns {boolean} True if a string value, false otherwise
 */
export function isValueTypeString(value) {
  return getValueType(value) === ValueTypes.STRING || getValueType(value) === ValueTypes.COLOR_OR_STRING;
}

/**
 * @param {import("../style/LiteralStyle").ExpressionValue} value Either literal or an operator.
 * @returns {boolean} True if a color value, false otherwise
 */
export function isValueTypeColor(value) {
  return getValueType(value) === ValueTypes.COLOR || getValueType(value) === ValueTypes.COLOR_OR_STRING;
}


/**
 * Check that the provided value or expression is valid, and that the types used are compatible.
 *
 * Will throw an exception if found to be invalid.
 *
 * @param {import("../style/LiteralStyle").ExpressionValue} value Either literal or an operator.
 */
export function check(value) {
  const v = value;

  // these will be used to validate types in the expressions
  function checkNumber(value) {
    if (!isValueTypeNumber(value)) {
      throw new Error(`A numeric value was expected, got ${JSON.stringify(value)} instead`);
    }
  }
  function checkColor(value) {
    if (!isValueTypeColor(value)) {
      throw new Error(`A color value was expected, got ${JSON.stringify(value)} instead`);
    }
  }
  function checkString(value) {
    if (!isValueTypeString(value)) {
      throw new Error(`A string value was expected, got ${JSON.stringify(value)} instead`);
    }
  }

  // first check that the value is of a recognized kind
  if (!isValueTypeColor(value) && !isValueTypeNumber(value) && !isValueTypeString(value)) {
    throw new Error(`No type could be inferred from the following expression: ${JSON.stringify(value)}`);
  }

  // check operator arguments
  if (Array.isArray(value)) {
    switch (value[0]) {
      case 'get':
      case 'var':
        checkString(v[1]);
        break;
      case 'time':
        break;
      case '*':
      case '+':
        checkNumber(v[1]);
        checkNumber(v[2]);
        break;
      case 'clamp':
        checkNumber(v[1]);
        checkNumber(v[2]);
        checkNumber(v[3]);
        break;
      case 'stretch':
        checkNumber(v[1]);
        checkNumber(v[2]);
        checkNumber(v[3]);
        checkNumber(v[4]);
        checkNumber(v[5]);
        break;
      case '>':
      case '>=':
      case '<':
      case '<=':
      case '==':
        checkNumber(v[1]);
        checkNumber(v[2]);
        break;
      case '!':
        checkNumber(v[1]);
        break;
      case 'between':
        checkNumber(v[1]);
        checkNumber(v[2]);
        checkNumber(v[3]);
        break;

      case 'interpolate':
        checkNumber(v[1]);
        checkColor(v[2]);
        checkColor(v[3]);
        break;

      default: throw new Error(`Unrecognized operator in style expression: ${JSON.stringify(value)}`);
    }
  }
}

/**
 * Parses the provided expressions and produces a GLSL-compatible assignment string, such as:
 * `['add', ['*', ['get', 'size'], 0.001], 12] => '(a_size * (0.001)) + (12.0)'
 *
 * Also takes in two arrays where new attributes and variables will be pushed, so that the user of the `parse` function
 * knows which attributes/variables are expected to be available at evaluation time.
 *
 * For attributes, a prefix must be specified so that the attributes can either be written as `a_name` or `v_name` in
 * the final assignment string (depending on whether we're outputting a vertex or fragment shader).
 *
 * @param {import("../style/LiteralStyle").ExpressionValue} value Either literal or an operator.
 * @param {Array<string>} attributes Array containing the attribute names **without a prefix**;
 * it is passed along recursively
 * @param {string} attributePrefix Prefix added to attribute names in the final output (typically `a_` or `v_`).
 * @param {Array<string>} variables Array containing the variable names **without a prefix**;
 * it is passed along recursively
 * @returns {string} Assignment string.
 */
export function parse(value, attributes, attributePrefix, variables) {
  check(value);

  const v = value;
  function p(value) {
    return parse(value, attributes, attributePrefix, variables);
  }
  if (Array.isArray(v)) {
    switch (v[0]) {
      // reading operators
      case 'get':
        if (attributes.indexOf(v[1]) === -1) {
          attributes.push(v[1]);
        }
        return attributePrefix + v[1];
      case 'var':
        if (variables.indexOf(v[1]) === -1) {
          variables.push(v[1]);
        }
        return `u_${v[1]}`;
      case 'time':
        return 'u_time';

      // math operators
      case '*': return `(${p(v[1])} * ${p(v[2])})`;
      case '+': return `(${p(v[1])} + ${p(v[2])})`;
      case 'clamp': return `clamp(${p(v[1])}, ${p(v[2])}, ${p(v[3])})`;
      case 'stretch': return `(clamp(${p(v[1])}, ${p(v[2])}, ${p(v[3])}) * ((${p(v[5])} - ${p(v[4])}) / (${p(v[3])} - ${p(v[2])})) + ${p(v[4])})`;

      // logical operators
      case '>':
      case '>=':
      case '<':
      case '<=':
      case '==':
        return `(${p(v[1])} ${v[0]} ${p(v[2])} ? 1.0 : 0.0)`;
      case '!':
        return `(${p(v[1])} > 0.0 ? 0.0 : 1.0)`;
      case 'between':
        return `(${p(v[1])} >= ${p(v[2])} && ${p(v[1])} <= ${p(v[3])} ? 1.0 : 0.0)`;

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
   * @returns {string} Previously set fragment discard expression
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
uniform float u_time;
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
uniform float u_time;
${this.uniforms.map(function(uniform) {
    return 'uniform ' + uniform + ';';
  }).join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${this.varyings.map(function(varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  }).join('\n')}
void main(void) {
  if (${this.discardExpression}) { discard; }
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
 * Parses a {@link import("../style/LiteralStyle").LiteralStyle} object and returns a {@link ShaderBuilder}
 * object that has been configured according to the given style, as well as `attributes` and `uniforms`
 * arrays to be fed to the `WebGLPointsRenderer` class.
 *
 * Also returns `uniforms` and `attributes` properties as expected by the
 * {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 *
 * @param {import("../style/LiteralStyle").LiteralStyle} style Literal style.
 * @returns {StyleParseResult} Result containing shader params, attributes and uniforms.
 */
export function parseLiteralStyle(style) {
  const symbStyle = style.symbol;
  const size = Array.isArray(symbStyle.size) && typeof symbStyle.size[0] == 'number' ?
    symbStyle.size : [symbStyle.size, symbStyle.size];
  const color = (typeof symbStyle.color === 'string' ?
    asArray(symbStyle.color).map(function(c, i) {
      return i < 3 ? c / 255 : c;
    }) :
    symbStyle.color || [255, 255, 255, 1]);
  const texCoord = symbStyle.textureCoord || [0, 0, 1, 1];
  const offset = symbStyle.offset || [0, 0];
  const opacity = symbStyle.opacity !== undefined ? symbStyle.opacity : 1;

  const variables = [];
  const vertAttributes = [];
  // parse function for vertex shader
  function pVert(value) {
    return parse(value, vertAttributes, 'a_', variables);
  }

  const fragAttributes = [];
  // parse function for fragment shader
  function pFrag(value) {
    return parse(value, fragAttributes, 'v_', variables);
  }

  let opacityFilter = '1.0';
  const visibleSize = pFrag(size[0]);
  switch (symbStyle.symbolType) {
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

    default: throw new Error('Unexpected symbol type: ' + symbStyle.symbolType);
  }

  const builder = new ShaderBuilder()
    .setSizeExpression(`vec2(${pVert(size[0])}, ${pVert(size[1])})`)
    .setSymbolOffsetExpression(`vec2(${pVert(offset[0])}, ${pVert(offset[1])})`)
    .setTextureCoordinateExpression(
      `vec4(${pVert(texCoord[0])}, ${pVert(texCoord[1])}, ${pVert(texCoord[2])}, ${pVert(texCoord[3])})`)
    .setSymbolRotateWithView(!!symbStyle.rotateWithView)
    .setColorExpression(
      `vec4(${pFrag(color[0])}, ${pFrag(color[1])}, ${pFrag(color[2])}, ${pFrag(color[3])} * ${pFrag(opacity)} * ${opacityFilter})`);

  if (style.filter) {
    builder.setFragmentDiscardExpression(`${pFrag(style.filter)} <= 0.0`);
  }

  /** @type {Object.<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  // define one uniform per variable
  variables.forEach(function(varName) {
    builder.addUniform(`float u_${varName}`);
    uniforms[`u_${varName}`] = function() {
      return style.variables && style.variables[varName] !== undefined ?
        style.variables[varName] : 0;
    };
  });

  if (symbStyle.symbolType === 'image' && symbStyle.src) {
    const texture = new Image();
    texture.src = symbStyle.src;
    builder.addUniform('sampler2D u_texture')
      .setColorExpression(builder.getColorExpression() +
        ' * texture2D(u_texture, v_texCoord)');
    uniforms['u_texture'] = texture;
  }

  // for each feature attribute used in the fragment shader, define a varying that will be used to pass data
  // from the vertex to the fragment shader, as well as an attribute in the vertex shader (if not already present)
  fragAttributes.forEach(function(attrName) {
    if (vertAttributes.indexOf(attrName) === -1) {
      vertAttributes.push(attrName);
    }
    builder.addVarying(`v_${attrName}`, 'float', `a_${attrName}`);
  });

  // for each feature attribute used in the vertex shader, define an attribute in the vertex shader.
  vertAttributes.forEach(function(attrName) {
    builder.addAttribute(`float a_${attrName}`);
  });

  return {
    builder: builder,
    attributes: vertAttributes.map(function(attributeName) {
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
