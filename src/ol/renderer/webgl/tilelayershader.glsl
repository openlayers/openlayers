//! NAMESPACE=ol.renderer.webgl.tilelayershader
//! CLASS=ol.renderer.webgl.tilelayershader


//! COMMON
varying vec2 v_texCoord;


//! VERTEX
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec4 u_tileOffset;

void main(void) {
  gl_Position = vec4(a_position * u_tileOffset.xy + u_tileOffset.zw, 0., 1.);
  v_texCoord = a_texCoord;
}


//! FRAGMENT
uniform sampler2D u_texture;

void main(void) {
  gl_FragColor = texture2D(u_texture, v_texCoord);
}
