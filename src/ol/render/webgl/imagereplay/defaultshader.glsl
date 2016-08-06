//! NAMESPACE=ol.render.webgl.imagereplay.defaultshader
//! CLASS=ol.render.webgl.imagereplay.defaultshader


//! COMMON
varying vec2 v_texCoord;
varying float v_opacity;

//! VERTEX
attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_offsets;
attribute float a_opacity;
attribute float a_rotateWithView;

uniform mat4 u_projectionMatrix;
uniform mat4 u_offsetScaleMatrix;
uniform mat4 u_offsetRotateMatrix;

void main(void) {
  mat4 offsetMatrix = u_offsetScaleMatrix;
  if (a_rotateWithView == 1.0) {
    offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
  }
  vec4 offsets = offsetMatrix * vec4(a_offsets, 0., 0.);
  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.) + offsets;
  v_texCoord = a_texCoord;
  v_opacity = a_opacity;
}


//! FRAGMENT
uniform float u_opacity;
uniform sampler2D u_image;

void main(void) {
  vec4 texColor = texture2D(u_image, v_texCoord);
  gl_FragColor.rgb = texColor.rgb;
  float alpha = texColor.a * v_opacity * u_opacity;
  if (alpha == 0.0) {
    discard;
  }
  gl_FragColor.a = alpha;
}
