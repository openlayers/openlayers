/**
 * @module ol/webgl/PostProcessingPass
 */

export const postProcessVerticesBuffer = [
  -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1,
];

/**
 * @enum {string}
 */
export const PostProcessUniforms = {
  FRAMEBUFFER: 'u_image',
  OPACITY: 'u_opacity',
};

/**
 * @enum {string}
 */
export const PostProcessAttributes = {
  POSITION: 'a_position',
};

/**
 * @type {Array<import('./Helper.js').AttributeDescription>}
 */
export const postProcessAttributeDescriptions = [
  {
    name: PostProcessAttributes.POSITION,
    size: 2,
  },
];

export const postProcessDefaultVertexShader = `
  precision mediump float;

  attribute vec2 a_position;
  varying vec2 v_texCoord;
  varying vec2 v_screenCoord;

  uniform vec2 u_viewportSizePx;

  void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    v_screenCoord = v_texCoord * u_viewportSizePx;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const postProcessDefaultFragmentShader = `
  precision mediump float;

  uniform sampler2D u_image;
  uniform float u_opacity;

  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord) * u_opacity;
  }
`;
