import * as mat4 from '../vec/mat4.js';

/**
 * @module ol/webgl/Canvas
 */

const VERTEX_SHADER = `
  attribute vec4 a_position;
  attribute vec4 a_texcoord;

  uniform mat4 u_matrix;
  uniform mat4 u_textureMatrix;

  varying vec2 v_texcoord;

  void main() {
    gl_Position = u_matrix * a_position;
    vec2 texcoord = (u_textureMatrix * a_texcoord).xy;
    v_texcoord = texcoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  varying vec2 v_texcoord;

  uniform sampler2D u_texture;

  void main() {
    if (
      v_texcoord.x < 0.0 ||
      v_texcoord.y < 0.0 ||
      v_texcoord.x > 1.0 ||
      v_texcoord.y > 1.0
    ) {
      discard;
    }
    gl_FragColor = texture2D(u_texture, v_texcoord);
  }
`;

/** @typedef {import("../transform.js").Transform} Matrix */

/**
 * Canvas-like operations implemented in webgl.
 */
export class Canvas {
  /**
   * @param {WebGLRenderingContext} gl Context to render in.
   */
  constructor(gl) {
    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = gl;

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.program_ = createProgram(gl, FRAGMENT_SHADER, VERTEX_SHADER);

    this.positionLocation = gl.getAttribLocation(this.program_, 'a_position');
    this.texcoordLocation = gl.getAttribLocation(this.program_, 'a_texcoord');

    this.matrixLocation = gl.getUniformLocation(this.program_, 'u_matrix');
    this.textureMatrixLocation = gl.getUniformLocation(
      this.program_,
      'u_textureMatrix',
    );
    this.textureLocation = gl.getUniformLocation(this.program_, 'u_texture');

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    this.positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.positions),
      gl.STATIC_DRAW,
    );

    this.texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);

    this.texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.texcoords),
      gl.STATIC_DRAW,
    );
  }

  /**
   * 2dContext drawImage call implemented in webgl.
   * Unlike images, textures do not have a width and height associated
   * with them so we'll pass in the width and height of the texture.
   *
   * @param {WebGLTexture} tex Image to draw.
   * @param {number} texWidth Image width.
   * @param {number} texHeight Image height.
   * @param {number} srcX Top-left x-point to read src image.
   * @param {number} srcY Top-left y-point to read src image.
   * @param {number} [srcWidth] Width of source to read.
   * @param {number} [srcHeight] Height of source to read.
   * @param {number} [dstX] Top-left x-point of destination.
   * @param {number} [dstY] Top-left y-point of destination.
   * @param {number} [dstWidth] Width of written image in destination.
   * @param {number} [dstHeight] Height of written image in destination.
   * @param {number} [width] Width of canvas.
   * @param {number} [height] Height of canvas.
   */
  drawImage(
    tex,
    texWidth,
    texHeight,
    srcX,
    srcY,
    srcWidth,
    srcHeight,
    dstX,
    dstY,
    dstWidth,
    dstHeight,
    width,
    height,
  ) {
    const gl = this.gl_;

    if (dstX === undefined) {
      dstX = srcX;
    }
    if (dstY === undefined) {
      dstY = srcY;
    }
    if (srcWidth === undefined) {
      srcWidth = texWidth;
    }
    if (srcHeight === undefined) {
      srcHeight = texHeight;
    }
    if (dstWidth === undefined) {
      dstWidth = srcWidth;
    }
    if (dstHeight === undefined) {
      dstHeight = srcHeight;
    }
    if (width === undefined) {
      width = gl.canvas.width;
    }
    if (height === undefined) {
      height = gl.canvas.height;
    }

    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.useProgram(this.program_);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
    gl.enableVertexAttribArray(this.texcoordLocation);
    gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // matrix for converting pixels to clip space
    let matrix = mat4.orthographic(0, width, 0, height, -1, 1);
    matrix = mat4.translate(matrix, dstX, dstY, 0);
    matrix = mat4.scale(matrix, dstWidth, dstHeight, 1);
    gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

    let texMatrix = mat4.translation(srcX / texWidth, srcY / texHeight, 0);
    texMatrix = mat4.scale(
      texMatrix,
      srcWidth / texWidth,
      srcHeight / texHeight,
      1,
    );

    gl.uniformMatrix4fv(this.textureMatrixLocation, false, texMatrix);
    gl.uniform1i(this.textureLocation, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.positions.length / 2);
  }
}

/**
 * @param {WebGLRenderingContext} gl Rendering Context.
 * @param {GLenum} type Type of shader.
 * @param {string} source source of shader.
 * @return {WebGLShader} [progam] The program.
 */
function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (shader === null) {
    throw new Error('Shader compilation failed');
  }

  gl.shaderSource(shader, source);

  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    if (log === null) {
      throw new Error('Shader info log creation failed');
    }
    throw new Error(log);
  }

  return shader;
}

/**
 * @param {WebGLRenderingContext} gl Rendering Context.
 * @param {string} fragmentSource Fragment shader source.
 * @param {string} vertexSource Vertex shader source.
 * @return {WebGLProgram} [progam] The program.
 */
export function createProgram(gl, fragmentSource, vertexSource) {
  const program = gl.createProgram();

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (program === null) {
    throw new Error('Program creation failed');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    if (log === null) {
      throw new Error('Program info log creation failed');
    }
    throw new Error();
  }
  return program;
}
