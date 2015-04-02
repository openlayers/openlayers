//! NAMESPACE=ol.render.webgl.polygonreplay.shader.Default
//! CLASS=ol.render.webgl.polygonreplay.shader.Default


//! COMMON


//! VERTEX
attribute vec2 a_position;

uniform mat4 u_projectionMatrix;

void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.);
}


//! FRAGMENT

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
