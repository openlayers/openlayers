/**
 * @module ol/renderer/webgl/PointsLayer
 */
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {DYNAMIC_DRAW, ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, FLOAT} from '../../webgl.js';
import {DefaultAttrib, DefaultUniform} from '../../webgl/Helper.js';
import GeometryType from '../../geom/GeometryType.js';
import WebGLLayerRenderer, {
  colorDecodeId,
  colorEncodeId,
  getBlankImageData,
  POINT_INSTRUCTIONS_COUNT, POINT_VERTEX_STRIDE, WebGLWorkerMessageType,
  writePointFeatureInstructions
} from './Layer.js';
import ViewHint from '../../ViewHint.js';
import {createEmpty, equals} from '../../extent.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  apply as applyTransform
} from '../../transform.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {getUid} from '../../util.js';
import WebGLRenderTarget from '../../webgl/RenderTarget.js';

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

const HIT_FRAGMENT_SHADER = `
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
    if (textureColor.a < 0.1) {
      discard;
    }
    gl_FragColor = v_color;
  }`;

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
 * @property {function(import("../../Feature").default, Array<number>=):Array<number>} [colorCallback] Will be called on every feature in the
 * source to compute the color for use in the fragment shader (available as the `v_color` varying). This is only done on source change.
 * The return value should be between an array of R, G, B, A values between 0 and 1.  To reduce unnecessary
 * allocation, the function is called with a reusable array that can serve as the return value after updating
 * the R, G, B, and A values.
 * @property {function(import("../../Feature").default):number} [opacityCallback] Will be called on every feature in the
 * source to compute the opacity of the quad on screen (from 0 to 1). This is only done on source change.
 * Note: this is multiplied with the color of the point which can also have an alpha value < 1.
 * @property {function(import("../../Feature").default):boolean} [rotateWithViewCallback] Will be called on every feature in the
 * source to compute whether the quad on screen must stay upwards (`false`) or follow the view rotation (`true`). Default is `false`.
 * This is only done on source change.
 * @property {HTMLCanvasElement|HTMLImageElement|ImageData} [texture] Texture to use on points. `texCoordCallback` and `sizeCallback`
 * must be defined for this to have any effect.
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object.<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * Please note that `u_texture` is reserved for the main texture slot.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
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
 * ```
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
 *  ```
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
class WebGLPointsLayerRenderer extends WebGLLayerRenderer {

