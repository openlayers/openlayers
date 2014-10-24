//! NAMESPACE=ol.renderer.webgl.vectorlayer.shader
//! CLASS=ol.renderer.webgl.vectorlayer.shader.


//! COMMON
varying vec2 v_texCoord;

//! VERTEX
attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_offsets;

uniform mat4 u_projectionMatrix;
uniform mat2 u_sizeMatrix;

void main(void) {
  vec2 offsets = u_sizeMatrix * a_offsets;
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.) + vec4(offsets, 0., 0.);
  v_texCoord = a_texCoord;
}


//! FRAGMENT
uniform sampler2D u_image;

void main(void) {
  gl_FragColor = texture2D(u_image, v_texCoord);
}
