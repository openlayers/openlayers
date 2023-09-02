import {ShaderBuilder} from '../../../../../src/ol/webgl/ShaderBuilder.js';
import {
  arrayToGlsl,
  colorToGlsl,
  numberToGlsl,
  stringToGlsl,
} from '../../../../../src/ol/style/expressions.js';

describe('ol.webgl.ShaderBuilder', () => {
  describe('getSymbolVertexShader', () => {
    it('generates a symbol vertex shader (with varying)', () => {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;


attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;
varying float v_opacity;
varying vec3 v_test;

vec2 pxToScreen(vec2 coordPx) {
  vec2 scaled = coordPx / u_viewportSizePx / 0.5;
  
  return scaled;
}

vec2 screenToPx(vec2 coordScreen) {
  return (coordScreen * 0.5 + 0.5) * u_viewportSizePx;
}

void main(void) {
  v_quadSizePx = vec2(6.0);
  vec2 halfSizePx = v_quadSizePx * 0.5;
  vec2 centerOffsetPx = vec2(5.0, -7.0);
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
  float angle = 0.0;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), 0., 0.);
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  v_hitColor = a_hitColor;
  v_angle = angle;
  
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y); 
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
    });
    it('generates a symbol vertex shader (with uniforms and attributes)', () => {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;

uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;
attribute vec2 a_myAttr;
varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;


vec2 pxToScreen(vec2 coordPx) {
  vec2 scaled = coordPx / u_viewportSizePx / 0.5;
  
  return scaled;
}

vec2 screenToPx(vec2 coordScreen) {
  return (coordScreen * 0.5 + 0.5) * u_viewportSizePx;
}

void main(void) {
  v_quadSizePx = vec2(6.0);
  vec2 halfSizePx = v_quadSizePx * 0.5;
  vec2 centerOffsetPx = vec2(5.0, -7.0);
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
  float angle = 0.0;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), 0., 0.);
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  v_hitColor = a_hitColor;
  v_angle = angle;
  
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y); 
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;

}`);
    });
    it('generates a symbol vertex shader (with rotateWithView)', () => {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setSymbolRotateWithView(true);

      expect(builder.getSymbolVertexShader()).to
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;


attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;


vec2 pxToScreen(vec2 coordPx) {
  vec2 scaled = coordPx / u_viewportSizePx / 0.5;
  scaled = vec2(scaled.x * cos(-u_rotation) - scaled.y * sin(-u_rotation), scaled.x * sin(-u_rotation) + scaled.y * cos(-u_rotation));
  return scaled;
}

vec2 screenToPx(vec2 coordScreen) {
  return (coordScreen * 0.5 + 0.5) * u_viewportSizePx;
}

void main(void) {
  v_quadSizePx = vec2(6.0);
  vec2 halfSizePx = v_quadSizePx * 0.5;
  vec2 centerOffsetPx = vec2(5.0, -7.0);
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
  float angle = 0.0;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), 0., 0.);
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  v_hitColor = a_hitColor;
  v_angle = angle;
  v_angle += u_rotation;
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y); 
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;

}`);
    });

    it('generates a symbol vertex shader (with a rotation expression)', () => {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolRotationExpression('u_time * 0.2');

      expect(builder.getSymbolVertexShader()).to
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;


attribute vec2 a_position;
attribute float a_index;
attribute vec4 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;


vec2 pxToScreen(vec2 coordPx) {
  vec2 scaled = coordPx / u_viewportSizePx / 0.5;
  
  return scaled;
}

vec2 screenToPx(vec2 coordScreen) {
  return (coordScreen * 0.5 + 0.5) * u_viewportSizePx;
}

void main(void) {
  v_quadSizePx = vec2(6.0);
  vec2 halfSizePx = v_quadSizePx * 0.5;
  vec2 centerOffsetPx = vec2(5.0, -7.0);
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
  float angle = u_time * 0.2;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), 0., 0.);
  vec4 texCoord = vec4(0.0, 0.0, 1.0, 1.0);
  float u = a_index == 0.0 || a_index == 3.0 ? texCoord.s : texCoord.p;
  float v = a_index == 2.0 || a_index == 3.0 ? texCoord.t : texCoord.q;
  v_texCoord = vec2(u, v);
  v_hitColor = a_hitColor;
  v_angle = angle;
  
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y); 
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;

}`);
    });

    it('returns null if no color or size specified', () => {
      const builder = new ShaderBuilder();
      builder.setSymbolRotationExpression('1.0');
      builder.setSymbolOffsetExpression('vec2(1.0)');
      builder.setSymbolRotateWithView('0.0');
      expect(builder.getSymbolVertexShader()).to.be(null);
    });
  });
  describe('getSymbolFragmentShader', () => {
    it('generates a symbol fragment shader (with varying)', () => {
      const builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolFragmentShader()).to
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;


varying vec2 v_texCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;
varying float v_opacity;
varying vec3 v_test;


void main(void) {
  if (false) { discard; }
  vec2 coordsPx = gl_FragCoord.xy / u_pixelRatio - v_centerPx; // relative to center
  float c = cos(v_angle);
  float s = sin(v_angle);
  coordsPx = vec2(c * coordsPx.x - s * coordsPx.y, s * coordsPx.x + c * coordsPx.y);
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.05) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });
    it('generates a symbol fragment shader (with uniforms)', () => {
      const builder = new ShaderBuilder();
      builder.addUniform('float u_myUniform');
      builder.addUniform('vec2 u_myUniform2');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([255, 255, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getSymbolFragmentShader()).to
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;

uniform float u_myUniform;
uniform vec2 u_myUniform2;
varying vec2 v_texCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;



void main(void) {
  if (u_myUniform > 0.5) { discard; }
  vec2 coordsPx = gl_FragCoord.xy / u_pixelRatio - v_centerPx; // relative to center
  float c = cos(v_angle);
  float s = sin(v_angle);
  coordsPx = vec2(c * coordsPx.x - s * coordsPx.y, s * coordsPx.x + c * coordsPx.y);
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.05) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });

    it('returns null if no color or size specified', () => {
      const builder = new ShaderBuilder();
      builder.setSymbolRotationExpression('1.0');
      builder.setSymbolOffsetExpression('vec2(1.0)');
      builder.setSymbolRotateWithView('0.0');
      expect(builder.getSymbolFragmentShader()).to.be(null);
    });
  });
  describe('stroke shaders', () => {
    let builder;
    beforeEach(() => {
      builder = new ShaderBuilder();
      builder.addVarying('v_opacity', 'float', numberToGlsl(0.4));
      builder.addVarying('v_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addUniform('float u_myUniform');
      builder.addAttribute('vec2 a_myAttr');
      builder.setStrokeWidthExpression(numberToGlsl(4));
      builder.setStrokeColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setStrokeCapExpression(stringToGlsl('butt'));
      builder.setStrokeJoinExpression(stringToGlsl('bevel'));
      builder.setStrokeMiterLimitExpression('12.34');
      builder.setStrokeDistanceFieldExpression('cos(currentLengthPx)');
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');
    });

    describe('getStrokeVertexShader', () => {
      it('generates a stroke vertex shader (with uniforms, varying and attributes)', () => {
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;

uniform float u_myUniform;
attribute vec2 a_position;
attribute float a_index;
attribute vec2 a_segmentStart;
attribute vec2 a_segmentEnd;
attribute float a_parameters;
attribute float a_distance;
attribute vec2 a_joinAngles;
attribute vec4 a_hitColor;
attribute vec2 a_myAttr;
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distanceOffsetPx;
varying float v_opacity;
varying vec3 v_test;

vec2 worldToPx(vec2 worldPos) {
  vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
  return (0.5 * screenPos.xy + 0.5) * u_viewportSizePx;
}

vec4 pxToScreen(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return vec4(screenPos, 0.0, 1.0);
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
  float vertexNumber = a_parameters;

  float lineWidth = 4.0;
  float lineOffsetPx = 0.;

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
  if (cos(angle) > 0.985 || isCap(angle)) {
    joinDirection = normalPx * normalDir - tangentPx * tangentDir;
  } else {
    joinDirection = getJoinOffsetDirection(normalPx * normalDir, angle);
  }
  positionPx = positionPx + joinDirection * lineWidth * 0.5;
  gl_Position = pxToScreen(positionPx);

  v_segmentStart = segmentStartPx;
  v_segmentEnd = segmentEndPx;
  v_width = lineWidth;
  v_hitColor = a_hitColor;
  v_distanceOffsetPx = a_distance / u_resolution;
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
}`);
      });

      it('returns null if no color or size specified', () => {
        const builder = new ShaderBuilder();
        expect(builder.getStrokeVertexShader()).to.be(null);
      });
    });
    describe('getStrokeFragmentShader', () => {
      it('generates a stroke fragment shader (with varying, attribute and uniform)', () => {
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;

uniform float u_myUniform;
varying vec2 v_segmentStart;
varying vec2 v_segmentEnd;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distanceOffsetPx;
varying float v_opacity;
varying vec3 v_test;


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
  if (cos(joinAngle) > 0.985) { // avoid risking a division by zero
    return bevelJoinField(point, start, end, width, joinAngle);
  }
  float miterLength = 1. / sin(joinAngle * 0.5);
  float miterLimit = 12.34;
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

void main(void) {
  vec2 currentPoint = gl_FragCoord.xy / u_pixelRatio;
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  vec2 v_worldPos = pxToWorld(currentPoint);
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

  float segmentLength = length(v_segmentEnd - v_segmentStart);
  vec2 segmentTangent = (v_segmentEnd - v_segmentStart) / segmentLength;
  vec2 segmentNormal = vec2(-segmentTangent.y, segmentTangent.x);
  vec2 startToPoint = currentPoint - v_segmentStart;
  float currentLengthPx = max(0., min(dot(segmentTangent, startToPoint), segmentLength)) + v_distanceOffsetPx; 
  float currentRadiusPx = abs(dot(segmentNormal, startToPoint));
  vec4 color = vec4(0.3137254901960784, 0.0, 1.0, 1.0) * u_globalAlpha;
  float capType = ${stringToGlsl('butt')};
  float joinType = ${stringToGlsl('bevel')};
  float segmentStartDistance = computeSegmentPointDistance(currentPoint, v_segmentStart, v_segmentEnd, v_width, v_angleStart, capType, joinType);
  float segmentEndDistance = computeSegmentPointDistance(currentPoint, v_segmentEnd, v_segmentStart, v_width, v_angleEnd, capType, joinType);
  float distance = max(
    segmentDistanceField(currentPoint, v_segmentStart, v_segmentEnd, v_width),
    max(segmentStartDistance, segmentEndDistance)
  );
  distance = max(distance, cos(currentLengthPx));
  gl_FragColor = color * smoothstep(0., -1., distance);
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
      });

      it('returns null if no color or size specified', () => {
        const builder = new ShaderBuilder();
        expect(builder.getStrokeFragmentShader()).to.be(null);
      });
    });
  });

  describe('getFillVertexShader', () => {
    it('generates a fill vertex shader (with varying, attribute and uniform)', () => {
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;

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

    it('returns null if no color specified', () => {
      const builder = new ShaderBuilder();
      expect(builder.getFillVertexShader()).to.be(null);
    });
  });
  describe('getFillFragmentShader', () => {
    it('generates a fill fragment shader (with varying, attribute and uniform)', () => {
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
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform mediump int u_hitDetection;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;

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

    it('returns null if no color specified', () => {
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