  /**
   * @param {import("../../layer/Vector.js").default} vectorLayer Vector layer.
   * @param {Options=} [opt_options] Options.
   */
  constructor(vectorLayer, opt_options) {
    const options = opt_options || {};

    const uniforms = options.uniforms || {};
    uniforms.u_texture = options.texture || getBlankImageData();
    const projectionMatrixTransform = createTransform();
    uniforms[DefaultUniform.PROJECTION_MATRIX] = projectionMatrixTransform;

    super(vectorLayer, {
      uniforms: uniforms,
      postProcesses: options.postProcesses
    });

    this.sourceRevision_ = -1;

    this.verticesBuffer_ = new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW);
    this.hitVerticesBuffer_ = new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW);
    this.indicesBuffer_ = new WebGLArrayBuffer(ELEMENT_ARRAY_BUFFER, DYNAMIC_DRAW);

    this.program_ = this.helper.getProgram(
      options.fragmentShader || FRAGMENT_SHADER,
      options.vertexShader || VERTEX_SHADER
    );
    this.hitProgram_ = this.helper.getProgram(
      HIT_FRAGMENT_SHADER,
      options.vertexShader || VERTEX_SHADER
    );

    this.sizeCallback_ = options.sizeCallback || function() {
      return 1;
    };
    this.coordCallback_ = options.coordCallback || function(feature, index) {
      const geom = feature.getGeometry();
      return geom.getCoordinates()[index];
    };
    this.opacityCallback_ = options.opacityCallback || function() {
      return 1;
    };
    this.texCoordCallback_ = options.texCoordCallback || function(feature, index) {
      return index < 2 ? 0 : 1;
    };

    this.colorArray_ = [1, 1, 1, 1];
    this.colorCallback_ = options.colorCallback || function(feature, color) {
      return this.colorArray_;
    };

    this.rotateWithViewCallback_ = options.rotateWithViewCallback || function() {
      return false;
    };

    this.previousExtent_ = createEmpty();

    /**
     * This transform is updated on every frame and is the composition of:
     * - invert of the world->screen transform that was used when rebuilding buffers (see `this.renderTransform_`)
     * - current world->screen transform
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.currentTransform_ = projectionMatrixTransform;

    /**
     * This transform is updated when buffers are rebuilt and converts world space coordinates to screen space
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.renderTransform_ = createTransform();

    /**
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.invertRenderTransform_ = createTransform();

    /**
     * @type {Float32Array}
     * @private
     */
    this.renderInstructions_ = new Float32Array(0);

    /**
     * These instructions are used for hit detection
     * @type {Float32Array}
     * @private
     */
    this.hitRenderInstructions_ = new Float32Array(0);

    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    this.hitRenderTarget_ = new WebGLRenderTarget(this.helper);

    this.worker_ = createWebGLWorker();
    this.worker_.addEventListener('message', function(event) {
      const received = event.data;
      if (received.type === WebGLWorkerMessageType.GENERATE_BUFFERS) {
        const projectionTransform = received.projectionTransform;
        if (received.hitDetection) {
          this.hitVerticesBuffer_.fromArrayBuffer(received.vertexBuffer);
          this.helper.flushBufferData(this.hitVerticesBuffer_);
        } else {
          this.verticesBuffer_.fromArrayBuffer(received.vertexBuffer);
          this.helper.flushBufferData(this.verticesBuffer_);
        }
        this.indicesBuffer_.fromArrayBuffer(received.indexBuffer);
        this.helper.flushBufferData(this.indicesBuffer_);

        this.renderTransform_ = projectionTransform;
        makeInverseTransform(this.invertRenderTransform_, this.renderTransform_);
        if (received.hitDetection) {
          this.hitRenderInstructions_ = new Float32Array(event.data.renderInstructions);
        } else {
          this.renderInstructions_ = new Float32Array(event.data.renderInstructions);
        }
      }
    }.bind(this));
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState) {
    const renderCount = this.indicesBuffer_.getArray() ? this.indicesBuffer_.getArray().length : 0;
    this.helper.drawElements(0, renderCount);
    this.helper.finalizeDraw(frameState);
    const canvas = this.helper.getCanvas();

    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const opacity = layerState.opacity;
    if (opacity !== parseFloat(canvas.style.opacity)) {
      canvas.style.opacity = opacity;
    }

    this.renderHitDetection(frameState);
    this.hitRenderTarget_.clearCachedData();

    return canvas;
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState) {
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = vectorLayer.getSource();
    const viewState = frameState.viewState;

    const stride = POINT_VERTEX_STRIDE;

    // the source has changed: clear the feature cache & reload features
    const sourceChanged = this.sourceRevision_ < vectorSource.getRevision();
    if (sourceChanged) {
      this.sourceRevision_ = vectorSource.getRevision();

      const projection = viewState.projection;
      const resolution = viewState.resolution;
      vectorSource.loadFeatures([-Infinity, -Infinity, Infinity, Infinity], resolution, projection);
    }

    const viewNotMoving = !frameState.viewHints[ViewHint.ANIMATING] && !frameState.viewHints[ViewHint.INTERACTING];
    const extentChanged = !equals(this.previousExtent_, frameState.extent);
    if ((sourceChanged || extentChanged) && viewNotMoving) {
      this.rebuildBuffers_(frameState);
      this.previousExtent_ = frameState.extent.slice();
    }

    // apply the current projection transform with the invert of the one used to fill buffers
    this.helper.makeProjectionTransform(frameState, this.currentTransform_);
    multiplyTransform(this.currentTransform_, this.invertRenderTransform_);

    this.helper.useProgram(this.program_);
    this.helper.prepareDraw(frameState);

    // write new data
    this.helper.bindBuffer(this.verticesBuffer_);
    this.helper.bindBuffer(this.indicesBuffer_);

    const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
    this.helper.enableAttributeArray(DefaultAttrib.POSITION, 2, FLOAT, bytesPerFloat * stride, 0);
    this.helper.enableAttributeArray(DefaultAttrib.OFFSETS, 2, FLOAT, bytesPerFloat * stride, bytesPerFloat * 2);
    this.helper.enableAttributeArray(DefaultAttrib.TEX_COORD, 2, FLOAT, bytesPerFloat * stride, bytesPerFloat * 4);
    this.helper.enableAttributeArray(DefaultAttrib.OPACITY, 1, FLOAT, bytesPerFloat * stride, bytesPerFloat * 6);
    this.helper.enableAttributeArray(DefaultAttrib.ROTATE_WITH_VIEW, 1, FLOAT, bytesPerFloat * stride, bytesPerFloat * 7);
    this.helper.enableAttributeArray(DefaultAttrib.COLOR, 4, FLOAT, bytesPerFloat * stride, bytesPerFloat * 8);

    return true;
  }

  /**
   * Rebuild internal webgl buffers based on current view extent; costly, should not be called too much
   * @param {import("../../PluggableMap").FrameState} frameState Frame state.
   * @private
   */
  rebuildBuffers_(frameState) {
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = vectorLayer.getSource();

    // saves the projection transform for the current frame state
    const projectionTransform = createTransform();
    this.helper.makeProjectionTransform(frameState, projectionTransform);

    const features = vectorSource.getFeatures();
    const totalInstructionsCount = POINT_INSTRUCTIONS_COUNT * features.length;
    if (!this.renderInstructions_ || this.renderInstructions_.length !== totalInstructionsCount) {
      this.renderInstructions_ = new Float32Array(totalInstructionsCount);
    }
    if (!this.hitRenderInstructions_ || this.hitRenderInstructions_.length !== totalInstructionsCount) {
      this.hitRenderInstructions_ = new Float32Array(totalInstructionsCount);
    }

    // loop on features to fill the buffer
    let feature;
    const tmpCoords = [];
    const tmpColor = [];
    let elementIndex = 0;
    let u0, v0, u1, v1, size, opacity, rotateWithView, color;
    for (let i = 0; i < features.length; i++) {
      feature = features[i];
      if (!feature.getGeometry() || feature.getGeometry().getType() !== GeometryType.POINT) {
        continue;
      }

      tmpCoords[0] = this.coordCallback_(feature, 0);
      tmpCoords[1] = this.coordCallback_(feature, 1);
      applyTransform(projectionTransform, tmpCoords);

      u0 = this.texCoordCallback_(feature, 0);
      v0 = this.texCoordCallback_(feature, 1);
      u1 = this.texCoordCallback_(feature, 2);
      v1 = this.texCoordCallback_(feature, 3);
      size = this.sizeCallback_(feature);
      opacity = this.opacityCallback_(feature);
      rotateWithView = this.rotateWithViewCallback_(feature);
      color = this.colorCallback_(feature, this.colorArray_);

      writePointFeatureInstructions(
        this.renderInstructions_,
        elementIndex,
        tmpCoords[0],
        tmpCoords[1],
        u0,
        v0,
        u1,
        v1,
        size,
        opacity,
        rotateWithView,
        color
      );

      // for hit detection, the feature uid is saved in the opacity value
      // and the index of the opacity value is encoded in the color values
      elementIndex = writePointFeatureInstructions(
        this.hitRenderInstructions_,
        elementIndex,
        tmpCoords[0],
        tmpCoords[1],
        u0,
        v0,
        u1,
        v1,
        size,
        opacity > 0 ? Number(getUid(feature)) : 0,
        rotateWithView,
        colorEncodeId(elementIndex + 7, tmpColor)
      );
    }

    /** @type import('./Layer').WebGLWorkerGenerateBuffersMessage */
    const message = {
      type: WebGLWorkerMessageType.GENERATE_BUFFERS,
      renderInstructions: this.renderInstructions_.buffer
    };
    // additional properties will be sent back as-is by the worker
    message['projectionTransform'] = projectionTransform;
    this.worker_.postMessage(message, [this.renderInstructions_.buffer]);
    this.renderInstructions_ = null;

    /** @type import('./Layer').WebGLWorkerGenerateBuffersMessage */
    const hitMessage = {
      type: WebGLWorkerMessageType.GENERATE_BUFFERS,
      renderInstructions: this.hitRenderInstructions_.buffer
    };
    hitMessage['projectionTransform'] = projectionTransform;
    hitMessage['hitDetection'] = true;
    this.worker_.postMessage(hitMessage, [this.hitRenderInstructions_.buffer]);
    this.hitRenderInstructions_ = null;
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, declutteredFeatures) {
    if (!this.hitRenderInstructions_) {
      return;
    }

    const pixel = applyTransform(frameState.coordinateToPixelTransform, coordinate.slice());

    const data = this.hitRenderTarget_.readPixel(pixel[0], pixel[1]);
    const color = [
      data[0] / 255,
      data[1] / 255,
      data[2] / 255,
      data[3] / 255
    ];
    const index = colorDecodeId(color);
    const opacity = this.hitRenderInstructions_[index];
    const uid = Math.floor(opacity).toString();

    const source = this.getLayer().getSource();
    const feature = source.getFeatureByUid(uid);
    if (feature) {
      return callback(feature, this.getLayer());
    }
  }

  /**
   * Render the hit detection data to the corresponding render target
   * @param {import("../../PluggableMap.js").FrameState} frameState current frame state
   */
  renderHitDetection(frameState) {
    this.hitRenderTarget_.setSize(frameState.size);

    this.helper.useProgram(this.hitProgram_);
    this.helper.prepareDrawToRenderTarget(frameState, this.hitRenderTarget_, true);

    this.helper.bindBuffer(this.hitVerticesBuffer_);
    this.helper.bindBuffer(this.indicesBuffer_);

    const stride = POINT_VERTEX_STRIDE;
    const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
    this.helper.enableAttributeArray(DefaultAttrib.POSITION, 2, FLOAT, bytesPerFloat * stride, 0);
    this.helper.enableAttributeArray(DefaultAttrib.OFFSETS, 2, FLOAT, bytesPerFloat * stride, bytesPerFloat * 2);
    this.helper.enableAttributeArray(DefaultAttrib.TEX_COORD, 2, FLOAT, bytesPerFloat * stride, bytesPerFloat * 4);
    this.helper.enableAttributeArray(DefaultAttrib.OPACITY, 1, FLOAT, bytesPerFloat * stride, bytesPerFloat * 6);
    this.helper.enableAttributeArray(DefaultAttrib.ROTATE_WITH_VIEW, 1, FLOAT, bytesPerFloat * stride, bytesPerFloat * 7);
    this.helper.enableAttributeArray(DefaultAttrib.COLOR, 4, FLOAT, bytesPerFloat * stride, bytesPerFloat * 8);

    const renderCount = this.indicesBuffer_.getArray() ? this.indicesBuffer_.getArray().length : 0;
    this.helper.drawElements(0, renderCount);
  }
}

export default WebGLPointsLayerRenderer;
