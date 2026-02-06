/**
 * @module ol/reproj/glreproj
 */
import {
  createEmpty,
  extend,
  getHeight,
  getTopLeft,
  getWidth,
} from '../extent.js';
import {WORKER_OFFSCREEN_CANVAS} from '../has.js';
import * as mat4 from '../vec/mat4.js';
import {Canvas as WebGLCanvas, createProgram} from '../webgl/Canvas.js';

const EDGE_VERTEX_SHADER = `
  attribute vec4 a_position;

  uniform mat4 u_matrix;

  void main() {
     gl_Position = u_matrix * a_position;
  }
`;
const EDGE_FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec4 u_val;
  void main() {
     gl_FragColor = u_val;
  }
`;

const TRIANGLE_VERTEX_SHADER = `
  attribute vec4 a_position;
  attribute vec2 a_texcoord;

  varying vec2 v_texcoord;

  uniform mat4 u_matrix;

  void main() {
     gl_Position = u_matrix * a_position;
     v_texcoord = a_texcoord;
  }
`;
const TRIANGLE_FRAGMENT_SHADER = `
  precision mediump float;

  varying vec2 v_texcoord;

  uniform sampler2D u_texture;

  void main() {
    if (v_texcoord.x < 0.0 || v_texcoord.x > 1.0 || v_texcoord.y < 0.0 || v_texcoord.y > 1.0) {
      discard;
    }
    gl_FragColor = texture2D(u_texture, v_texcoord);
  }
