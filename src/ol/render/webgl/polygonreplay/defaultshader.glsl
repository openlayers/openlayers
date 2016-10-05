//! NAMESPACE=ol.render.webgl.polygonreplay.defaultshader
//! CLASS=ol.render.webgl.polygonreplay.defaultshader


//! COMMON


//! VERTEX
attribute vec2 a_position;

uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;

void main(void) {
  vec4 offsets = u_offsetScaleMatrix * vec4(0., 0., 0., 0.);
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.) + offsets;
}


//! FRAGMENT

uniform vec4 u_color;
uniform float u_opacity;

void main(void) {
  gl_FragColor = u_color;
  float alpha = u_color.a * u_opacity;
  if (alpha == 0.0) {
    discard;
  }
  gl_FragColor.a = alpha;
}
