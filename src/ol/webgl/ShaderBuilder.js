/**
 * Class for generating shaders from literal style objects
 * @module ol/webgl/ShaderBuilder
 */

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
 *   .setSymbolSizeExpression('...')
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
    this.symbolSizeExpression = 'vec2(1.0)';

    /**
     * @type {string}
     * @private
     */
    this.symbolRotationExpression = '0.0';

    /**
     * @type {string}
     * @private
     */
    this.symbolOffsetExpression = 'vec2(0.0)';

    /**
     * @type {string}
     * @private
     */
    this.symbolColorExpression = 'vec4(1.0)';

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
    this.symbolRotateWithView = false;
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
  setSymbolSizeExpression(expression) {
    this.symbolSizeExpression = expression;
    return this;
  }

  /**
   * Sets an expression to compute the rotation of the shape.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `float` value in radians.
   * @param {string} expression Size expression
   * @return {ShaderBuilder} the builder object
   */
  setSymbolRotationExpression(expression) {
    this.symbolRotationExpression = expression;
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
    this.symbolOffsetExpression = expression;
    return this;
  }

  /**
   * Sets an expression to compute the color of the shape.
   * This expression can use all the uniforms, varyings and attributes available
   * in the fragment shader, and should evaluate to a `vec4` value.
   * @param {string} expression Color expression
   * @return {ShaderBuilder} the builder object
   */
  setSymbolColorExpression(expression) {
    this.symbolColorExpression = expression;
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
    this.symbolRotateWithView = rotateWithView;
    return this;
  }

  /**
   * @return {string} Previously set color expression
   */
  getSymbolColorExpression() {
    return this.symbolColorExpression;
  }

  /**
   * Generates a symbol vertex shader from the builder parameters,
   * intended to be used on point geometries.
   *
   * Four uniforms are hardcoded in all shaders: `u_projectionMatrix`, `u_offsetScaleMatrix`,
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
    const offsetMatrix = this.symbolRotateWithView
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
  vec2 halfSize = ${this.symbolSizeExpression} * 0.5;
  vec2 offset = ${this.symbolOffsetExpression};
  float angle = ${this.symbolRotationExpression};
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
  gl_FragColor = ${this.symbolColorExpression};
  gl_FragColor.rgb *= gl_FragColor.a;
${hitDetectionBypass}
}`;
  }
}
