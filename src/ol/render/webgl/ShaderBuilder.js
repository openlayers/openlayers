/**
 * Class for generating shaders from literal style objects
 * @module ol/render/webgl/ShaderBuilder
 */
import {colorToGlsl, numberToGlsl, stringToGlsl} from '../../expr/gpu.js';
import {createDefaultStyle} from '../../style/flat.js';
import {LINESTRING_ANGLE_COSINE_CUTOFF} from './bufferUtil.js';

export const COMMON_HEADER = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat4 u_projectionMatrix;
uniform mat4 u_screenToWorldMatrix;
uniform vec2 u_viewportSizePx;
uniform float u_pixelRatio;
uniform float u_globalAlpha;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform vec2 u_patternOrigin;
uniform float u_depth;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;
float currentLineMetric = 0.; // an actual value will be used in the stroke shaders
`;

const DEFAULT_STYLE = createDefaultStyle();

/**
 * @typedef {Object} AttributeDescription
 * @property {string} name Attribute name, as will be declared in the headers (including a_)
 * @property {string} type Attribute type, either `float`, `vec2`, `vec4`...
 * @property {string} varyingName Varying name, as will be declared in the fragment shader (including v_)
 * @property {string} varyingType Varying type, either `float`, `vec2`, `vec4`...
 * @property {string} varyingExpression GLSL expression to assign to the varying in the vertex shader
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
 *   .getSymbolFragmentShader();
 * ```
 *
 * A note on [alpha premultiplication](https://en.wikipedia.org/wiki/Alpha_compositing#Straight_versus_premultiplied):
 * The ShaderBuilder class expects all colors to **not having been alpha-premultiplied!** This is because alpha
 * premultiplication is done at the end of each fragment shader.
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
     * @type {Array<AttributeDescription>}
     * @private
     */
    this.attributes_ = [];

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
      DEFAULT_STYLE['circle-radius'],
    )} + ${numberToGlsl(DEFAULT_STYLE['circle-stroke-width'] * 0.5)})`;

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
      /** @type {string} */ (DEFAULT_STYLE['circle-fill-color']),
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
      /** @type {string} */ (DEFAULT_STYLE['stroke-color']),
    );

    /**
     * @private
     */
    this.strokeOffsetExpression_ = '0.';

    /**
     * @private
     */
    this.strokeCapExpression_ = stringToGlsl('round');

    /**
     * @private
     */
    this.strokeJoinExpression_ = stringToGlsl('round');

    /**
     * @private
     */
    this.strokeMiterLimitExpression_ = '10.';

    /**
     * @private
     */
    this.strokeDistanceFieldExpression_ = '-1000.';

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
      /** @type {string} */ (DEFAULT_STYLE['fill-color']),
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
   * Attributes will also be made available under the same name in fragment shaders.
   * @param {string} name Attribute name
   * @param {'float'|'vec2'|'vec3'|'vec4'} type Type
   * @param {string} [transform] Expression which will be assigned to the varying in the vertex shader, and
   * passed on to the fragment shader.
   * @param {'float'|'vec2'|'vec3'|'vec4'} [transformedType] Type of the attribute after transformation;
   * e.g. `vec4` after unpacking color components
   * @return {ShaderBuilder} the builder object
   */
  addAttribute(name, type, transform, transformedType) {
    this.attributes_.push({
      name,
      type,
      varyingName: name.replace(/^a_/, 'v_'),
      varyingType: transformedType ?? type,
      varyingExpression: transform ?? name,
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
   * @return {string} The current symbol offset expression
   */
  getSymbolOffsetExpression() {
    return this.symbolOffsetExpression_;
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
   * @return {string} The current fragment discard expression
   */
  getFragmentDiscardExpression() {
    return this.discardExpression_;
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
   * @param {string} expression Stroke color expression, evaluate to `vec4`: can rely on currentLengthPx and currentRadiusPx
   * @return {ShaderBuilder} the builder object
   */
  setStrokeColorExpression(expression) {
    this.hasStroke_ = true;
    this.strokeColorExpression_ = expression;
    return this;
  }

  /**
   * @return {string} The current stroke color expression
   */
  getStrokeColorExpression() {
    return this.strokeColorExpression_;
  }

  /**
   * @param {string} expression Stroke color expression, evaluate to `float`
   * @return {ShaderBuilder} the builder object
   */
  setStrokeOffsetExpression(expression) {
    this.strokeOffsetExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Stroke line cap expression, evaluate to `float`
   * @return {ShaderBuilder} the builder object
   */
  setStrokeCapExpression(expression) {
    this.strokeCapExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Stroke line join expression, evaluate to `float`
   * @return {ShaderBuilder} the builder object
   */
  setStrokeJoinExpression(expression) {
    this.strokeJoinExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Stroke miter limit expression, evaluate to `float`
   * @return {ShaderBuilder} the builder object
   */
  setStrokeMiterLimitExpression(expression) {
    this.strokeMiterLimitExpression_ = expression;
    return this;
  }

  /**
   * @param {string} expression Stroke distance field expression, evaluate to `float`
   * This can override the default distance field; can rely on currentLengthPx and currentRadiusPx
   * @return {ShaderBuilder} the builder object
   */
  setStrokeDistanceFieldExpression(expression) {
    this.strokeDistanceFieldExpression_ = expression;
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

  /**
   * @return {string} The current fill color expression
   */
  getFillColorExpression() {
    return this.fillColorExpression_;
  }

  addVertexShaderFunction(code) {
    if (this.vertexShaderFunctions_.includes(code)) {
      return this;
    }
    this.vertexShaderFunctions_.push(code);
    return this;
  }
  addFragmentShaderFunction(code) {
    if (this.fragmentShaderFunctions_.includes(code)) {
      return this;
    }
    this.fragmentShaderFunctions_.push(code);
    return this;
  }

  /**
   * Generates a symbol vertex shader from the builder parameters
   * @return {string|null} The full shader as a string; null if no size or color specified
   */
  getSymbolVertexShader() {
    if (!this.hasSymbol_) {
      return null;
    }

    return `${COMMON_HEADER}
