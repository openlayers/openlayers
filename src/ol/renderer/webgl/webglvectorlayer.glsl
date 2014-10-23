//! NAMESPACE=ol.renderer.webgl.vectorlayer.shader
//! CLASS=ol.renderer.webgl.vectorlayer.shader.


//! COMMON

//! VERTEX
attribute vec2 a_position;
attribute vec2 a_offsets;

uniform mat4 u_projectionMatrix;

void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.) + vec4(a_offsets, 0., 0.);
}


//! FRAGMENT

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 0.0, 1);
}