`;

/**
 * Create an html canvas element and returns its webgl context.
 * @param {number} [width] Canvas width.
 * @param {number} [height] Canvas height.
 * @param {Array<HTMLCanvasElement | OffscreenCanvas>} [canvasPool] Canvas pool to take existing canvas from.
 * @param {WebGLContextAttributes} [settings] CanvasRenderingContext2DSettings
 * @return {WebGLRenderingContext} The context.
 */
export function createCanvasContextWebGL(width, height, canvasPool, settings) {
  /** @type {HTMLCanvasElement|OffscreenCanvas} */
  let canvas;
  if (canvasPool && canvasPool.length) {
    canvas = /** @type {HTMLCanvasElement} */ (canvasPool.shift());
  } else if (WORKER_OFFSCREEN_CANVAS) {
    canvas = new OffscreenCanvas(width || 300, height || 300);
  } else {
    canvas = document.createElement('canvas');
  }
  if (width) {
    canvas.width = width;
  }
  if (height) {
    canvas.height = height;
  }
  //FIXME Allow OffscreenCanvasRenderingContext2D as return type
  return /** @type {WebGLRenderingContext} */ (
    canvas.getContext('webgl', settings)
  );
}

/**
 * Releases canvas memory to avoid exceeding memory limits in Safari.
 * See https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
 * @param {WebGLRenderingContext} gl Context.
 */
export function releaseGLCanvas(gl) {
  const canvas = gl.canvas;
  canvas.width = 1;
  canvas.height = 1;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
}

/**
 * @type {Array<HTMLCanvasElement | OffscreenCanvas>}
 */
export const canvasGLPool = [];

/**
 * @typedef {Object} ImageExtent
 * @property {import("../extent.js").Extent} extent Extent.
 * @property {import("../extent.js").Extent} [clipExtent] Clip extent.
 * @property {WebGLTexture} texture Texture.
 * @property {number} width Width of texture.
 * @property {number} height Height of texture.
 */

/**
 * Renders the source data into new canvas based on the triangulation.
 *
 * @param {WebGLRenderingContext} gl the context to render in.
 * @param {number} width_ Width of the canvas.
 * @param {number} height_ Height of the canvas.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} sourceResolution Source resolution.
 * @param {number} targetResolution Target resolution.
 * @param {import("../extent.js").Extent} targetExtent Target extent (tile).
 * @param {import("../reproj/Triangulation.js").default} triangulation Calculated triangulation.
 * @param {Array<ImageExtent>} sources Array of sources.
 * @param {number} gutter Gutter of the sources.
 * @param {number} dataType What kind of data is the textures, must be gl.FLOAT or gl.UNSIGNED_BYTE
 * TODO: Allow setting renderEdges value in the data as this is done in "data-space".
 * @param {boolean | Array<number>} [renderEdges] Render reprojection edges.
 * @param {boolean} [interpolate] Use linear interpolation when resampling.
 * @param {boolean} [drawSingle] Draw single source images directly without stitchTexture.
 * @return {{framebuffer: WebGLFramebuffer, width: number, height: number, texture: WebGLTexture}} Canvas with reprojected data.
 */
export function render(
  gl,
  width_,
  height_,
  pixelRatio,
  sourceResolution,
  targetResolution,
  targetExtent,
  triangulation,
  sources,
  gutter,
  dataType,
  renderEdges,
  interpolate,
  drawSingle,
) {
  const width = Math.round(pixelRatio * width_);
  const height = Math.round(pixelRatio * height_);
  gl.canvas.width = width;
  gl.canvas.height = height;

  /** @type {WebGLFramebuffer | null} */
  let resultFrameBuffer;
  /** @type {WebGLTexture | null} */
  let resultTexture;
  {
    resultTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, resultTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (interpolate) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      dataType,
      null,
    );

    resultFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, resultFrameBuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      resultTexture,
      0,
    );
  }

  if (resultFrameBuffer === null) {
    throw new Error('Could not create framebuffer');
  }
  if (resultTexture === null) {
    throw new Error('Could not create texture');
  }

  if (sources.length === 0) {
    return {
      width,
      height,
      framebuffer: resultFrameBuffer,
      texture: resultTexture,
    };
  }

  const sourceDataExtent = createEmpty();
  sources.forEach(function (src, i, arr) {
    extend(sourceDataExtent, src.extent);
  });

  /** @type {WebGLTexture | null} */
  let stitchTexture;
  /** @type {number} */
  let stitchWidth;
  /** @type {number} */
  let stitchHeight;
  const stitchScale = 1 / sourceResolution;

  if (!drawSingle || sources.length !== 1 || gutter !== 0) {
    stitchTexture = gl.createTexture();
    if (resultTexture === null) {
      throw new Error('Could not create texture');
    }
    stitchWidth = Math.round(getWidth(sourceDataExtent) * stitchScale);
    stitchHeight = Math.round(getHeight(sourceDataExtent) * stitchScale);

    // Make sure we do not exceed the max texture size by lowering the resolution for this image.
    // https://github.com/openlayers/openlayers/pull/15860#issuecomment-2254123580
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const largeSide = Math.max(stitchWidth, stitchHeight);
    const scaleFactor = largeSide > maxTexSize ? maxTexSize / largeSide : 1;
    const stitchWidthFixed = Math.round(stitchWidth * scaleFactor);
    const stitchHeightFixed = Math.round(stitchHeight * scaleFactor);

    gl.bindTexture(gl.TEXTURE_2D, stitchTexture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (interpolate) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      stitchWidthFixed,
      stitchHeightFixed,
      0,
      gl.RGBA,
      dataType,
      null,
    );

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      stitchTexture,
      0,
    );
    const webGLCanvas = new WebGLCanvas(gl);

    sources.forEach(function (src, i, arr) {
      const xPos =
        (src.extent[0] - sourceDataExtent[0]) * stitchScale * scaleFactor;
      const yPos =
        -(src.extent[3] - sourceDataExtent[3]) * stitchScale * scaleFactor;
      const srcWidth = getWidth(src.extent) * stitchScale * scaleFactor;
      const srcHeight = getHeight(src.extent) * stitchScale * scaleFactor;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, stitchWidthFixed, stitchHeightFixed);

      if (src.clipExtent) {
        const xPos =
          (src.clipExtent[0] - sourceDataExtent[0]) * stitchScale * scaleFactor;
        const yPos =
          -(src.clipExtent[3] - sourceDataExtent[3]) *
          stitchScale *
          scaleFactor;
        const width = getWidth(src.clipExtent) * stitchScale * scaleFactor;
        const height = getHeight(src.clipExtent) * stitchScale * scaleFactor;
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(
          interpolate ? xPos : Math.round(xPos),
          interpolate ? yPos : Math.round(yPos),
          interpolate ? width : Math.round(xPos + width) - Math.round(xPos),
          interpolate ? height : Math.round(yPos + height) - Math.round(yPos),
        );
      }

      webGLCanvas.drawImage(
        src.texture,
        src.width,
        src.height,
        gutter,
        gutter,
        src.width - 2 * gutter,
        src.height - 2 * gutter,
        interpolate ? xPos : Math.round(xPos),
        interpolate ? yPos : Math.round(yPos),
        interpolate ? srcWidth : Math.round(xPos + srcWidth) - Math.round(xPos),
        interpolate
          ? srcHeight
          : Math.round(yPos + srcHeight) - Math.round(yPos),
        stitchWidthFixed,
        stitchHeightFixed,
      );

      gl.disable(gl.SCISSOR_TEST);
    });
    gl.deleteFramebuffer(fb);
  } else {
    stitchTexture = sources[0].texture;
    stitchWidth = sources[0].width;
    stitchHeight = sources[0].width;
  }

  const targetTopLeft = getTopLeft(targetExtent);
  const sourceTopLeft = getTopLeft(sourceDataExtent);

  const getUVs = (
    /** @type {Array<import("../coordinate.js").Coordinate>} */ target,
  ) => {
    const u0 =
      ((target[0][0] - targetTopLeft[0]) / targetResolution) * pixelRatio;
    const v0 =
      (-(target[0][1] - targetTopLeft[1]) / targetResolution) * pixelRatio;
    const u1 =
      ((target[1][0] - targetTopLeft[0]) / targetResolution) * pixelRatio;
    const v1 =
      (-(target[1][1] - targetTopLeft[1]) / targetResolution) * pixelRatio;
    const u2 =
      ((target[2][0] - targetTopLeft[0]) / targetResolution) * pixelRatio;
    const v2 =
      (-(target[2][1] - targetTopLeft[1]) / targetResolution) * pixelRatio;
    return {u1, v1, u0, v0, u2, v2};
  };

  gl.bindFramebuffer(gl.FRAMEBUFFER, resultFrameBuffer);
  gl.viewport(0, 0, width, height);

  // Draw source to reprojtile
  {
    /** @type {Array<number>} */
    const vertices = [];
    /** @type {Array<number>} */
    const texcoords = [];

    const triProgram = createProgram(
      gl,
      TRIANGLE_FRAGMENT_SHADER,
      TRIANGLE_VERTEX_SHADER,
    );
    gl.useProgram(triProgram);

    // Bind image
    const textureLocation = gl.getUniformLocation(triProgram, 'u_texture');
    gl.bindTexture(gl.TEXTURE_2D, stitchTexture);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(textureLocation, 0);

    // Calculate vert and tex coordinates.
    triangulation.getTriangles().forEach(function (triangle, i, arr) {
      const source = triangle.source;
      const target = triangle.target;
      // Make sure that everything is on pixel boundaries
      const {u1, v1, u0, v0, u2, v2} = getUVs(target);

      const su0 =
        (source[0][0] - sourceTopLeft[0]) / sourceResolution / stitchWidth;
      const sv0 =
        -(source[0][1] - sourceTopLeft[1]) / sourceResolution / stitchHeight;
      const su1 =
        (source[1][0] - sourceTopLeft[0]) / sourceResolution / stitchWidth;
      const sv1 =
        -(source[1][1] - sourceTopLeft[1]) / sourceResolution / stitchHeight;
      const su2 =
        (source[2][0] - sourceTopLeft[0]) / sourceResolution / stitchWidth;
      const sv2 =
        -(source[2][1] - sourceTopLeft[1]) / sourceResolution / stitchHeight;

      vertices.push(u1, v1, u0, v0, u2, v2);
      texcoords.push(su1, sv1, su0, sv0, su2, sv2);
    });

    // Convert pixel space to clip space.
    const matrix = mat4.orthographic(0, width, height, 0, -1, 1);
    const matrixLocation = gl.getUniformLocation(triProgram, 'u_matrix');
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    const positionLocation = gl.getAttribLocation(triProgram, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    const texcoordLocation = gl.getAttribLocation(triProgram, 'a_texcoord');
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoordLocation);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
  }

  if (renderEdges) {
    const edgeProgram = createProgram(
      gl,
      EDGE_FRAGMENT_SHADER,
      EDGE_VERTEX_SHADER,
    );
    gl.useProgram(edgeProgram);
    const matrix = mat4.orthographic(0, width, height, 0, -1, 1);
    const matrixLocation = gl.getUniformLocation(edgeProgram, 'u_matrix');
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    const burnval = Array.isArray(renderEdges) ? renderEdges : [0, 0, 0, 255];
    const burnvalLocation = gl.getUniformLocation(edgeProgram, 'u_val');
    const isFloat = true;
    if (isFloat) {
      gl.uniform4fv(burnvalLocation, burnval);
    } else {
      gl.uniform4iv(burnvalLocation, burnval);
    }

    const positionLocation = gl.getAttribLocation(edgeProgram, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    /** @type {Array<number>} */
    const lines = triangulation.getTriangles().reduce(function (
      /** @type {Array<number>} */ lines,
      triangle,
    ) {
      const target = triangle.target;
      const {u1, v1, u0, v0, u2, v2} = getUVs(target);

      return lines.concat([u1, v1, u0, v0, u0, v0, u2, v2, u2, v2, u1, v1]);
    }, []);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, lines.length / 2);
  }

  return {
    width,
    height,
    framebuffer: resultFrameBuffer,
    texture: resultTexture,
  };
}
