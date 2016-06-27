//! NAMESPACE=ol.render.webgl.linestringreplay.shader.Default
//! CLASS=ol.render.webgl.linestringreplay.shader.Default


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
uniform float u_lineWidth;
uniform float u_miterLimit;

void main(void) {
  bool degenerate = false;
  v_halfWidth = u_lineWidth / 2.0;
  vec2 offset;
  v_round = 0.0;
  float direction = a_direction / abs(a_direction);
  vec4 projPos = u_projectionMatrix * vec4(a_position, 0., 1.);
  v_roundVertex = projPos.xy;
  if (mod(a_direction, 3.0) == 0.0 || mod(a_direction, 17.0) == 0.0) {
    vec2 dirVect = a_nextPos - a_position;
    vec2 normal = normalize(vec2(-dirVect.y, dirVect.x));
    offset = v_halfWidth * normal * direction;
  } else if (mod(a_direction, 5.0) == 0.0 || mod(a_direction, 13.0) == 0.0) {
    vec2 dirVect = a_lastPos - a_position;
    vec2 normal = normalize(vec2(dirVect.y, -dirVect.x));
    offset = v_halfWidth * normal * direction;
  } else if (mod(a_direction, 19.0) == 0.0 || mod(a_direction, 23.0) == 0.0) {
    vec2 dirVect = a_nextPos - a_position;
    vec2 tmpNormal = normalize(vec2(-dirVect.y, dirVect.x));
    vec2 tangent = normalize(normalize(a_nextPos - a_position) + normalize(a_position - a_lastPos));
    vec2 normal = vec2(-tangent.y, tangent.x);
    float miterLength = abs(v_halfWidth / dot(normal, tmpNormal));
    if (mod(a_direction, 23.0) == 0.0) {
      offset = normal * direction * miterLength;
      if (mod(a_direction, 2.0) == 0.0) {
        v_round = 1.0;
      } else if (miterLength > u_miterLimit) {
        offset = tmpNormal * direction * v_halfWidth;
      }
    } else {
      dirVect = a_lastPos - a_position;
      vec2 longOffset, shortOffset, longVertex;
      vec4 shortProjVertex;
      if (length(a_nextPos - a_position) > length(a_lastPos - a_position)) {
        longOffset = tmpNormal * direction * v_halfWidth;
        shortOffset = normalize(vec2(dirVect.y, -dirVect.x)) * direction * v_halfWidth;
        longVertex = a_nextPos;
        shortProjVertex = u_projectionMatrix * vec4(a_lastPos, 0., 1.);
      } else {
        shortOffset = tmpNormal * direction * v_halfWidth;
        longOffset = normalize(vec2(dirVect.y, -dirVect.x)) * direction * v_halfWidth;
        longVertex = a_lastPos;
        shortProjVertex = u_projectionMatrix * vec4(a_nextPos, 0., 1.);
      }
      //Intersection algorithm based on theory by Paul Bourke (http://paulbourke.net/geometry/pointlineplane/).
      vec4 p1 = u_projectionMatrix * vec4(longVertex, 0., 1.) + u_offsetScaleMatrix * vec4(longOffset, 0., 0.);
      vec4 p2 = projPos + u_offsetScaleMatrix * vec4(longOffset, 0., 0.);
      vec4 p3 = shortProjVertex + u_offsetScaleMatrix * vec4(-shortOffset, 0., 0.);
      vec4 p4 = shortProjVertex + u_offsetScaleMatrix * vec4(shortOffset, 0., 0.);
      float denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
      float epsilon = 0.000000000001;
      float firstU = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
      float secondU = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
      if (firstU > epsilon && firstU < 1.0 - epsilon && secondU > epsilon && secondU < 1.0 - epsilon) {
        gl_Position = shortProjVertex;
        gl_Position.x = p1.x + firstU * (p2.x - p1.x);
        gl_Position.y = p1.y + firstU * (p2.y - p1.y);
        degenerate = true;
      } else {
        offset = normal * direction * miterLength;
      }
    }
  } else if (mod(a_direction, 7.0) == 0.0 || mod(a_direction, 11.0) == 0.0) {
    vec2 normal;
    if (mod(a_direction, 7.0) == 0.0) {
      vec2 dirVect = a_position - a_nextPos;
      vec2 firstNormal = normalize(dirVect);
      vec2 secondNormal = vec2(firstNormal.y * direction, -firstNormal.x * direction);
      vec2 hypotenuse = normalize(firstNormal - secondNormal);
      normal = vec2(hypotenuse.y * direction, -hypotenuse.x * direction);
    } else {
      vec2 dirVect = a_position - a_lastPos;
      vec2 firstNormal = normalize(dirVect);
      vec2 secondNormal = vec2(-firstNormal.y * direction, firstNormal.x * direction);
      vec2 hypotenuse = normalize(firstNormal - secondNormal);
      normal = vec2(-hypotenuse.y * direction, hypotenuse.x * direction);
    }
    float length = sqrt(v_halfWidth * v_halfWidth * 2.0);
    offset = normal * length;
    if (mod(a_direction, 2.0) == 0.0) {
      v_round = 1.0;
    }
  }
  if (!degenerate) {
    vec4 offsets = u_offsetScaleMatrix * vec4(offset, 0., 0.);
    gl_Position = projPos + offsets;
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
