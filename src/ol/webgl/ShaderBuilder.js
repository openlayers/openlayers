/**
 * Class for generating shaders from literal style objects
 * @module ol/webgl/ShaderBuilder
 */
import {colorToGlsl, numberToGlsl} from '../style/expressions.js';
import {createDefaultStyle} from '../style/flat.js';

const BASE_UNIFORMS = `uniform mat4 u_projectionMatrix;
uniform mat4 u_screenToWorldMatrix;
uniform vec2 u_viewportSizePx;
uniform float u_pixelRatio;
uniform float u_globalAlpha;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;
`;

const DEFAULT_STYLE = createDefaultStyle();

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
    this.uniforms_ = [];

    /**
     * Attributes; these will be declared in the header (should include the type).
     * @type {Array<string>}
     * @private
     */
    this.attributes_ = [];

    /**
     * Varyings with a name, a type and an expression.
     * @type {Array<VaryingDescription>}
     * @private
     */
    this.varyings_ = [];

    /**
     * @type {boolean}
     * @private
     */
    this.hasSymbol_ = false;

    /**
     * @type {string}
     * @private
     */
    this.symbolSizeExpression_ = `vec2(${numberToGlsl(
      DEFAULT_STYLE['circle-radius']
    )})`;

    /**
     * @type {string}
     * @private
     */
    this.symbolRotationExpression_ = '0.0';

    /**
     * @type {string}
     * @private
     */
    this.symbolOffsetExpression_ = 'vec2(0.0)';

    /**
     * @type {string}
     * @private
     */
    this.symbolColorExpression_ = colorToGlsl(
      /** @type {string} */ (DEFAULT_STYLE['circle-fill-color'])
    );

    /**
     * @type {string}
     * @private
     */
    this.texCoordExpression_ = 'vec4(0.0, 0.0, 1.0, 1.0)';

    /**
     * @type {string}
     * @private
     */
    this.discardExpression_ = 'false';

    /**
     * @type {boolean}
     * @private
     */
    this.symbolRotateWithView_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.hasStroke_ = false;

    /**
     * @type {string}
     * @private
     */
    this.strokeWidthExpression_ = numberToGlsl(DEFAULT_STYLE['stroke-width']);

    /**
     * @type {string}
     * @private
     */
    this.strokeColorExpression_ = colorToGlsl(
      /** @type {string} */ (DEFAULT_STYLE['stroke-color'])
    );

    /**
     * @type {boolean}
     * @private
     */
    this.hasFill_ = false;

    /**
     * @type {string}
     * @private
     */
    this.fillColorExpression_ = colorToGlsl(
      /** @type {string} */ (DEFAULT_STYLE['fill-color'])
    );

    /**
     * @type {Array<string>}
     * @private
     */
    this.vertexShaderFunctions_ = [];

    /**
     * @type {Array<string>}
     * @private
     */
    this.fragmentShaderFunctions_ = [];
  }

  /**
   * Adds a uniform accessible in both fragment and vertex shaders.
   * The given name should include a type, such as `sampler2D u_texture`.
   * @param {string} name Uniform name
   * @return {ShaderBuilder} the builder object
   */
  addUniform(name) {
    this.uniforms_.push(name);
    return this;
  }

  /**
   * Adds an attribute accessible in the vertex shader, read from the geometry buffer.
   * The given name should include a type, such as `vec2 a_position`.
   * @param {string} name Attribute name
   * @return {ShaderBuilder} the builder object
   */
  addAttribute(name) {
    this.attributes_.push(name);
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
    this.varyings_.push({
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
    this.hasSymbol_ = true;
    this.symbolSizeExpression_ = expression;
    return this;
  }

  /**
   * @return {string} The current symbol size expression
   */
  getSymbolSizeExpression() {
    return this.symbolSizeExpression_;
  }

  /**
   * Sets an expression to compute the rotation of the shape.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `float` value in radians.
   * @param {string} expression Size expression
   * @return {ShaderBuilder} the builder object
   */
  setSymbolRotationExpression(expression) {
    this.symbolRotationExpression_ = expression;
    return this;
  }

  /**
   * Sets an expression to compute the offset of the symbol from the point center.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `vec2` value.
   * @param {string} expression Offset expression
   * @return {ShaderBuilder} the builder object
   */
  setSymbolOffsetExpression(expression) {
    this.symbolOffsetExpression_ = expression;
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
    this.hasSymbol_ = true;
    this.symbolColorExpression_ = expression;
    return this;
  }

  /**
   * @return {string} The current symbol color expression
   */
  getSymbolColorExpression() {
    return this.symbolColorExpression_;
  }

  /**
   * Sets an expression to compute the texture coordinates of the vertices.
   * This expression can use all the uniforms and attributes available
   * in the vertex shader, and should evaluate to a `vec4` value.
   * @param {string} expression Texture coordinate expression
   * @return {ShaderBuilder} the builder object
   */
  setTextureCoordinateExpression(expression) {
    this.texCoordExpression_ = expression;
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
    this.discardExpression_ = expression;
    return this;
  }

  /**
   * Sets whether the symbols should rotate with the view or stay aligned with the map.
   * Note: will only be used for point geometry shaders.
   * @param {boolean} rotateWithView Rotate with view
   * @return {ShaderBuilder} the builder object
   */
  setSymbolRotateWithView(rotateWithView) {
    this.symbolRotateWithView_ = rotateWithView;
    return this;
  }

  /**
   * @param {string} expression Stroke width expression, returning value in pixels
   * @return {ShaderBuilder} the builder object
   */
  setStrokeWidthExpression(expression) {
    this.hasStroke_ = true;
    this.strokeWidthExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Stroke color expression, evaluate to `vec4`
   * @return {ShaderBuilder} the builder object
   */
  setStrokeColorExpression(expression) {
    this.hasStroke_ = true;
    this.strokeColorExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Fill color expression, evaluate to `vec4`
   * @return {ShaderBuilder} the builder object
   */
  setFillColorExpression(expression) {
    this.hasFill_ = true;
    this.fillColorExpression_ = expression;
    return this;
  }

  addVertexShaderFunction(code) {
    if (this.vertexShaderFunctions_.includes(code)) {
      return;
    }
    this.vertexShaderFunctions_.push(code);
  }
  addFragmentShaderFunction(code) {
    if (this.fragmentShaderFunctions_.includes(code)) {
      return;
    }
    this.fragmentShaderFunctions_.push(code);
  }

  /**
   * Generates a symbol vertex shader from the builder parameters
   *
   * The following uniforms are hardcoded in all shaders: `u_projectionMatrix`, `u_offsetScaleMatrix`,
   * `u_offsetRotateMatrix`, `u_time`, `u_zoom`, `u_resolution`, `u_hitDetection`.
   *
   * The following attributes are hardcoded and expected to be present in the vertex buffers:
   * `vec2 a_position`, `float a_index` (being the index of the vertex in the quad, 0 to 3), `vec4 a_hitColor`.
   *
   * The following varyings are hardcoded and gives the coordinate of the pixel both in the quad and on the texture:
   * `vec2 v_quadCoord`, `vec2 v_texCoord`, `vec4 v_hitColor`.
   *
   * @return {string|null} The full shader as a string; null if no size or color specified
   */
  getSymbolVertexShader() {
    if (!this.hasSymbol_) {
      return null;
    }

    const offsetMatrix = this.symbolRotateWithView_
      ? 'u_offsetScaleMatrix * u_offsetRotateMatrix'
      : 'u_offsetScaleMatrix';

    return `precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;

${this.uniforms_
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;
${this.attributes_
  .map(function (attribute) {
    return 'attribute ' + attribute + ';';
  })
  .join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
${this.varyings_
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
${this.vertexShaderFunctions_.join('\n')}
void main(void) {
  mat4 offsetMatrix = ${offsetMatrix};
  vec2 halfSize = ${this.symbolSizeExpression_} * 0.5;
  vec2 offset = ${this.symbolOffsetExpression_};
  float angle = ${this.symbolRotationExpression_};
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
  vec4 texCoord = ${this.texCoordExpression_};
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_hitColor = a_hitColor;
${this.varyings_
  .map(function (varying) {
    return '  ' + varying.name + ' = ' + varying.expression + ';';
  })
  .join('\n')}
}`;
  }

  /**
   * Generates a symbol fragment shader from the builder parameters
   *
   * Expects the following varyings to be transmitted by the vertex shader:
   * `vec2 v_quadCoord`, `vec2 v_texCoord`, `vec4 v_hitColor`.
   *
   * @return {string|null} The full shader as a string; null if no size or color specified
   */
  getSymbolFragmentShader() {
    if (!this.hasSymbol_) {
      return null;
    }

    return `precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;
${this.uniforms_
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
${this.varyings_
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
${this.fragmentShaderFunctions_.join('\n')}
void main(void) {
  if (${this.discardExpression_}) { discard; }
  gl_FragColor = ${this.symbolColorExpression_};
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`;
  }

  /**
   * Generates a stroke vertex shader from the builder parameters
   * @return {string|null} The full shader as a string; null if no size or color specified
   */
  getStrokeVertexShader() {
    if (!this.hasStroke_) {
      return null;
    }

    return `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
${BASE_UNIFORMS}
${this.uniforms_
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
attribute vec2 a_position;
attribute float a_index;
attribute vec2 a_segmentStart;
attribute vec2 a_segmentEnd;
attribute float a_parameters;
attribute vec4 a_hitColor;
${this.attributes_
  .map(function (attribute) {
    return 'attribute ' + attribute + ';';
  })
  .join('\n')}
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
${this.varyings_
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
${this.vertexShaderFunctions_.join('\n')}
vec2 worldToPx(vec2 worldPos) {
  vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
  return (0.5 * screenPos.xy + 0.5) * u_viewportSizePx;
}

vec4 pxToScreen(vec2 pxPos) {
  vec2 screenPos = pxPos * 4.0 / u_viewportSizePx;
  return vec4(screenPos.xy, 0.0, 0.0);
}

vec2 getOffsetDirection(vec2 normalPx, vec2 tangentPx, float joinAngle) {
  if (cos(joinAngle) > 0.93) return normalPx - tangentPx;
  float halfAngle = joinAngle / 2.0;
  vec2 angleBisectorNormal = vec2(
    sin(halfAngle) * normalPx.x + cos(halfAngle) * normalPx.y,
    -cos(halfAngle) * normalPx.x + sin(halfAngle) * normalPx.y
  );
  float length = 1.0 / sin(halfAngle);
  return angleBisectorNormal * length;
}

void main(void) {
  float lineWidth = ${this.strokeWidthExpression_};
  float anglePrecision = 1500.0;
  float paramShift = 10000.0;
  v_angleStart = fract(a_parameters / paramShift) * paramShift / anglePrecision;
  v_angleEnd = fract(floor(a_parameters / paramShift + 0.5) / paramShift) * paramShift / anglePrecision;
  float vertexNumber = floor(a_parameters / paramShift / paramShift + 0.0001);
  vec2 tangentPx = worldToPx(a_segmentEnd) - worldToPx(a_segmentStart);
  tangentPx = normalize(tangentPx);
  vec2 normalPx = vec2(-tangentPx.y, tangentPx.x);
  float normalDir = vertexNumber < 0.5 || (vertexNumber > 1.5 && vertexNumber < 2.5) ? 1.0 : -1.0;
  float tangentDir = vertexNumber < 1.5 ? 1.0 : -1.0;
  float angle = vertexNumber < 1.5 ? v_angleStart : v_angleEnd;
  vec2 offsetPx = getOffsetDirection(normalPx * normalDir, tangentDir * tangentPx, angle) * lineWidth * 0.5;
  vec2 position =  vertexNumber < 1.5 ? a_segmentStart : a_segmentEnd;
  gl_Position = u_projectionMatrix * vec4(position, 0.0, 1.0) + pxToScreen(offsetPx);
  v_segmentStart = worldToPx(a_segmentStart);
  v_segmentEnd = worldToPx(a_segmentEnd);
  v_width = lineWidth;
  v_hitColor = a_hitColor;
${this.varyings_
  .map(function (varying) {
    return '  ' + varying.name + ' = ' + varying.expression + ';';
  })
  .join('\n')}
}`;
  }

  /**
   * Generates a stroke fragment shader from the builder parameters
   *
   * @return {string|null} The full shader as a string; null if no size or color specified
   */
  getStrokeFragmentShader() {
    if (!this.hasStroke_) {
      return null;
    }

    return `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
${BASE_UNIFORMS}
${this.uniforms_
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
${this.varyings_
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
${this.fragmentShaderFunctions_.join('\n')}
vec2 pxToWorld(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return (u_screenToWorldMatrix * vec4(screenPos, 0.0, 1.0)).xy;
}

float segmentDistanceField(vec2 point, vec2 start, vec2 end, float radius) {
  vec2 startToPoint = point - start;
  vec2 startToEnd = end - start;
  float ratio = clamp(dot(startToPoint, startToEnd) / dot(startToEnd, startToEnd), 0.0, 1.0);
  float dist = length(startToPoint - ratio * startToEnd);
  return 1.0 - smoothstep(radius - 1.0, radius, dist);
}

void main(void) {
  vec2 v_currentPoint = gl_FragCoord.xy / u_pixelRatio;
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  vec2 v_worldPos = pxToWorld(v_currentPoint);
  if (
    abs(u_renderExtent[0] - u_renderExtent[2]) > 0.0 && (
      v_worldPos[0] < u_renderExtent[0] ||
      v_worldPos[1] < u_renderExtent[1] ||
      v_worldPos[0] > u_renderExtent[2] ||
      v_worldPos[1] > u_renderExtent[3]
    )
  ) {
    discard;
  }
  #endif
  if (${this.discardExpression_}) { discard; }
  gl_FragColor = ${this.strokeColorExpression_} * u_globalAlpha;
  gl_FragColor *= segmentDistanceField(v_currentPoint, v_segmentStart, v_segmentEnd, v_width);
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`;
  }

  /**
   * Generates a fill vertex shader from the builder parameters
   *
   * @return {string|null} The full shader as a string; null if no color specified
   */
  getFillVertexShader() {
    if (!this.hasFill_) {
      return null;
    }

    return `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
${BASE_UNIFORMS}
${this.uniforms_
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
attribute vec2 a_position;
attribute vec4 a_hitColor;
${this.attributes_
  .map(function (attribute) {
    return 'attribute ' + attribute + ';';
  })
  .join('\n')}
varying vec4 v_hitColor;
${this.varyings_
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
${this.vertexShaderFunctions_.join('\n')}
void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
${this.varyings_
  .map(function (varying) {
    return '  ' + varying.name + ' = ' + varying.expression + ';';
  })
  .join('\n')}
}`;
  }

  /**
   * Generates a fill fragment shader from the builder parameters
   * @return {string|null} The full shader as a string; null if no color specified
   */
  getFillFragmentShader() {
    if (!this.hasFill_) {
      return null;
    }

    return `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
${BASE_UNIFORMS}
${this.uniforms_
  .map(function (uniform) {
    return 'uniform ' + uniform + ';';
  })
  .join('\n')}
varying vec4 v_hitColor;
${this.varyings_
  .map(function (varying) {
    return 'varying ' + varying.type + ' ' + varying.name + ';';
  })
  .join('\n')}
${this.fragmentShaderFunctions_.join('\n')}
vec2 pxToWorld(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return (u_screenToWorldMatrix * vec4(screenPos, 0.0, 1.0)).xy;
}

void main(void) {
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  vec2 v_worldPos = pxToWorld(gl_FragCoord.xy / u_pixelRatio);
  if (
    abs(u_renderExtent[0] - u_renderExtent[2]) > 0.0 && (
      v_worldPos[0] < u_renderExtent[0] ||
      v_worldPos[1] < u_renderExtent[1] ||
      v_worldPos[0] > u_renderExtent[2] ||
      v_worldPos[1] > u_renderExtent[3]
    )
  ) {
    discard;
  }
  #endif
  if (${this.discardExpression_}) { discard; }
  gl_FragColor = ${this.fillColorExpression_} * u_globalAlpha;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`;
  }
}