${this.uniforms_.map((uniform) => `uniform ${uniform};`).join('\n')}
attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;

${this.attributes_
  .map(
    (attribute) => `attribute ${attribute.type} ${attribute.name};
varying ${attribute.varyingType} ${attribute.varyingName};`,
  )
  .join('\n')}
${this.vertexShaderFunctions_.join('\n')}
vec2 pxToScreen(vec2 coordPx) {
  vec2 scaled = coordPx / u_viewportSizePx / 0.5;
  return scaled;
}

vec2 screenToPx(vec2 coordScreen) {
  return (coordScreen * 0.5 + 0.5) * u_viewportSizePx;
}

void main(void) {
  v_quadSizePx = ${this.symbolSizeExpression_};
  vec2 halfSizePx = v_quadSizePx * 0.5;
  vec2 centerOffsetPx = ${this.symbolOffsetExpression_};
  vec2 offsetPx = centerOffsetPx;
  if (a_index == 0.0) {
    offsetPx -= halfSizePx;
  } else if (a_index == 1.0) {
    offsetPx += halfSizePx * vec2(1., -1.);
  } else if (a_index == 2.0) {
    offsetPx += halfSizePx;
  } else {
    offsetPx += halfSizePx * vec2(-1., 1.);
  }
  float angle = ${this.symbolRotationExpression_};
  ${this.symbolRotateWithView_ ? 'angle += u_rotation;' : ''}
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), u_depth, 0.);
  vec4 texCoord = ${this.texCoordExpression_};
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  v_hitColor = a_hitColor;
  v_angle = angle;
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y); 
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;
${this.attributes_
  .map(
    (attribute) =>
      `  ${attribute.varyingName} = ${attribute.varyingExpression};`,
  )
  .join('\n')}
}`;
  }

  /**
   * Generates a symbol fragment shader from the builder parameters
   * @return {string|null} The full shader as a string; null if no size or color specified
   */
  getSymbolFragmentShader() {
    if (!this.hasSymbol_) {
      return null;
    }

    return `${COMMON_HEADER}
${this.uniforms_.map((uniform) => `uniform ${uniform};`).join('\n')}
varying vec2 v_texCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;
${this.attributes_
  .map(
    (attribute) => `varying ${attribute.varyingType} ${attribute.varyingName};`,
  )
  .join('\n')}
${this.fragmentShaderFunctions_.join('\n')}

