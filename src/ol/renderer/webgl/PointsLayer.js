/**
 * @module ol/renderer/webgl/PointsLayer
 */
import LayerRenderer from '../Layer';
import WebGLArrayBuffer from '../../webgl/Buffer';
import {DYNAMIC_DRAW, ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, FLOAT} from '../../webgl';
import WebGLHelper, {DefaultAttrib} from '../../webgl/Helper';
import GeometryType from '../../geom/GeometryType';

const VERTEX_SHADER = `
  precision mediump float;
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  attribute float a_rotateWithView;
  attribute vec2 a_offsets;
  attribute float a_opacity;
  attribute vec4 a_color;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
  varying vec2 v_texCoord;
  varying float v_opacity;
  varying vec4 v_color;
  
  void main(void) {
    mat4 offsetMatrix = u_offsetScaleMatrix;
    if (a_rotateWithView == 1.0) {
      offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
    }
    vec4 offsets = offsetMatrix * vec4(a_offsets, 0.0, 0.0);
    gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
    v_texCoord = a_texCoord;
    v_opacity = a_opacity;
    v_color = a_color;
  }`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  uniform sampler2D u_texture;

  varying vec2 v_texCoord;
  varying float v_opacity;
  varying vec4 v_color;
  
  void main(void) {
    if (v_opacity == 0.0) {
      discard;
    }
    vec4 textureColor = texture2D(u_texture, v_texCoord);
    gl_FragColor = v_color * textureColor;
    gl_FragColor.a *= v_opacity;
    gl_FragColor.rgb *= gl_FragColor.a;
  }`;

/**
 * @typedef {Object} PostProcessesOptions
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas that will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object.<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} Options
 * @property {function(import("../../Feature").default):number} [sizeCallback] Will be called on every feature in the
 * source to compute the size of the quad on screen (in pixels). This is only done on source change.
 * @property {function(import("../../Feature").default, number):number} [coordCallback] Will be called on every feature in the
 * source to compute the coordinate of the quad center on screen (in pixels). This is only done on source change.
 * The second argument is 0 for `x` component and 1 for `y`.
 * @property {function(import("../../Feature").default, number):number} [texCoordCallback] Will be called on every feature in the
 * source to compute the texture coordinates of each corner of the quad (without effect if no `texture` option defined). This is only done on source change.
 * The second argument is 0 for `u0` component, 1 for `v0`, 2 for `u1`, and 3 for `v1`.
 * @property {function(import("../../Feature").default, number, number):number} [colorCallback] Will be called on every feature in the
 * source to compute the color of each corner of the quad. This is only done on source change.
 * The second argument is 0 for bottom left, 1 for bottom right, 2 for top right and 3 for top left
 * The third argument is 0 for red, 1 for green, 2 for blue and 3 for alpha
 * The return value should be between 0 and 1.
 * @property {function(import("../../Feature").default):number} [opacityCallback] Will be called on every feature in the
 * source to compute the opacity of the quad on screen (from 0 to 1). This is only done on source change.
 * Note: this is multiplied with the color of the point which can also have an alpha value < 1.
 * @property {function(import("../../Feature").default):boolean} [rotateWithViewCallback] Will be called on every feature in the
 * source to compute whether the quad on screen must stay upwards (`false`) or follow the view rotation (`true`).
 * This is only done on source change.
 * @property {HTMLCanvasElement|HTMLImageElement|ImageData} [texture] Texture to use on points. `texCoordCallback` and `sizeCallback`
 * must be defined for this to have any effect.
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object.<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * Please note that `u_texture` is reserved for the main texture slot.
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * WebGL vector renderer optimized for points.
 * All features will be rendered as quads (two triangles forming a square). New data will be flushed to the GPU
 * every time the vector source changes.
 *
 * Use shaders to customize the final output. The following attributes are available:
 * * `vec2 a_position`
 * * `vec2 a_texCoord`
 * * `vec2 a_offsets`
 * * `float a_rotateWithView`
 * * `float a_opacity`
 * * `float a_color`
 *
 * The following uniform is used for the main texture: `u_texture`.
 *
 * Please note that the main shader output should have premultiplied alpha, otherwise visual anomalies may occur.
 *
 * Points are rendered as quads with the following structure:
 *
 *   (u0, v1)      (u1, v1)
 *  [3]----------[2]
 *   |`           |
 *   |  `         |
 *   |    `       |
 *   |      `     |
 *   |        `   |
 *   |          ` |
 *  [0]----------[1]
 *   (u0, v0)      (u1, v0)
 *
 * This uses {@link module:ol/webgl/Helper~WebGLHelper} internally.
 *
 * Default shaders are shown hereafter:
 *
 * * Vertex shader:
 *   ```
 *   precision mediump float;
 *
 *   attribute vec2 a_position;
 *   attribute vec2 a_texCoord;
 *   attribute float a_rotateWithView;
 *   attribute vec2 a_offsets;
 *   attribute float a_opacity;
 *   attribute vec4 a_color;
 *
 *   uniform mat4 u_projectionMatrix;
 *   uniform mat4 u_offsetScaleMatrix;
 *   uniform mat4 u_offsetRotateMatrix;
 *
 *   varying vec2 v_texCoord;
 *   varying float v_opacity;
 *   varying vec4 v_color;
 *
 *   void main(void) {
 *     mat4 offsetMatrix = u_offsetScaleMatrix;
 *     if (a_rotateWithView == 1.0) {
 *       offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
 *     }
 *     vec4 offsets = offsetMatrix * vec4(a_offsets, 0.0, 0.0);
 *     gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
 *     v_texCoord = a_texCoord;
 *     v_opacity = a_opacity;
 *     v_color = a_color;
 *   }
 *   ```
 *
 * * Fragment shader:
 *   ```
 *   precision mediump float;
 *
 *   uniform sampler2D u_texture;
 *
 *   varying vec2 v_texCoord;
 *   varying float v_opacity;
 *   varying vec4 v_color;
 *
 *   void main(void) {
 *     if (v_opacity == 0.0) {
 *       discard;
 *     }
 *     vec4 textureColor = texture2D(u_texture, v_texCoord);
 *     gl_FragColor = v_color * textureColor;
 *     gl_FragColor.a *= v_opacity;
 *     gl_FragColor.rgb *= gl_FragColor.a;
 *   }
 *   ```
 *
 * @api
 */
class WebGLPointsLayerRenderer extends LayerRenderer {

  /**
   * @param {import("../../layer/Vector.js").default} vectorLayer Vector layer.
   * @param {Options=} [opt_options] Options.
   */
  constructor(vectorLayer, opt_options) {
    super(vectorLayer);

    const options = opt_options || {};

    const uniforms = options.uniforms || {};
    uniforms.u_texture = options.texture || this.getDefaultTexture();
    this.helper_ = new WebGLHelper({
      postProcesses: options.postProcesses,
      uniforms: uniforms
    });

    this.sourceRevision_ = -1;

    this.verticesBuffer_ = new WebGLArrayBuffer([], DYNAMIC_DRAW);
    this.indicesBuffer_ = new WebGLArrayBuffer([], DYNAMIC_DRAW);

    this.program_ = this.helper_.getProgram(
      options.fragmentShader || FRAGMENT_SHADER,
      options.vertexShader || VERTEX_SHADER
    );

    this.helper_.useProgram(this.program_);

    this.sizeCallback_ = options.sizeCallback || function() {
      return 1;
    };
    this.coordCallback_ = options.coordCallback || function(feature, index) {
      const geom = /** @type {import("../../geom/Point").default} */ (feature.getGeometry());
      return geom.getCoordinates()[index];
    };
    this.opacityCallback_ = options.opacityCallback || function() {
      return 1;
    };
    this.texCoordCallback_ = options.texCoordCallback || function(feature, index) {
      return index < 2 ? 0 : 1;
    };
    this.colorCallback_ = options.colorCallback || function(feature, index, component) {
      return 1;
    };
    this.rotateWithViewCallback_ = options.rotateWithViewCallback || function() {
      return false;
    };
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState, layerState) {
    this.helper_.drawElements(0, this.indicesBuffer_.getArray().length);
    this.helper_.finalizeDraw(frameState);
    const canvas = this.helper_.getCanvas();

    const opacity = layerState.opacity;
    if (opacity !== parseFloat(canvas.style.opacity)) {
      canvas.style.opacity = opacity;
    }

    return canvas;
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState) {
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = vectorLayer.getSource();

    const stride = 12;

    this.helper_.prepareDraw(frameState);

    if (this.sourceRevision_ < vectorSource.getRevision()) {
      this.sourceRevision_ = vectorSource.getRevision();
      this.verticesBuffer_.getArray().length = 0;
      this.indicesBuffer_.getArray().length = 0;

      const viewState = frameState.viewState;
      const projection = viewState.projection;
      const resolution = viewState.resolution;

      // loop on features to fill the buffer
      vectorSource.loadFeatures([-Infinity, -Infinity, Infinity, Infinity], resolution, projection);
      vectorSource.forEachFeature((feature) => {
        if (!feature.getGeometry() || feature.getGeometry().getType() !== GeometryType.POINT) {
          return;
        }
        const x = this.coordCallback_(feature, 0);
        const y = this.coordCallback_(feature, 1);
        const u0 = this.texCoordCallback_(feature, 0);
        const v0 = this.texCoordCallback_(feature, 1);
        const u1 = this.texCoordCallback_(feature, 2);
        const v1 = this.texCoordCallback_(feature, 3);
        const size = this.sizeCallback_(feature);
        const opacity = this.opacityCallback_(feature);
        const rotateWithView = this.rotateWithViewCallback_(feature) ? 1 : 0;
        const v0_r = this.colorCallback_(feature, 0, 0);
        const v0_g = this.colorCallback_(feature, 0, 1);
        const v0_b = this.colorCallback_(feature, 0, 2);
        const v0_a = this.colorCallback_(feature, 0, 3);
        const v1_r = this.colorCallback_(feature, 1, 0);
        const v1_g = this.colorCallback_(feature, 1, 1);
        const v1_b = this.colorCallback_(feature, 1, 2);
        const v1_a = this.colorCallback_(feature, 1, 3);
        const v2_r = this.colorCallback_(feature, 2, 0);
        const v2_g = this.colorCallback_(feature, 2, 1);
        const v2_b = this.colorCallback_(feature, 2, 2);
        const v2_a = this.colorCallback_(feature, 2, 3);
        const v3_r = this.colorCallback_(feature, 3, 0);
        const v3_g = this.colorCallback_(feature, 3, 1);
        const v3_b = this.colorCallback_(feature, 3, 2);
        const v3_a = this.colorCallback_(feature, 3, 3);
        const baseIndex = this.verticesBuffer_.getArray().length / stride;

        this.verticesBuffer_.getArray().push(
          x, y, -size / 2, -size / 2, u0, v0, opacity, rotateWithView, v0_r, v0_g, v0_b, v0_a,
          x, y, +size / 2, -size / 2, u1, v0, opacity, rotateWithView, v1_r, v1_g, v1_b, v1_a,
          x, y, +size / 2, +size / 2, u1, v1, opacity, rotateWithView, v2_r, v2_g, v2_b, v2_a,
          x, y, -size / 2, +size / 2, u0, v1, opacity, rotateWithView, v3_r, v3_g, v3_b, v3_a
        );
        this.indicesBuffer_.getArray().push(
          baseIndex, baseIndex + 1, baseIndex + 3,
          baseIndex + 1, baseIndex + 2, baseIndex + 3
        );
      });

      this.helper_.flushBufferData(ARRAY_BUFFER, this.verticesBuffer_);
      this.helper_.flushBufferData(ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);
    }

    // write new data
    this.helper_.bindBuffer(ARRAY_BUFFER, this.verticesBuffer_);
    this.helper_.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

    const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
    this.helper_.enableAttributeArray(DefaultAttrib.POSITION, 2, FLOAT, bytesPerFloat * stride, 0);
    this.helper_.enableAttributeArray(DefaultAttrib.OFFSETS, 2, FLOAT, bytesPerFloat * stride, bytesPerFloat * 2);
    this.helper_.enableAttributeArray(DefaultAttrib.TEX_COORD, 2, FLOAT, bytesPerFloat * stride, bytesPerFloat * 4);
    this.helper_.enableAttributeArray(DefaultAttrib.OPACITY, 1, FLOAT, bytesPerFloat * stride, bytesPerFloat * 6);
    this.helper_.enableAttributeArray(DefaultAttrib.ROTATE_WITH_VIEW, 1, FLOAT, bytesPerFloat * stride, bytesPerFloat * 7);
    this.helper_.enableAttributeArray(DefaultAttrib.COLOR, 4, FLOAT, bytesPerFloat * stride, bytesPerFloat * 8);

    return true;
  }

  /**
   * Will return the last shader compilation errors. If no error happened, will return null;
   * @return {string|null} Errors, or null if last compilation was successful
   * @api
   */
  getShaderCompileErrors() {
    return this.helper_.getShaderCompileErrors();
  }

  /**
   * Returns a texture of 1x1 pixel, white
   * @private
   * @return {ImageData} Image data.
   */
  getDefaultTexture() {
    const canvas = document.createElement('canvas');
    const image = canvas.getContext('2d').createImageData(1, 1);
    image.data[0] = image.data[1] = image.data[2] = image.data[3] = 255;
    return image;
  }
}

export default WebGLPointsLayerRenderer;
