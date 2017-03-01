//! NAMESPACE=ol.render.webgl.circlereplay.defaultshader
//! CLASS=ol.render.webgl.circlereplay.defaultshader


//! COMMON
varying vec2 v_center;
varying vec2 v_offset;
varying float v_halfWidth;
varying float v_pixelRatio;


//! VERTEX
attribute vec2 a_position;
attribute float a_instruction;
attribute float a_radius;

uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;
uniform float u_lineWidth;
uniform float u_pixelRatio;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  v_center = vec4(u_projectionMatrix * vec4(a_position, 0.0, 1.0)).xy;
  v_pixelRatio = u_pixelRatio;
  float lineWidth = u_lineWidth * u_pixelRatio;
  v_halfWidth = lineWidth / 2.0;
  if (lineWidth == 0.0) {
    lineWidth = 2.0 * u_pixelRatio;
  }
  vec2 offset;
  // Radius with anitaliasing (roughly).
  float radius = a_radius + 3.0 * u_pixelRatio;
  // Until we get gl_VertexID in WebGL, we store an instruction.
  if (a_instruction == 0.0) {
    // Offsetting the edges of the triangle by lineWidth / 2 is necessary, however
    // we should also leave some space for the antialiasing, thus we offset by lineWidth.
    offset = vec2(-1.0, 1.0);
  } else if (a_instruction == 1.0) {
    offset = vec2(-1.0, -1.0);
  } else if (a_instruction == 2.0) {
    offset = vec2(1.0, -1.0);
  } else {
    offset = vec2(1.0, 1.0);
  }

  gl_Position = u_projectionMatrix * vec4(a_position + offset * radius, 0.0, 1.0) +
      offsetMatrix * vec4(offset * lineWidth, 0.0, 0.0);
  v_offset = vec4(u_projectionMatrix * vec4(a_position.x + a_radius, a_position.y,
      0.0, 1.0)).xy;

  if (distance(v_center, v_offset) > 20000.0) {
    gl_Position = vec4(v_center, 0.0, 1.0);
  }
}


//! FRAGMENT

uniform float u_opacity;
uniform vec4 u_fillColor;
uniform vec4 u_strokeColor;
uniform vec2 u_size;

void main(void) {
  vec2 windowCenter = vec2((v_center.x + 1.0) / 2.0 * u_size.x * v_pixelRatio,
      (v_center.y + 1.0) / 2.0 * u_size.y * v_pixelRatio);
  vec2 windowOffset = vec2((v_offset.x + 1.0) / 2.0 * u_size.x * v_pixelRatio,
      (v_offset.y + 1.0) / 2.0 * u_size.y * v_pixelRatio);
  float radius = length(windowCenter - windowOffset);
  float dist = length(windowCenter - gl_FragCoord.xy);
  if (dist > radius + v_halfWidth) {
    if (u_strokeColor.a == 0.0) {
      gl_FragColor = u_fillColor;
    } else {
      gl_FragColor = u_strokeColor;
    }
    gl_FragColor.a = gl_FragColor.a - (dist - (radius + v_halfWidth));
  } else if (u_fillColor.a == 0.0) {
    // Hooray, no fill, just stroke. We can use real antialiasing.
    gl_FragColor = u_strokeColor;
    if (dist < radius - v_halfWidth) {
      gl_FragColor.a = gl_FragColor.a - (radius - v_halfWidth - dist);
    }
  } else {
    gl_FragColor = u_fillColor;
    float strokeDist = radius - v_halfWidth;
    float antialias = 2.0 * v_pixelRatio;
    if (dist > strokeDist) {
      gl_FragColor = u_strokeColor;
    } else if (dist >= strokeDist - antialias) {
      float step = smoothstep(strokeDist - antialias, strokeDist, dist);
      gl_FragColor = mix(u_fillColor, u_strokeColor, step);
    }
  }
  gl_FragColor.a = gl_FragColor.a * u_opacity;
  if (gl_FragColor.a <= 0.0) {
    discard;
  }
}
