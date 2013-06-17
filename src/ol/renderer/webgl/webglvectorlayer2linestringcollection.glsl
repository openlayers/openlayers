//! NAMESPACE=ol.renderer.webgl.vectorlayer2.shader.LineStringCollection
//! CLASS=ol.renderer.webgl.vectorlayer2.shader.LineStringCollection


//! VERTEX
attribute vec2 a_position;
uniform mat4 u_modelViewMatrix;

void main(void) {
  gl_Position = u_modelViewMatrix * vec4(a_position, 0., 1.);
}


//! FRAGMENT
uniform vec4 u_color;

void main(void) {
  gl_FragColor = u_color;
}
