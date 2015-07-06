//! NAMESPACE=ol.render.webgl.polygonreplay.shader.Default
//! CLASS=ol.render.webgl.polygonreplay.shader.Default


//! COMMON
varying vec4 v_color;


//! VERTEX
attribute vec2 a_position;
attribute vec4 a_color;

uniform mat4 u_projectionMatrix;

void main(void) {
  v_color = a_color;
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.);
}


//! FRAGMENT

void main(void) {
  gl_FragColor = v_color;
}
