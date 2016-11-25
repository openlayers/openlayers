//! NAMESPACE=ol.render.webgl.linestringreplay.defaultshader
//! CLASS=ol.render.webgl.linestringreplay.defaultshader


//! COMMON
varying float v_round;
varying vec2 v_roundVertex;
varying float v_halfWidth;


//! VERTEX
attribute vec2 a_lastPos;
attribute vec2 a_position;
attribute vec2 a_nextPos;
attribute float a_direction;

uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_lineWidth;
uniform float u_miterLimit;

bool nearlyEquals(in float value, in float ref) {
  float epsilon = 0.000000000001;
  return value >= ref - epsilon && value <= ref + epsilon;
}

void alongNormal(out vec2 offset, in vec2 nextP, in float turnDir, in float direction) {
  vec2 dirVect = nextP - a_position;
  vec2 normal = normalize(vec2(-turnDir * dirVect.y, turnDir * dirVect.x));
  offset = u_lineWidth / 2.0 * normal * direction;
}

void miterUp(out vec2 offset, out float round, in bool isRound, in float direction) {
  float halfWidth = u_lineWidth / 2.0;
  vec2 tangent = normalize(normalize(a_nextPos - a_position) + normalize(a_position - a_lastPos));
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec2 dirVect = a_nextPos - a_position;
  vec2 tmpNormal = normalize(vec2(-dirVect.y, dirVect.x));
  float miterLength = abs(halfWidth / dot(normal, tmpNormal));
  offset = normal * direction * miterLength;
  round = 0.0;
  if (isRound) {
    round = 1.0;
  } else if (miterLength > u_miterLimit + u_lineWidth) {
    offset = halfWidth * tmpNormal * direction;
  }
}

bool miterDown(out vec2 offset, in vec4 projPos, in mat4 offsetMatrix, in float direction) {
  bool degenerate = false;
  vec2 tangent = normalize(normalize(a_nextPos - a_position) + normalize(a_position - a_lastPos));
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec2 dirVect = a_lastPos - a_position;
  vec2 tmpNormal = normalize(vec2(-dirVect.y, dirVect.x));
  vec2 longOffset, shortOffset, longVertex;
  vec4 shortProjVertex;
  float halfWidth = u_lineWidth / 2.0;
  if (length(a_nextPos - a_position) > length(a_lastPos - a_position)) {
    longOffset = tmpNormal * direction * halfWidth;
    shortOffset = normalize(vec2(dirVect.y, -dirVect.x)) * direction * halfWidth;
    longVertex = a_nextPos;
    shortProjVertex = u_projectionMatrix * vec4(a_lastPos, 0.0, 1.0);
  } else {
    shortOffset = tmpNormal * direction * halfWidth;
    longOffset = normalize(vec2(dirVect.y, -dirVect.x)) * direction * halfWidth;
    longVertex = a_lastPos;
    shortProjVertex = u_projectionMatrix * vec4(a_nextPos, 0.0, 1.0);
  }
  //Intersection algorithm based on theory by Paul Bourke (http://paulbourke.net/geometry/pointlineplane/).
  vec4 p1 = u_projectionMatrix * vec4(longVertex, 0.0, 1.0) + offsetMatrix * vec4(longOffset, 0.0, 0.0);
  vec4 p2 = projPos + offsetMatrix * vec4(longOffset, 0.0, 0.0);
  vec4 p3 = shortProjVertex + offsetMatrix * vec4(-shortOffset, 0.0, 0.0);
  vec4 p4 = shortProjVertex + offsetMatrix * vec4(shortOffset, 0.0, 0.0);
  float denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  float firstU = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  float secondU = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  float epsilon = 0.000000000001;
  if (firstU > epsilon && firstU < 1.0 - epsilon && secondU > epsilon && secondU < 1.0 - epsilon) {
    shortProjVertex.x = p1.x + firstU * (p2.x - p1.x);
    shortProjVertex.y = p1.y + firstU * (p2.y - p1.y);
    offset = shortProjVertex.xy;
    degenerate = true;
  } else {
    float miterLength = abs(halfWidth / dot(normal, tmpNormal));
    offset = normal * direction * miterLength;
  }
  return degenerate;
}

void squareCap(out vec2 offset, out float round, in bool isRound, in vec2 nextP,
    in float turnDir, in float direction) {
  round = 0.0;
  vec2 dirVect = a_position - nextP;
  vec2 firstNormal = normalize(dirVect);
  vec2 secondNormal = vec2(turnDir * firstNormal.y * direction, -turnDir * firstNormal.x * direction);
  vec2 hypotenuse = normalize(firstNormal - secondNormal);
  vec2 normal = vec2(turnDir * hypotenuse.y * direction, -turnDir * hypotenuse.x * direction);
  float length = sqrt(v_halfWidth * v_halfWidth * 2.0);
  offset = normal * length;
  if (isRound) {
    round = 1.0;
  }
}

void main(void) {
  bool degenerate = false;
  float direction = float(sign(a_direction));
  mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  vec2 offset;
  vec4 projPos = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  bool round = nearlyEquals(mod(a_direction, 2.0), 0.0);

  v_round = 0.0;
  v_halfWidth = u_lineWidth / 2.0;
  v_roundVertex = projPos.xy;

  if (nearlyEquals(mod(a_direction, 3.0), 0.0) || nearlyEquals(mod(a_direction, 17.0), 0.0)) {
    alongNormal(offset, a_nextPos, 1.0, direction);
  } else if (nearlyEquals(mod(a_direction, 5.0), 0.0) || nearlyEquals(mod(a_direction, 13.0), 0.0)) {
    alongNormal(offset, a_lastPos, -1.0, direction);
  } else if (nearlyEquals(mod(a_direction, 23.0), 0.0)) {
    miterUp(offset, v_round, round, direction);
  } else if (nearlyEquals(mod(a_direction, 19.0), 0.0)) {
    degenerate = miterDown(offset, projPos, offsetMatrix, direction);
  } else if (nearlyEquals(mod(a_direction, 7.0), 0.0)) {
    squareCap(offset, v_round, round, a_nextPos, 1.0, direction);
  } else if (nearlyEquals(mod(a_direction, 11.0), 0.0)) {
    squareCap(offset, v_round, round, a_lastPos, -1.0, direction);
  }
  if (!degenerate) {
    vec4 offsets = offsetMatrix * vec4(offset, 0.0, 0.0);
    gl_Position = projPos + offsets;
  } else {
    gl_Position = vec4(offset, 0.0, 1.0);
  }
}


//! FRAGMENT

uniform float u_opacity;
uniform vec4 u_color;
uniform vec2 u_size;
uniform float u_pixelRatio;

void main(void) {
  if (v_round > 0.0) {
    vec2 windowCoords = vec2((v_roundVertex.x + 1.0) / 2.0 * u_size.x * u_pixelRatio,
        (v_roundVertex.y + 1.0) / 2.0 * u_size.y * u_pixelRatio);
    if (length(windowCoords - gl_FragCoord.xy) > v_halfWidth * u_pixelRatio) {
      discard;
    }
  }
  gl_FragColor = u_color;
  float alpha = u_color.a * u_opacity;
  if (alpha == 0.0) {
    discard;
  }
  gl_FragColor.a = alpha;
}
