//! NAMESPACE=ol.renderer.webgl.vectorlayer2.shader.PointCollection
//! CLASS=ol.renderer.webgl.vectorlayer2.shader.PointCollection


//! VERTEX
attribute vec2 a_position;
uniform float u_pointSize;
uniform mat4 u_modelViewMatrix;

void main(void) {
  gl_Position = u_modelViewMatrix * vec4(a_position, 0., 1.);
  gl_PointSize = u_pointSize;
}


//! FRAGMENT
uniform vec4 u_color;

void main(void) {
  gl_FragColor = u_color;
}
