//! NAMESPACE=ol.render.webgl.linestringreplay.shader.Default
//! CLASS=ol.render.webgl.linestringreplay.shader.Default


//! COMMON
varying float v_round;
varying vec4 v_roundVertex;
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
  v_halfWidth = u_lineWidth / 2.0;
  vec2 offset;
  v_round = 0.0;
  float direction = a_direction / abs(a_direction);
  vec4 projPos = u_projectionMatrix * vec4(a_position, 0., 1.);
  if (mod(a_direction, 3.0) == 0.0 || mod(a_direction, 17.0) == 0.0) {
    vec2 dirVect = a_nextPos - a_position;
    vec2 normal = normalize(vec2(-dirVect.y, dirVect.x));
    offset = v_halfWidth * normal * direction;
    if (mod(a_direction, 2.0) == 0.0) {
      v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
    }
  } else if (mod(a_direction, 5.0) == 0.0 || mod(a_direction, 13.0) == 0.0) {
    vec2 dirVect = a_lastPos - a_position;
    vec2 normal = normalize(vec2(dirVect.y, -dirVect.x));
    offset = v_halfWidth * normal * direction;
    if (mod(a_direction, 2.0) == 0.0) {
      v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
    }
  } else if (mod(a_direction, 19.0) == 0.0 || mod(a_direction, 23.0) == 0.0) {
    vec2 dirVect = a_nextPos - a_position;
    vec2 tmpNormal = normalize(vec2(-dirVect.y, dirVect.x));
    vec2 tangent = normalize(normalize(a_nextPos - a_position) + normalize(a_position - a_lastPos));
    vec2 normal = vec2(-tangent.y, tangent.x);
    float miterLength = v_halfWidth / dot(normal, tmpNormal);
    if (mod(a_direction, 23.0) == 0.0) {
      offset = normal * direction * miterLength;
      if (mod(a_direction, 2.0) == 0.0) {
        v_round = 1.0;
        v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
      } else if (miterLength > u_miterLimit) {
        offset = tmpNormal * direction * v_halfWidth;
      }
    } else {
      offset = normal * direction * miterLength;
      vec4 defaultOffset = u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
      vec4 firstProjPos = u_projectionMatrix * vec4(a_lastPos, 0., 1.) + defaultOffset;
      vec4 secondProjPos = projPos + defaultOffset;
      vec4 thirdProjPos = u_projectionMatrix * vec4(a_nextPos, 0., 1.) + defaultOffset;
      float firstSegLength = distance(secondProjPos.xy, firstProjPos.xy);
      float secondSegLength = distance(thirdProjPos.xy, secondProjPos.xy);
      float miterSegLength = distance(secondProjPos.xy, vec4(projPos + u_offsetScaleMatrix * vec4(offset, 0., 0.)).xy);
      //TODO: Write a more accurate method for identifying sharp angles.
      if (miterSegLength > min(firstSegLength, secondSegLength)) {
        if (firstSegLength < secondSegLength) {
          dirVect = a_lastPos - a_position;
          tmpNormal = normalize(vec2(dirVect.y, -dirVect.x));
          projPos = firstProjPos - defaultOffset;
        } else {
          projPos = thirdProjPos - defaultOffset;
        }
        offset = tmpNormal * direction * v_halfWidth;
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
      v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
    }
  }
  vec4 offsets = u_offsetScaleMatrix * vec4(offset, 0., 0.);
  gl_Position = projPos + offsets;
}


//! FRAGMENT

uniform float u_opacity;
uniform vec4 u_color;
uniform vec2 u_size;

void main(void) {
  if (v_round > 0.0) {
    vec2 windowCoords = vec2((v_roundVertex.x + 1.0) / 2.0 * u_size.x, (v_roundVertex.y + 1.0) / 2.0 * u_size.y);
    if (length(windowCoords - gl_FragCoord.xy) > v_halfWidth) {
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
