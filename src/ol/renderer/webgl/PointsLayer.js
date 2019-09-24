/**
 * @module ol/renderer/webgl/PointsLayer
 */
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import {AttributeType, DefaultUniform} from '../../webgl/Helper.js';
import GeometryType from '../../geom/GeometryType.js';
import WebGLLayerRenderer, {colorDecodeId, colorEncodeId, getBlankImageData, WebGLWorkerMessageType} from './Layer.js';
import ViewHint from '../../ViewHint.js';
import {createEmpty, equals} from '../../extent.js';
import {
  apply as applyTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform
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
 * @typedef {Object} CustomAttribute A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {string} name Attribute name.
 * @property {function(import("../../Feature").default):number} callback This callback computes the numerical value of the
 * attribute for a given feature.
 */

/**
 * @typedef {Object} Options
 * @property {Array<CustomAttribute>} [attributes] These attributes will be read from the features in the source and then
 * passed to the GPU. The `name` property of each attribute will serve as its identifier:
 *  * In the vertex shader as an `attribute` by prefixing it with `a_`
 *  * In the fragment shader as a `varying` by prefixing it with `v_`
 * Please note that these can only be numerical values.
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
    uniforms.u_texture = getBlankImageData();
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
      VERTEX_SHADER
    );

    const customAttributes = options.attributes ?
      options.attributes.map(function(attribute) {
        return {
          name: 'a_' + attribute.name,
          size: 1,
          type: AttributeType.FLOAT
        };
      }) : [];

    /**
     * A list of attributes used by the renderer. By default only the position and
     * index of the vertex (0 to 3) are required.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     */
    this.attributes = [{
      name: 'a_position',
      size: 2,
      type: AttributeType.FLOAT
    }, {
      name: 'a_index',
      size: 1,
      type: AttributeType.FLOAT
    }].concat(customAttributes);

    /**
     * A list of attributes used for hit detection.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     */
    this.hitDetectionAttributes = [{
      name: 'a_position',
      size: 2,
      type: AttributeType.FLOAT
    }, {
      name: 'a_index',
      size: 1,
      type: AttributeType.FLOAT
    }, {
      name: 'a_color',
      size: 4,
      type: AttributeType.FLOAT
    }, {
      name: 'a_featureUid',
      size: 1,
      type: AttributeType.FLOAT
    }].concat(customAttributes);

    this.customAttributes = options.attributes ? options.attributes : [];

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

        this.getLayer().changed();
      }
    }.bind(this));
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState) {
    const renderCount = this.indicesBuffer_.getSize();
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

    this.helper.enableAttributes(this.attributes);

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
    const totalInstructionsCount = (2 + this.customAttributes.length) * features.length;
    if (!this.renderInstructions_ || this.renderInstructions_.length !== totalInstructionsCount) {
      this.renderInstructions_ = new Float32Array(totalInstructionsCount);
    }
    const totalHitInstructionsCount = (7 + this.customAttributes.length) * features.length;
    if (!this.hitRenderInstructions_ || this.hitRenderInstructions_.length !== totalHitInstructionsCount) {
      this.hitRenderInstructions_ = new Float32Array(totalHitInstructionsCount);
    }

    // loop on features to fill the buffer
    let feature;
    const tmpCoords = [];
    const tmpColor = [];
    let renderIndex = 0;
    let hitIndex = 0;
    let hitColor;
    for (let i = 0; i < features.length; i++) {
      feature = features[i];
      if (!feature.getGeometry() || feature.getGeometry().getType() !== GeometryType.POINT) {
        continue;
      }

      tmpCoords[0] = feature.getGeometry().getFlatCoordinates()[0];
      tmpCoords[1] = feature.getGeometry().getFlatCoordinates()[1];
      applyTransform(projectionTransform, tmpCoords);

      hitColor = colorEncodeId(hitIndex + 6, tmpColor);

      this.renderInstructions_[renderIndex++] = tmpCoords[0];
      this.renderInstructions_[renderIndex++] = tmpCoords[1];

      // for hit detection, the feature uid is saved in the opacity value
      // and the index of the opacity value is encoded in the color values
      this.hitRenderInstructions_[hitIndex++] = tmpCoords[0];
      this.hitRenderInstructions_[hitIndex++] = tmpCoords[1];
      this.hitRenderInstructions_[hitIndex++] = hitColor[0];
      this.hitRenderInstructions_[hitIndex++] = hitColor[1];
      this.hitRenderInstructions_[hitIndex++] = hitColor[2];
      this.hitRenderInstructions_[hitIndex++] = hitColor[3];
      this.hitRenderInstructions_[hitIndex++] = Number(getUid(feature));

      // pushing custom attributes
      let value;
      for (let j = 0; j < this.customAttributes.length; j++) {
        value = this.customAttributes[j].callback(feature);
        this.renderInstructions_[renderIndex++] = value;
        this.hitRenderInstructions_[hitIndex++] = value;
      }
    }

    /** @type import('./Layer').WebGLWorkerGenerateBuffersMessage */
    const message = {
      type: WebGLWorkerMessageType.GENERATE_BUFFERS,
      renderInstructions: this.renderInstructions_.buffer,
      customAttributesCount: this.customAttributes.length
    };
    // additional properties will be sent back as-is by the worker
    message['projectionTransform'] = projectionTransform;
    this.worker_.postMessage(message, [this.renderInstructions_.buffer]);
    this.renderInstructions_ = null;

    /** @type import('./Layer').WebGLWorkerGenerateBuffersMessage */
    const hitMessage = {
      type: WebGLWorkerMessageType.GENERATE_BUFFERS,
      renderInstructions: this.hitRenderInstructions_.buffer,
      customAttributesCount: 5 + this.customAttributes.length
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
    // skip render entirely if vertices buffers for display & hit detection have different sizes
    // this typically means both buffers are temporarily out of sync
    // FIXME: adapt this to the new points renderer behaviour
    // if (this.hitVerticesBuffer_.getSize() !== this.verticesBuffer_.getSize()) {
    //   return;
    // }

    this.hitRenderTarget_.setSize(frameState.size);

    this.helper.useProgram(this.hitProgram_);
    this.helper.prepareDrawToRenderTarget(frameState, this.hitRenderTarget_, true);

    this.helper.bindBuffer(this.hitVerticesBuffer_);
    this.helper.bindBuffer(this.indicesBuffer_);

    this.helper.enableAttributes(this.hitDetectionAttributes);

    const renderCount = this.indicesBuffer_.getSize();
    this.helper.drawElements(0, renderCount);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.worker_.terminate();
    super.disposeInternal();
  }
}

export default WebGLPointsLayerRenderer;