void main(void) {
${this.attributes_
  .map(
    (attribute) =>
      `  ${attribute.varyingType} ${attribute.name} = ${attribute.varyingName}; // assign to original attribute name`,
  )
  .join('\n')}
  if (${this.discardExpression_}) { discard; }
  vec2 coordsPx = gl_FragCoord.xy / u_pixelRatio - v_centerPx; // relative to center
  float c = cos(v_angle);
  float s = sin(v_angle);
  coordsPx = vec2(c * coordsPx.x - s * coordsPx.y, s * coordsPx.x + c * coordsPx.y);
  gl_FragColor = ${this.symbolColorExpression_};
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.05) { discard; };
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

    return `${COMMON_HEADER}
${this.uniforms_.map((uniform) => `uniform ${uniform};`).join('\n')}
attribute vec2 a_segmentStart;
attribute vec2 a_segmentEnd;
attribute float a_measureStart;
attribute float a_measureEnd;
attribute float a_parameters;
attribute float a_distance;
attribute vec2 a_joinAngles;
attribute vec4 a_hitColor;

varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distanceOffsetPx;
varying float v_measureStart;
varying float v_measureEnd;

${this.attributes_
  .map(
    (attribute) => `attribute ${attribute.type} ${attribute.name};
varying ${attribute.varyingType} ${attribute.varyingName};`,
  )
  .join('\n')}
${this.vertexShaderFunctions_.join('\n')}
vec2 worldToPx(vec2 worldPos) {
  vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
  return (0.5 * screenPos.xy + 0.5) * u_viewportSizePx;
}

vec4 pxToScreen(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return vec4(screenPos, u_depth, 1.0);
}

bool isCap(float joinAngle) {
  return joinAngle < -0.1;
}

vec2 getJoinOffsetDirection(vec2 normalPx, float joinAngle) {
  float halfAngle = joinAngle / 2.0;
  float c = cos(halfAngle);
  float s = sin(halfAngle);
  vec2 angleBisectorNormal = vec2(s * normalPx.x + c * normalPx.y, -c * normalPx.x + s * normalPx.y);
  float length = 1.0 / s;
  return angleBisectorNormal * length;
}

vec2 getOffsetPoint(vec2 point, vec2 normal, float joinAngle, float offsetPx) {
  // if on a cap or the join angle is too high, offset the line along the segment normal
  if (cos(joinAngle) > 0.998 || isCap(joinAngle)) {
    return point - normal * offsetPx;
  }
  // offset is applied along the inverted normal (positive offset goes "right" relative to line direction)
  return point - getJoinOffsetDirection(normal, joinAngle) * offsetPx;
}

void main(void) {
  v_angleStart = a_joinAngles.x;
  v_angleEnd = a_joinAngles.y;
  float vertexNumber = floor(abs(a_parameters) / 10000. + 0.5);
  currentLineMetric = vertexNumber < 1.5 ? a_measureStart : a_measureEnd;
  // we're reading the fractional part while keeping the sign (so -4.12 gives -0.12, 3.45 gives 0.45)
  float angleTangentSum = fract(abs(a_parameters) / 10000.) * 10000. * sign(a_parameters);

  float lineWidth = ${this.strokeWidthExpression_};
  float lineOffsetPx = ${this.strokeOffsetExpression_};

  // compute segment start/end in px with offset
  vec2 segmentStartPx = worldToPx(a_segmentStart);
  vec2 segmentEndPx = worldToPx(a_segmentEnd);
  vec2 tangentPx = normalize(segmentEndPx - segmentStartPx);
  vec2 normalPx = vec2(-tangentPx.y, tangentPx.x);
  segmentStartPx = getOffsetPoint(segmentStartPx, normalPx, v_angleStart, lineOffsetPx),
  segmentEndPx = getOffsetPoint(segmentEndPx, normalPx, v_angleEnd, lineOffsetPx);
  
  // compute current vertex position
  float normalDir = vertexNumber < 0.5 || (vertexNumber > 1.5 && vertexNumber < 2.5) ? 1.0 : -1.0;
  float tangentDir = vertexNumber < 1.5 ? 1.0 : -1.0;
  float angle = vertexNumber < 1.5 ? v_angleStart : v_angleEnd;
  vec2 joinDirection;
  vec2 positionPx = vertexNumber < 1.5 ? segmentStartPx : segmentEndPx;
  // if angle is too high, do not make a proper join
  if (cos(angle) > ${LINESTRING_ANGLE_COSINE_CUTOFF} || isCap(angle)) {
    joinDirection = normalPx * normalDir - tangentPx * tangentDir;
  } else {
    joinDirection = getJoinOffsetDirection(normalPx * normalDir, angle);
  }
  positionPx = positionPx + joinDirection * (lineWidth * 0.5 + 1.); // adding 1 pixel for antialiasing
  gl_Position = pxToScreen(positionPx);

  v_segmentStart = segmentStartPx;
  v_segmentEnd = segmentEndPx;
  v_width = lineWidth;
  v_hitColor = a_hitColor;
  v_distanceOffsetPx = a_distance / u_resolution - (lineOffsetPx * angleTangentSum);
  v_measureStart = a_measureStart;
  v_measureEnd = a_measureEnd;
${this.attributes_
  .map(
    (attribute) =>
      `  ${attribute.varyingName} = ${attribute.varyingExpression};`,
  )
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

    return `${COMMON_HEADER}
