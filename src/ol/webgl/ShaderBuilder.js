/**
 * Utilities for generating shaders from literal style objects
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
 * @typedef {Object} VaryingDescription
 * @property {string} name Varying name, as will be declared in the header.
 * @property {string} type Varying type, either `float`, `vec2`, `vec4`...
 * @property {string} expression Expression which will be assigned to the varying in the vertex shader, and
 * passed on to the fragment shader.
 */

/**
 * @typedef {Object} ShaderParameters
 * @property {Array<string>} [uniforms] Uniforms; these will be declared in the header (should include the type).
 * @property {Array<string>} [attributes] Attributes; these will be declared in the header (should include the type).
 * @property {Array<VaryingDescription>} [varyings] Varyings with a name, a type and an expression.
 * @property {string} sizeExpression This will be assigned to a `vec2 size` variable.
 * @property {string} offsetExpression This will be assigned to a `vec2 offset` variable.
 * @property {string} colorExpression This will be the value assigned to gl_FragColor
 * @property {string} texCoordExpression This will be the value assigned to the `vec4 v_texCoord` varying.
 * @property {boolean} [rotateWithView=false] Whether symbols should rotate with view
 */

/**
 * Generates a symbol vertex shader from a set of parameters,
 * intended to be used on point geometries.
 *
 * Three uniforms are hardcoded in all shaders: `u_projectionMatrix`, `u_offsetScaleMatrix` and
 * `u_offsetRotateMatrix`.
 *
 * The following attributes are hardcoded and expected to be present in the vertex buffers:
 * `vec2 a_position`, `float a_index` (being the index of the vertex in the quad, 0 to 3).
 *
 * The following varyings are hardcoded and gives the coordinate of the pixel both in the quad on the texture:
 * `vec2 v_quadCoord`, `vec2 v_texCoord`
 *
 * @param {ShaderParameters} parameters Parameters for the shader.
 * @returns {string} The full shader as a string.
 */
export function getSymbolVertexShader(parameters) {
  const offsetMatrix = parameters.rotateWithView ?
    'u_offsetScaleMatrix * u_offsetRotateMatrix' :
    'u_offsetScaleMatrix';

  const uniforms = parameters.uniforms || [];
  const attributes = parameters.attributes || [];
  const varyings = parameters.varyings || [];

  const body = `precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
${uniforms.map(function(uniform) {
    return 'uniform ' + uniform + ';';
  }).join('\n')}
attribute vec2 a_position;
attribute float a_index;
${attributes.map(function(attribute) {
    return 'attribute ' + attribute + ';';
  }).join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${varyings.map(function(varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  }).join('\n')}
void main(void) {
  mat4 offsetMatrix = ${offsetMatrix};
  vec2 size = ${parameters.sizeExpression};
  vec2 offset = ${parameters.offsetExpression};
  float offsetX = a_index == 0.0 || a_index == 3.0 ? offset.x - size.x / 2.0 : offset.x + size.x / 2.0;
  float offsetY = a_index == 0.0 || a_index == 1.0 ? offset.y - size.y / 2.0 : offset.y + size.y / 2.0;
  vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  vec4 texCoord = ${parameters.texCoordExpression};
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.q;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.p;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
${varyings.map(function(varying) {
    return '  ' + varying.name + ' = ' + varying.expression + ';';
  }).join('\n')}
}`;

  return body;
}

/**
 * Generates a symbol fragment shader intended to be used on point geometries.
 *
 * Expected the following varyings to be transmitted by the vertex shader:
 * `vec2 v_texCoord`
 *
 * @param {ShaderParameters} parameters Parameters for the shader.
 * @returns {string} The full shader as a string.
 */
export function getSymbolFragmentShader(parameters) {
  const uniforms = parameters.uniforms || [];
  const varyings = parameters.varyings || [];

  const body = `precision mediump float;
${uniforms.map(function(uniform) {
    return 'uniform ' + uniform + ';';
  }).join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
${varyings.map(function(varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  }).join('\n')}
void main(void) {
  gl_FragColor = ${parameters.colorExpression};
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

  return body;
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
 * @param {Array<string>} attributes Array containing the attribute names prefixed with `a_`; it
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
 * @typedef {Object} StyleParseResult
 * @property {ShaderParameters} params Symbol shader params.
 * @property {Object.<string,import("./Helper").UniformValue>} uniforms Uniform definitions.
 * @property {Array<import("../renderer/webgl/PointsLayer").CustomAttribute>} attributes Attribute descriptions.
 */

/**
 * Parses a {@link import("../style/LiteralStyle").LiteralSymbolStyle} object and outputs shader parameters to be
 * then fed to {@link getSymbolVertexShader} and {@link getSymbolFragmentShader}.
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

  let attributes = [];
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

  /** @type {import('../webgl/ShaderBuilder.js').ShaderParameters} */
  const params = {
    uniforms: [],
    colorExpression: `vec4(${pV(color[0])}, ${pV(color[1])}, ${pV(color[2])}, ${pV(color[3])})` +
      ` * vec4(1.0, 1.0, 1.0, ${pV(opacity)} * ${opacityFilter})`,
    sizeExpression: `vec2(${pA(size[0])}, ${pA(size[1])})`,
    offsetExpression: `vec2(${pA(offset[0])}, ${pA(offset[1])})`,
    texCoordExpression: `vec4(${pA(texCoord[0])}, ${pA(texCoord[1])}, ${pA(texCoord[2])}, ${pA(texCoord[3])})`,
    rotateWithView: !!style.rotateWithView
  };

  attributes = attributes.concat(varyings).filter(function(attrName, index, arr) {
    return arr.indexOf(attrName) === index;
  });
  params.attributes = attributes.map(function(attributeName) {
    return `float a_${attributeName}`;
  });
  params.varyings = varyings.map(function(attributeName) {
    return {
      name: `v_${attributeName}`,
      type: 'float',
      expression: `a_${attributeName}`
    };
  });

  /** @type {Object.<string,import("../webgl/Helper").UniformValue>} */
  const uniforms = {};

  if (style.symbolType === 'image' && style.src) {
    const texture = new Image();
    texture.src = style.src;
    params.uniforms.push('sampler2D u_texture');
    params.colorExpression = params.colorExpression +
      ' * texture2D(u_texture, v_texCoord)';
    uniforms['u_texture'] = texture;
  }

  return {
    params: params,
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
