import {ShaderBuilder} from '../../../../../src/ol/webgl/ShaderBuilder.js';
import {
  arrayToGlsl,
  colorToGlsl,
  numberToGlsl,
} from '../../../../../src/ol/style/expressions.js';

describe('ol.webgl.ShaderBuilder', function () {
  describe('getSymbolVertexShader', function () {
    it('generates a symbol vertex shader (with varying)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;


attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = 0.0;
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
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_hitColor = a_hitColor;
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });
    it('generates a symbol vertex shader (with uniforms and attributes)', function () {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;

uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;
attribute vec2 a_myAttr;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;


void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = 0.0;
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
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_hitColor = a_hitColor;

}`);
    });
    it('generates a symbol vertex shader (with rotateWithView)', function () {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setSymbolRotateWithView(true);

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;


attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;


void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = 0.0;
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
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_hitColor = a_hitColor;

}`);
    });

    it('generates a symbol vertex shader (with a rotation expression)', function () {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolRotationExpression('u_time * 0.2');

      expect(builder.getSymbolVertexShader()).to.eql(`precision mediump float;
uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;


attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;


void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec2 halfSize = vec2(6.0) * 0.5;
  vec2 offset = vec2(5.0, -7.0);
  float angle = u_time * 0.2;
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
  vec4 texCoord = vec4(0.0, 0.0, 1.0, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  u = a_index == 0.0 || a_index == 3.0 ? 0.0 : 1.0;
  v = a_index == 2.0 || a_index == 3.0 ? 0.0 : 1.0;
  v_quadCoord = vec2(u, v);
  v_hitColor = a_hitColor;

}`);
    });

    it('returns null if no color or size specified', function () {
      const builder = new ShaderBuilder();
      builder.setSymbolRotationExpression('1.0');
      builder.setSymbolOffsetExpression('vec2(1.0)');
      builder.setSymbolRotateWithView('0.0');
      expect(builder.getSymbolVertexShader()).to.be(null);
    });
  });
  describe('getSymbolFragmentShader', function () {
    it('generates a symbol fragment shader (with varying)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolFragmentShader()).to.eql(`precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;

void main(void) {
  if (false) { discard; }
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });
    it('generates a symbol fragment shader (with uniforms)', function () {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addUniform('vec2 u_myUniform2');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([255, 255, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getSymbolFragmentShader()).to.eql(`precision mediump float;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform mediump int u_hitDetection;
uniform float u_myUniform;
uniform vec2 u_myUniform2;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;


void main(void) {
  if (u_myUniform > 0.5) { discard; }
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });

    it('returns null if no color or size specified', function () {
      const builder = new ShaderBuilder();
      builder.setSymbolRotationExpression('1.0');
      builder.setSymbolOffsetExpression('vec2(1.0)');
      builder.setSymbolRotateWithView('0.0');
      expect(builder.getSymbolFragmentShader()).to.be(null);
    });
  });
  describe('getStrokeVertexShader', function () {
    it('generates a stroke vertex shader (with uniforms, varying and attributes)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setStrokeWidthExpression(numberToGlsl(4));
      builder.setStrokeColorExpression(colorToGlsl([80, 0, 255, 1]));

      expect(builder.getStrokeVertexShader()).to
        .eql(`#ifdef GL_FRAGMENT_PRECISION_HIGH
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
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec2 a_segmentStart;
attribute vec2 a_segmentEnd;
attribute float a_parameters;
attribute vec4 a_hitColor;
attribute vec2 a_myAttr;
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;

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
  float lineWidth = 4.0;
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
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });

    it('returns null if no color or size specified', function () {
      const builder = new ShaderBuilder();
      expect(builder.getStrokeVertexShader()).to.be(null);
    });
  });
  describe('getStrokeFragmentShader', function () {
    it('generates a stroke fragment shader (with varying, attribute and uniform)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setStrokeWidthExpression(numberToGlsl(4));
      builder.setStrokeColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getStrokeFragmentShader()).to
        .eql(`#ifdef GL_FRAGMENT_PRECISION_HIGH
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
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

uniform float u_myUniform;
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;

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
  if (u_myUniform > 0.5) { discard; }
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0) * u_globalAlpha;
  gl_FragColor *= segmentDistanceField(v_currentPoint, v_segmentStart, v_segmentEnd, v_width);
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });

    it('returns null if no color or size specified', function () {
      const builder = new ShaderBuilder();
      expect(builder.getStrokeFragmentShader()).to.be(null);
    });
  });
  describe('getFillVertexShader', function () {
    it('generates a fill vertex shader (with varying, attribute and uniform)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setFillColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getFillVertexShader()).to
        .eql(`#ifdef GL_FRAGMENT_PRECISION_HIGH
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
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

uniform float u_myUniform;
attribute vec2 a_position;
attribute vec4 a_hitColor;
attribute vec2 a_myAttr;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;

void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });

    it('returns null if no color specified', function () {
      const builder = new ShaderBuilder();
      expect(builder.getFillVertexShader()).to.be(null);
    });
  });
  describe('getFillFragmentShader', function () {
    it('generates a fill fragment shader (with varying, attribute and uniform)', function () {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setFillColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getFillFragmentShader()).to
        .eql(`#ifdef GL_FRAGMENT_PRECISION_HIGH
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
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

uniform float u_myUniform;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;

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
  if (u_myUniform > 0.5) { discard; }
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0) * u_globalAlpha;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });

    it('returns null if no color specified', function () {
      const builder = new ShaderBuilder();
      expect(builder.getFillFragmentShader()).to.be(null);
    });
  });

  describe('addVertexShaderFunction', () => {
    const FN1 = `vec4 getRed() { return vec4(1.0, 0.0, 0.0, 1.0); }`;
    let builder;
    beforeEach(() => {
      builder = new ShaderBuilder();
      builder.addVertexShaderFunction(FN1);
      builder.setFillColorExpression('vec4(1.0)');
      builder.setStrokeColorExpression('vec4(1.0)');
      builder.setSymbolColorExpression('vec4(1.0)');
    });
    it('adds the function in all vertex shaders', () => {
      expect(builder.getFillVertexShader()).to.contain(FN1);
      expect(builder.getStrokeVertexShader()).to.contain(FN1);
      expect(builder.getSymbolVertexShader()).to.contain(FN1);
    });
  });

  describe('addFragmentShaderFunction', () => {
    const FN2 = `vec2 getUp() { return [1.0, 1.0]; }`;
    let builder;
    beforeEach(() => {
      builder = new ShaderBuilder();
      builder.addFragmentShaderFunction(FN2);
      builder.setFillColorExpression('vec4(1.0)');
      builder.setStrokeColorExpression('vec4(1.0)');
      builder.setSymbolColorExpression('vec4(1.0)');
    });
    it('adds the function in all vertex shaders', () => {
      expect(builder.getFillFragmentShader()).to.contain(FN2);
      expect(builder.getStrokeFragmentShader()).to.contain(FN2);
      expect(builder.getSymbolFragmentShader()).to.contain(FN2);
    });
  });
});