${this.uniforms_.map((uniform) => `uniform ${uniform};`).join('\n')}
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distanceOffsetPx;
varying float v_measureStart;
varying float v_measureEnd;
${this.attributes_
  .map(
    (attribute) => `varying ${attribute.varyingType} ${attribute.varyingName};`,
  )
  .join('\n')}
${this.fragmentShaderFunctions_.join('\n')}

vec2 pxToWorld(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return (u_screenToWorldMatrix * vec4(screenPos, 0.0, 1.0)).xy;
}

bool isCap(float joinAngle) {
  return joinAngle < -0.1;
}

float segmentDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  vec2 tangent = normalize(end - start);
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec2 startToPoint = point - start;
  return abs(dot(startToPoint, normal)) - width * 0.5;
}

float buttCapDistanceField(vec2 point, vec2 start, vec2 end) {
  vec2 startToPoint = point - start;
  vec2 tangent = normalize(end - start);
  return dot(startToPoint, -tangent);
}

float squareCapDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  return buttCapDistanceField(point, start, end) - width * 0.5;
}

float roundCapDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  float onSegment = max(0., 1000. * dot(point - start, end - start)); // this is very high when inside the segment
  return length(point - start) - width * 0.5 - onSegment;
}

float roundJoinDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  return roundCapDistanceField(point, start, end, width);
}

float bevelJoinField(vec2 point, vec2 start, vec2 end, float width, float joinAngle) {
  vec2 startToPoint = point - start;
  vec2 tangent = normalize(end - start);
  float c = cos(joinAngle * 0.5);
  float s = sin(joinAngle * 0.5);
  float direction = -sign(sin(joinAngle));
  vec2 bisector = vec2(c * tangent.x - s * tangent.y, s * tangent.x + c * tangent.y);
  float radius = width * 0.5 * s;
  return dot(startToPoint, bisector * direction) - radius;
}

float miterJoinDistanceField(vec2 point, vec2 start, vec2 end, float width, float joinAngle) {
  if (cos(joinAngle) > ${LINESTRING_ANGLE_COSINE_CUTOFF}) { // avoid risking a division by zero
    return bevelJoinField(point, start, end, width, joinAngle);
  }
  float miterLength = 1. / sin(joinAngle * 0.5);
  float miterLimit = ${this.strokeMiterLimitExpression_};
  if (miterLength > miterLimit) {
    return bevelJoinField(point, start, end, width, joinAngle);
  }
  return -1000.;
}

float capDistanceField(vec2 point, vec2 start, vec2 end, float width, float capType) {
   if (capType == ${stringToGlsl('butt')}) {
    return buttCapDistanceField(point, start, end);
  } else if (capType == ${stringToGlsl('square')}) {
    return squareCapDistanceField(point, start, end, width);
  }
  return roundCapDistanceField(point, start, end, width);
}

float joinDistanceField(vec2 point, vec2 start, vec2 end, float width, float joinAngle, float joinType) {
  if (joinType == ${stringToGlsl('bevel')}) {
    return bevelJoinField(point, start, end, width, joinAngle);
  } else if (joinType == ${stringToGlsl('miter')}) {
    return miterJoinDistanceField(point, start, end, width, joinAngle);
  }
  return roundJoinDistanceField(point, start, end, width);
}

float computeSegmentPointDistance(vec2 point, vec2 start, vec2 end, float width, float joinAngle, float capType, float joinType) {
  if (isCap(joinAngle)) {
    return capDistanceField(point, start, end, width, capType);
  }
  return joinDistanceField(point, start, end, width, joinAngle, joinType);
}

float distanceFromSegment(vec2 point, vec2 start, vec2 end) {
  vec2 tangent = end - start;
  vec2 startToPoint = point - start;
  // inspire by capsule fn in https://iquilezles.org/articles/distfunctions/
  float h = clamp(dot(startToPoint, tangent) / dot(tangent, tangent), 0.0, 1.0);
  return length(startToPoint - tangent * h);
}

