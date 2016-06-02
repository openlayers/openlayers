//! NAMESPACE=ol.render.webgl.polygonreplay.shader.Default
//! CLASS=ol.render.webgl.polygonreplay.shader.Default


//! COMMON
varying vec4 v_color;


//! VERTEX
attribute vec2 a_position;
attribute vec4 a_color;

uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;

void main(void) {
  v_color = a_color;
  mat4 offsetMatrix = u_offsetScaleMatrix;
  vec4 offsets = offsetMatrix * vec4(0., 0., 0., 0.);
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.) + offsets;
}


//! FRAGMENT

uniform float u_opacity;

void main(void) {
  gl_FragColor = v_color;
  float alpha = v_color.a * u_opacity;
  if (alpha == 0.0) {
    discard;
  }
  gl_FragColor.a = alpha;
}
