import {
  arrayToGlsl,
  colorToGlsl,
  numberToGlsl,
  stringToGlsl,
} from '../../../../../../src/ol/expr/gpu.js';
import {
  COMMON_HEADER,
  ShaderBuilder,
} from '../../../../../../src/ol/render/webgl/ShaderBuilder.js';

describe('ol.webgl.ShaderBuilder', () => {
  describe('getSymbolVertexShader', () => {
    it('generates a symbol vertex shader (with attributes)', () => {
      const builder = new ShaderBuilder();
      builder.addAttribute('a_opacity', 'float', numberToGlsl(0.4));
      builder.addAttribute('a_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`${COMMON_HEADER}

attribute vec2 a_position;
attribute vec2 a_localPosition;
attribute vec2 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;

attribute float a_opacity;
varying float v_opacity;
attribute vec3 a_test;
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
  vec2 offsetPx = centerOffsetPx + a_localPosition * halfSizePx * vec2(1., -1.);
  float angle = 0.0;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), u_depth, 0.);
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = mix(texCoord.s, texCoord.p, a_localPosition.x * 0.5 + 0.5);
  float v = mix(texCoord.t, texCoord.q, a_localPosition.y * 0.5 + 0.5);
  v_texCoord = vec2(u, v);
  v_hitColor = unpackColor(a_hitColor);
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
      builder.addUniform('u_myUniform', 'float');
      builder.addAttribute('a_myAttr', 'vec2');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolVertexShader()).to.eql(`${COMMON_HEADER}
uniform float u_myUniform;
attribute vec2 a_position;
attribute vec2 a_localPosition;
attribute vec2 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;

attribute vec2 a_myAttr;
varying vec2 v_myAttr;

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
  vec2 offsetPx = centerOffsetPx + a_localPosition * halfSizePx * vec2(1., -1.);
  float angle = 0.0;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), u_depth, 0.);
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = mix(texCoord.s, texCoord.p, a_localPosition.x * 0.5 + 0.5);
  float v = mix(texCoord.t, texCoord.q, a_localPosition.y * 0.5 + 0.5);
  v_texCoord = vec2(u, v);
  v_hitColor = unpackColor(a_hitColor);
  v_angle = angle;
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y);
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;
  v_myAttr = a_myAttr;
}`);
    });
    it('generates a symbol vertex shader (with rotateWithView)', () => {
      const builder = new ShaderBuilder();
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setSymbolRotateWithView(true);

      expect(builder.getSymbolVertexShader()).to.eql(`${COMMON_HEADER}

attribute vec2 a_position;
attribute vec2 a_localPosition;
attribute vec2 a_hitColor;

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
  vec2 offsetPx = centerOffsetPx + a_localPosition * halfSizePx * vec2(1., -1.);
  float angle = 0.0 + u_rotation;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), u_depth, 0.);
  vec4 texCoord = vec4(0.0, 0.5, 0.5, 1.0);
  float u = mix(texCoord.s, texCoord.p, a_localPosition.x * 0.5 + 0.5);
  float v = mix(texCoord.t, texCoord.q, a_localPosition.y * 0.5 + 0.5);
  v_texCoord = vec2(u, v);
  v_hitColor = unpackColor(a_hitColor);
  v_angle = angle;
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

      expect(builder.getSymbolVertexShader()).to.eql(`${COMMON_HEADER}

attribute vec2 a_position;
attribute vec2 a_localPosition;
attribute vec2 a_hitColor;

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
  vec2 offsetPx = centerOffsetPx + a_localPosition * halfSizePx * vec2(1., -1.);
  float angle = u_time * 0.2;
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), u_depth, 0.);
  vec4 texCoord = vec4(0.0, 0.0, 1.0, 1.0);
  float u = mix(texCoord.s, texCoord.p, a_localPosition.x * 0.5 + 0.5);
  float v = mix(texCoord.t, texCoord.q, a_localPosition.y * 0.5 + 0.5);
  v_texCoord = vec2(u, v);
  v_hitColor = unpackColor(a_hitColor);
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
    it('generates a symbol fragment shader (with attributes)', () => {
      const builder = new ShaderBuilder();
      builder.addAttribute('a_opacity', 'float', numberToGlsl(0.4));
      builder.addAttribute('a_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([80, 0, 255]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));

      expect(builder.getSymbolFragmentShader()).to.eql(`${COMMON_HEADER}

varying vec2 v_texCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;
varying float v_opacity;
varying vec3 v_test;


void main(void) {
  float a_opacity = v_opacity; // assign to original attribute name
  vec3 a_test = v_test; // assign to original attribute name
  if (false) { discard; }
  vec2 coordsPx = gl_FragCoord.xy / u_pixelRatio - v_centerPx; // relative to center
  float c = cos(v_angle);
  float s = sin(v_angle);
  coordsPx = vec2(c * coordsPx.x - s * coordsPx.y, s * coordsPx.x + c * coordsPx.y);
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.05) { discard; };
    gl_FragColor = v_hitColor;
  }
}`);
    });
    it('generates a symbol fragment shader (with uniforms)', () => {
      const builder = new ShaderBuilder();
      builder.addUniform('u_myUniform', 'float');
      builder.addUniform('u_myUniform2', 'vec2');
      builder.setSymbolSizeExpression(`vec2(${numberToGlsl(6)})`);
      builder.setSymbolOffsetExpression(arrayToGlsl([5, -7]));
      builder.setSymbolColorExpression(colorToGlsl([255, 255, 255, 1]));
      builder.setTextureCoordinateExpression(arrayToGlsl([0, 0.5, 0.5, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getSymbolFragmentShader()).to.eql(`${COMMON_HEADER}
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
  gl_FragColor.rgb *= gl_FragColor.a;
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
      builder.addAttribute('a_opacity', 'float', numberToGlsl(0.4));
      builder.addAttribute('a_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addAttribute('a_myAttr', 'vec2');
      builder.addUniform('u_myUniform', 'float');
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
        expect(builder.getStrokeVertexShader()).to.eql(`${COMMON_HEADER}
uniform float u_myUniform;
attribute vec2 a_segmentStart;
attribute vec2 a_segmentEnd;
attribute vec2 a_localPosition;
attribute float a_measureStart;
attribute float a_measureEnd;
attribute float a_angleTangentSum;
attribute float a_distanceLow;
attribute float a_distanceHigh;
attribute vec2 a_joinAngles;
attribute vec2 a_hitColor;

varying vec2 v_segmentStartPx;
varying vec2 v_segmentEndPx;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distancePx;
varying float v_measureStart;
varying float v_measureEnd;

attribute float a_opacity;
varying float v_opacity;
attribute vec3 a_test;
varying vec3 v_test;
attribute vec2 a_myAttr;
varying vec2 v_myAttr;

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
  float startEndRatio = a_localPosition.x * 0.5 + 0.5;
  currentLineMetric = mix(a_measureStart, a_measureEnd, startEndRatio);
  // we're reading the fractional part while keeping the sign (so -4.12 gives -0.12, 3.45 gives 0.45)

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
  float normalDir = -1. * a_localPosition.y;
  float tangentDir = -1. * a_localPosition.x;
  float angle = mix(v_angleStart, v_angleEnd, startEndRatio);
  vec2 joinDirection;
  vec2 positionPx = mix(segmentStartPx, segmentEndPx, startEndRatio);
  // if angle is too high, do not make a proper join
  if (cos(angle) > 0.985 || isCap(angle)) {
    joinDirection = normalPx * normalDir - tangentPx * tangentDir;
  } else {
    joinDirection = getJoinOffsetDirection(normalPx * normalDir, angle);
  }
  positionPx = positionPx + joinDirection * (lineWidth * 0.5 + 1.); // adding 1 pixel for antialiasing
  gl_Position = pxToScreen(positionPx);

  v_segmentStartPx = segmentStartPx;
  v_segmentEndPx = segmentEndPx;
  v_width = lineWidth;
  v_hitColor = unpackColor(a_hitColor);

  v_distancePx = a_distanceLow / u_resolution - (lineOffsetPx * a_angleTangentSum);
  float distanceHighPx = a_distanceHigh / u_resolution;
  v_distancePx += distanceHighPx;

  v_measureStart = a_measureStart;
  v_measureEnd = a_measureEnd;
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
  v_myAttr = a_myAttr;
}`);
      });

      it('takes into account the pattern length expression if specified', () => {
        builder.setStrokePatternLengthExpression('10.0 * 3.0');
        expect(builder.getStrokeVertexShader()).to.contain(`
  v_distancePx = a_distanceLow / u_resolution - (lineOffsetPx * a_angleTangentSum);
  float distanceHighPx = a_distanceHigh / u_resolution;
  v_distancePx = mod(v_distancePx, 10.0 * 3.0);
  distanceHighPx = mod(distanceHighPx, 10.0 * 3.0);
  v_distancePx += distanceHighPx;
`);
      });

      it('returns null if no color or size specified', () => {
        const builder = new ShaderBuilder();
        expect(builder.getStrokeVertexShader()).to.be(null);
      });
    });
    describe('getStrokeFragmentShader', () => {
      it('generates a stroke fragment shader (with attribute and uniform)', () => {
        expect(builder.getStrokeFragmentShader()).to.eql(`${COMMON_HEADER}
uniform float u_myUniform;
varying vec2 v_segmentStartPx;
varying vec2 v_segmentEndPx;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distancePx;
varying float v_measureStart;
varying float v_measureEnd;
varying float v_opacity;
varying vec3 v_test;
varying vec2 v_myAttr;


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

float distanceFromSegment(vec2 point, vec2 start, vec2 end) {
  vec2 tangent = end - start;
  vec2 startToPoint = point - start;
  // inspire by capsule fn in https://iquilezles.org/articles/distfunctions/
  float h = clamp(dot(startToPoint, tangent) / dot(tangent, tangent), 0.0, 1.0);
  return length(startToPoint - tangent * h);
}

void main(void) {
  float a_opacity = v_opacity; // assign to original attribute name
  vec3 a_test = v_test; // assign to original attribute name
  vec2 a_myAttr = v_myAttr; // assign to original attribute name

  vec2 currentPointPx = gl_FragCoord.xy / u_pixelRatio;
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  vec2 worldPos = pxToWorld(currentPointPx);
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

  float segmentLengthPx = length(v_segmentEndPx - v_segmentStartPx);
  segmentLengthPx = max(segmentLengthPx, 1.17549429e-38); // avoid divide by zero
  vec2 segmentTangent = (v_segmentEndPx - v_segmentStartPx) / segmentLengthPx;
  vec2 segmentNormal = vec2(-segmentTangent.y, segmentTangent.x);
  vec2 startToPointPx = currentPointPx - v_segmentStartPx;
  float lengthToPointPx = max(0., min(dot(segmentTangent, startToPointPx), segmentLengthPx));
  float currentLengthPx = lengthToPointPx + v_distancePx;
  float currentRadiusPx = distanceFromSegment(currentPointPx, v_segmentStartPx, v_segmentEndPx);
  float currentRadiusRatio = dot(segmentNormal, startToPointPx) * 2. / v_width;
  currentLineMetric = mix(v_measureStart, v_measureEnd, lengthToPointPx / segmentLengthPx);

  if (u_myUniform > 0.5) { discard; }

  float capType = ${stringToGlsl('butt')};
  float joinType = ${stringToGlsl('bevel')};
  float segmentStartDistance = computeSegmentPointDistance(currentPointPx, v_segmentStartPx, v_segmentEndPx, v_width, v_angleStart, capType, joinType);
  float segmentEndDistance = computeSegmentPointDistance(currentPointPx, v_segmentEndPx, v_segmentStartPx, v_width, v_angleEnd, capType, joinType);
  float distanceField = max(
    segmentDistanceField(currentPointPx, v_segmentStartPx, v_segmentEndPx, v_width),
    max(segmentStartDistance, segmentEndDistance)
  );
  distanceField = max(distanceField, cos(currentLengthPx));

  vec4 color = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
  color.a *= smoothstep(0.5, -0.5, distanceField);
  gl_FragColor = color;
  gl_FragColor.a *= u_globalAlpha;
  gl_FragColor.rgb *= gl_FragColor.a;
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
    it('generates a fill vertex shader (with attribute and uniform)', () => {
      const builder = new ShaderBuilder();
      builder.addAttribute('a_opacity', 'float', numberToGlsl(0.4));
      builder.addAttribute('a_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addAttribute('a_myAttr', 'vec2');
      builder.addUniform('u_myUniform', 'float');
      builder.setFillColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getFillVertexShader()).to.eql(`${COMMON_HEADER}
uniform float u_myUniform;
attribute vec2 a_position;
attribute vec2 a_hitColor;

varying vec4 v_hitColor;

attribute float a_opacity;
varying float v_opacity;
attribute vec3 a_test;
varying vec3 v_test;
attribute vec2 a_myAttr;
varying vec2 v_myAttr;

void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, u_depth, 1.0);
  v_hitColor = unpackColor(a_hitColor);
  v_opacity = 0.4;
  v_test = vec3(1.0, 2.0, 3.0);
  v_myAttr = a_myAttr;
}`);
    });

    it('returns null if no color specified', () => {
      const builder = new ShaderBuilder();
      expect(builder.getFillVertexShader()).to.be(null);
    });
  });
  describe('getFillFragmentShader', () => {
    it('generates a fill fragment shader (with attribute and uniform)', () => {
      const builder = new ShaderBuilder();
      builder.addAttribute('a_opacity', 'float', numberToGlsl(0.4));
      builder.addAttribute('a_test', 'vec3', arrayToGlsl([1, 2, 3]));
      builder.addAttribute('a_myAttr', 'vec2');
      builder.addUniform('u_myUniform', 'float');
      builder.setFillColorExpression(colorToGlsl([80, 0, 255, 1]));
      builder.setFragmentDiscardExpression('u_myUniform > 0.5');

      expect(builder.getFillFragmentShader()).to.eql(`${COMMON_HEADER}
uniform float u_myUniform;
varying vec4 v_hitColor;
varying float v_opacity;
varying vec3 v_test;
varying vec2 v_myAttr;

vec2 pxToWorld(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return (u_screenToWorldMatrix * vec4(screenPos, 0.0, 1.0)).xy;
}

vec2 worldToPx(vec2 worldPos) {
  vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
  return (0.5 * screenPos.xy + 0.5) * u_viewportSizePx;
}

void main(void) {
  float a_opacity = v_opacity; // assign to original attribute name
  vec3 a_test = v_test; // assign to original attribute name
  vec2 a_myAttr = v_myAttr; // assign to original attribute name
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
  if (u_myUniform > 0.5) { discard; }
  gl_FragColor = vec4(0.3137254901960784, 0.0, 1.0, 1.0);
  gl_FragColor.a *= u_globalAlpha;
  gl_FragColor.rgb *= gl_FragColor.a;
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