void main(void) {
${this.attributes_
  .map(
    (attribute) =>
      `  ${attribute.varyingType} ${attribute.name} = ${attribute.varyingName}; // assign to original attribute name`,
  )
  .join('\n')}
      
  vec2 currentPoint = gl_FragCoord.xy / u_pixelRatio;
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  vec2 worldPos = pxToWorld(currentPoint);
  if (
    abs(u_renderExtent[0] - u_renderExtent[2]) > 0.0 && (
      worldPos[0] < u_renderExtent[0] ||
      worldPos[1] < u_renderExtent[1] ||
      worldPos[0] > u_renderExtent[2] ||
      worldPos[1] > u_renderExtent[3]
    )
  ) {
    discard;
  }
  #endif

  float segmentLength = length(v_segmentEnd - v_segmentStart);
  vec2 segmentTangent = (v_segmentEnd - v_segmentStart) / segmentLength;
  vec2 segmentNormal = vec2(-segmentTangent.y, segmentTangent.x);
  vec2 startToPoint = currentPoint - v_segmentStart;
  float lengthToPoint = max(0., min(dot(segmentTangent, startToPoint), segmentLength));
  float currentLengthPx = lengthToPoint + v_distanceOffsetPx;
  float currentRadiusPx = distanceFromSegment(currentPoint, v_segmentStart, v_segmentEnd);
  float currentRadiusRatio = dot(segmentNormal, startToPoint) * 2. / v_width;
  currentLineMetric = mix(v_measureStart, v_measureEnd, lengthToPoint / segmentLength);

  if (${this.discardExpression_}) { discard; }

  float capType = ${this.strokeCapExpression_};
  float joinType = ${this.strokeJoinExpression_};
  float segmentStartDistance = computeSegmentPointDistance(currentPoint, v_segmentStart, v_segmentEnd, v_width, v_angleStart, capType, joinType);
  float segmentEndDistance = computeSegmentPointDistance(currentPoint, v_segmentEnd, v_segmentStart, v_width, v_angleEnd, capType, joinType);
  float distanceField = max(
    segmentDistanceField(currentPoint, v_segmentStart, v_segmentEnd, v_width),
    max(segmentStartDistance, segmentEndDistance)
  );
  distanceField = max(distanceField, ${this.strokeDistanceFieldExpression_});

  vec4 color = ${this.strokeColorExpression_};
  color.a *= smoothstep(0.5, -0.5, distanceField);
  gl_FragColor = color;
  gl_FragColor.a *= u_globalAlpha;
  gl_FragColor.rgb *= gl_FragColor.a;
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

    return `${COMMON_HEADER}
${this.uniforms_.map((uniform) => `uniform ${uniform};`).join('\n')}
attribute vec2 a_position;
attribute vec4 a_hitColor;

varying vec4 v_hitColor;

${this.attributes_
  .map(
    (attribute) => `attribute ${attribute.type} ${attribute.name};
varying ${attribute.varyingType} ${attribute.varyingName};`,
  )
  .join('\n')}
${this.vertexShaderFunctions_.join('\n')}
void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, u_depth, 1.0);
  v_hitColor = a_hitColor;
${this.attributes_
  .map(
    (attribute) =>
      `  ${attribute.varyingName} = ${attribute.varyingExpression};`,
  )
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

    return `${COMMON_HEADER}
${this.uniforms_.map((uniform) => `uniform ${uniform};`).join('\n')}
varying vec4 v_hitColor;
${this.attributes_
  .map(
    (attribute) => `varying ${attribute.varyingType} ${attribute.varyingName};`,
  )
  .join('\n')}
${this.fragmentShaderFunctions_.join('\n')}
vec2 pxToWorld(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return (u_screenToWorldMatrix * vec4(screenPos, 0.0, 1.0)).xy;
}

vec2 worldToPx(vec2 worldPos) {
  vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
  return (0.5 * screenPos.xy + 0.5) * u_viewportSizePx;
}

void main(void) {
${this.attributes_
  .map(
    (attribute) =>
      `  ${attribute.varyingType} ${attribute.name} = ${attribute.varyingName}; // assign to original attribute name`,
  )
  .join('\n')}
  vec2 pxPos = gl_FragCoord.xy / u_pixelRatio;
  vec2 pxOrigin = worldToPx(u_patternOrigin);
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  vec2 worldPos = pxToWorld(pxPos);
  if (
    abs(u_renderExtent[0] - u_renderExtent[2]) > 0.0 && (
      worldPos[0] < u_renderExtent[0] ||
      worldPos[1] < u_renderExtent[1] ||
      worldPos[0] > u_renderExtent[2] ||
      worldPos[1] > u_renderExtent[3]
    )
  ) {
    discard;
  }
  #endif
  if (${this.discardExpression_}) { discard; }
  gl_FragColor = ${this.fillColorExpression_};
  gl_FragColor.a *= u_globalAlpha;
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`;
  }
}
