//! NAMESPACE=ol.renderer.webgl.defaultmapshader


//! COMMON
varying vec2 v_texCoord;


//! VERTEX
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_texCoordMatrix;
uniform mat4 u_projectionMatrix;

void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.);
  v_texCoord = (u_texCoordMatrix * vec4(a_texCoord, 0., 1.)).st;
}


//! FRAGMENT
uniform float u_opacity;
uniform sampler2D u_texture;

void main(void) {
  vec4 texColor = texture2D(u_texture, v_texCoord);
  gl_FragColor.rgb = texColor.rgb;
  gl_FragColor.a = texColor.a * u_opacity;
}
