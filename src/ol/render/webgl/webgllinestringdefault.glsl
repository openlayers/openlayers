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
attribute float a_instruction;

uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform float u_lineWidth;
uniform float u_miterLimit;
uniform float u_round;

void main(void) {
  v_halfWidth = u_lineWidth / 2.0;
  vec2 offset;
  v_round = 0.0;
  vec4 projPos = u_projectionMatrix * vec4(a_position, 0., 1.);
  if (a_instruction == 0. || a_instruction == 4.) {
    vec2 dirVect = a_nextPos - a_position;
    vec2 normal = normalize(vec2(-dirVect.y, dirVect.x));
    offset = v_halfWidth * normal * a_direction;
    if (a_instruction == 4. && (u_round == 7. || u_round == 9.)) {
      v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
    }
  } else if (a_instruction == 1. || a_instruction == 3.) {
    vec2 dirVect = a_lastPos - a_position;
    vec2 normal = normalize(vec2(dirVect.y, -dirVect.x));
    offset = v_halfWidth * normal * a_direction;
    if (a_instruction == 3. && (u_round == 7. || u_round == 9.)) {
      v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
    }
  } else if (a_instruction == 5. || a_instruction == 6.) {
    vec2 dirVect = a_nextPos - a_position;
    vec2 tmpNormal = normalize(vec2(-dirVect.y, dirVect.x));
    vec2 tangent = normalize(normalize(a_nextPos - a_position) + normalize(a_position - a_lastPos));
    vec2 normal = vec2(tangent.y, -tangent.x);
    float miterLength = v_halfWidth / dot(normal, tmpNormal);
    if (a_instruction == 6.) {
      if (u_round == 7. || u_round == 9.) {
        offset = normal * a_direction * miterLength;
        v_round = 1.0;
        v_roundVertex = projPos + u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
      } else if (miterLength > u_miterLimit) {
        offset = tmpNormal * a_direction * v_halfWidth;
      } else {
        offset = normal * a_direction * miterLength;
      }
    } else if (a_instruction == 5.) {
      offset = normal * a_direction * miterLength;
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
        offset = tmpNormal * a_direction * v_halfWidth;
      }
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
