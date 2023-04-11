/**
 * @module ol/renderer/webgl/PointsLayer
 */
import BaseVector from '../../layer/BaseVector.js';
import VectorEventType from '../../source/VectorEventType.js';
import ViewHint from '../../ViewHint.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import WebGLLayerRenderer from './Layer.js';
import WebGLRenderTarget from '../../webgl/RenderTarget.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import {AttributeType, DefaultUniform} from '../../webgl/Helper.js';
import {WebGLWorkerMessageType} from '../../render/webgl/constants.js';
import {
  apply as applyTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  translate as translateTransform,
} from '../../transform.js';
import {assert} from '../../asserts.js';
import {buffer, createEmpty, equals, getWidth} from '../../extent.js';
import {colorDecodeId, colorEncodeId} from '../../render/webgl/utils.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {getUid} from '../../util.js';
import {listen, unlistenByKey} from '../../events.js';

/**
 * @typedef {Object} CustomAttribute A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {string} name Attribute name.
 * @property {function(import("../../Feature").default, Object<string, *>):number} callback This callback computes the numerical value of the
 * attribute for a given feature (properties are available as 2nd arg for quicker access).
 */

/**
 * @typedef {Object} FeatureCacheItem Object that holds a reference to a feature, its geometry and properties. Used to optimize
 * rebuildBuffers by accessing these objects quicker.
 * @property {import("../../Feature").default} feature Feature
 * @property {Object<string, *>} properties Feature properties
 * @property {import("../../geom").Geometry} geometry Feature geometry
 */

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {Array<CustomAttribute>} [attributes] These attributes will be read from the features in the source and then
 * passed to the GPU. The `name` property of each attribute will serve as its identifier:
 *  * In the vertex shader as an `attribute` by prefixing it with `a_`
 *  * In the fragment shader as a `varying` by prefixing it with `v_`
 * Please note that these can only be numerical values.
 * @property {string} vertexShader Vertex shader source, mandatory.
 * @property {string} fragmentShader Fragment shader source, mandatory.
 * @property {string} [hitVertexShader] Vertex shader source for hit detection rendering.
 * @property {string} [hitFragmentShader] Fragment shader source for hit detection rendering.
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * Please note that `u_texture` is reserved for the main texture slot and `u_opacity` is reserved for the layer opacity.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * WebGL vector renderer optimized for points.
 * All features will be rendered as quads (two triangles forming a square). New data will be flushed to the GPU
 * every time the vector source changes.
 *
 * You need to provide vertex and fragment shaders for rendering. This can be done using
 * {@link module:ol/webgl/ShaderBuilder~ShaderBuilder} utilities. These shaders shall expect a `a_position` attribute
 * containing the screen-space projected center of the quad, as well as a `a_index` attribute
 * whose value (0, 1, 2 or 3) indicates which quad vertex is currently getting processed (see structure below).
 *
 * To include variable attributes in the shaders, you need to declare them using the `attributes` property of
 * the options object like so:
 * ```js
 * new WebGLPointsLayerRenderer(layer, {
 *   attributes: [
 *     {
 *       name: 'size',
 *       callback: function(feature) {
 *         // compute something with the feature
 *       }
 *     },
 *     {
 *       name: 'weight',
 *       callback: function(feature) {
 *         // compute something with the feature
 *       }
 *     },
 *   ],
 *   vertexShader:
 *     // shader using attribute a_weight and a_size
 *   fragmentShader:
 *     // shader using varying v_weight and v_size
 * ```
 *
 * To enable hit detection, you must as well provide dedicated shaders using the `hitVertexShader`
 * and `hitFragmentShader` properties. These shall expect the `a_hitColor` attribute to contain
 * the final color that will have to be output for hit detection to work.
 *
 * The following uniform is used for the main texture: `u_texture`.
 * The following uniform is used for the layer opacity: `u_opacity`.
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
 * @api
 */
class WebGLPointsLayerRenderer extends WebGLLayerRenderer {
  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {Options} options Options.
   */
  constructor(layer, options) {
    const uniforms = options.uniforms || {};
    const projectionMatrixTransform = createTransform();
    uniforms[DefaultUniform.PROJECTION_MATRIX] = projectionMatrixTransform;

    super(layer, {
      uniforms: uniforms,
      postProcesses: options.postProcesses,
    });

    this.sourceRevision_ = -1;

    this.verticesBuffer_ = new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW);
    this.hitVerticesBuffer_ = new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW);
    this.indicesBuffer_ = new WebGLArrayBuffer(
      ELEMENT_ARRAY_BUFFER,
      DYNAMIC_DRAW
    );

    /**
     * @private
     */
    this.vertexShader_ = options.vertexShader;

    /**
     * @private
     */
    this.fragmentShader_ = options.fragmentShader;

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.program_;

    /**
     * @type {boolean}
     * @private
     */
    this.hitDetectionEnabled_ =
      options.hitFragmentShader && options.hitVertexShader ? true : false;

    /**
     * @private
     */
    this.hitVertexShader_ = options.hitVertexShader;

    /**
     * @private
     */
    this.hitFragmentShader_ = options.hitFragmentShader;

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.hitProgram_;

    const customAttributes = options.attributes
      ? options.attributes.map(function (attribute) {
          return {
            name: 'a_' + attribute.name,
            size: 1,
            type: AttributeType.FLOAT,
          };
        })
      : [];

    /**
     * A list of attributes used by the renderer. By default only the position and
     * index of the vertex (0 to 3) are required.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     */
    this.attributes = [
      {
        name: 'a_position',
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: 'a_index',
        size: 1,
        type: AttributeType.FLOAT,
      },
    ].concat(customAttributes);

    /**
     * A list of attributes used for hit detection.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     */
    this.hitDetectionAttributes = [
      {
        name: 'a_position',
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: 'a_index',
        size: 1,
        type: AttributeType.FLOAT,
      },
      {
        name: 'a_hitColor',
        size: 4,
        type: AttributeType.FLOAT,
      },
      {
        name: 'a_featureUid',
        size: 1,
        type: AttributeType.FLOAT,
      },
    ].concat(customAttributes);

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
    this.hitRenderTarget_;

    /**
     * Keep track of latest message sent to worker
     * @type {number}
     * @private
     */
    this.lastSentId = 0;

    /**
     * @private
     */
    this.worker_ = createWebGLWorker();

    this.worker_.addEventListener(
      'message',
      /**
       * @param {*} event Event.
       */
      (event) => {
        const received = event.data;
        if (received.type === WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
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
          makeInverseTransform(
            this.invertRenderTransform_,
            this.renderTransform_
          );
          if (received.hitDetection) {
            this.hitRenderInstructions_ = new Float32Array(
              event.data.renderInstructions
            );
          } else {
            this.renderInstructions_ = new Float32Array(
              event.data.renderInstructions
            );
            if (received.id === this.lastSentId) {
              this.ready = true;
            }
          }

          this.getLayer().changed();
        }
      }
    );

    /**
     * This object will be updated when the source changes. Key is uid.
     * @type {Object<string, FeatureCacheItem>}
     * @private
     */
    this.featureCache_ = {};

    /**
     * Amount of features in the cache.
     * @type {number}
     * @private
     */
    this.featureCount_ = 0;

    const source = this.getLayer().getSource();
    this.sourceListenKeys_ = [
      listen(
        source,
        VectorEventType.ADDFEATURE,
        this.handleSourceFeatureAdded_,
        this
      ),
      listen(
        source,
        VectorEventType.CHANGEFEATURE,
        this.handleSourceFeatureChanged_,
        this
      ),
      listen(
        source,
        VectorEventType.REMOVEFEATURE,
        this.handleSourceFeatureDelete_,
        this
      ),
      listen(
        source,
        VectorEventType.CLEAR,
        this.handleSourceFeatureClear_,
        this
      ),
    ];
    source.forEachFeature((feature) => {
      this.featureCache_[getUid(feature)] = {
        feature: feature,
        properties: feature.getProperties(),
        geometry: feature.getGeometry(),
      };
      this.featureCount_++;
    });
  }

  afterHelperCreated() {
    this.program_ = this.helper.getProgram(
      this.fragmentShader_,
      this.vertexShader_
    );

    if (this.hitDetectionEnabled_) {
      this.hitProgram_ = this.helper.getProgram(
        this.hitFragmentShader_,
        this.hitVertexShader_
      );

      this.hitRenderTarget_ = new WebGLRenderTarget(this.helper);
    }
  }

  /**
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureAdded_(event) {
    const feature = event.feature;
    this.featureCache_[getUid(feature)] = {
      feature: feature,
      properties: feature.getProperties(),
      geometry: feature.getGeometry(),
    };
    this.featureCount_++;
  }

  /**
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureChanged_(event) {
    const feature = event.feature;
    this.featureCache_[getUid(feature)] = {
      feature: feature,
      properties: feature.getProperties(),
      geometry: feature.getGeometry(),
    };
  }

  /**
   * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
   * @private
   */
  handleSourceFeatureDelete_(event) {
    const feature = event.feature;
    delete this.featureCache_[getUid(feature)];
    this.featureCount_--;
  }

  /**
   * @private
   */
  handleSourceFeatureClear_() {
    this.featureCache_ = {};
    this.featureCount_ = 0;
  }

  /**
   * Render the layer.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    const projection = frameState.viewState.projection;
    const layer = this.getLayer();
    const vectorSource = layer.getSource();
    // FIXME fix hit detection isn't reliable when rendering multiple worlds
    const multiWorld = vectorSource.getWrapX() && projection.canWrapX();
    const projectionExtent = projection.getExtent();

    const extent = frameState.extent;
    const worldWidth = multiWorld ? getWidth(projectionExtent) : null;
    const endWorld = multiWorld
      ? Math.ceil((extent[2] - projectionExtent[2]) / worldWidth) + 1
      : 1;

    const startWorld = multiWorld
      ? Math.floor((extent[0] - projectionExtent[0]) / worldWidth)
      : 0;

    let world = startWorld;
    const renderCount = this.indicesBuffer_.getSize();

    do {
      // apply the current projection transform with the invert of the one used to fill buffers
      this.helper.makeProjectionTransform(frameState, this.currentTransform_);
      translateTransform(this.currentTransform_, world * worldWidth, 0);
      multiplyTransform(this.currentTransform_, this.invertRenderTransform_);
      this.helper.applyUniforms(frameState);

      this.helper.drawElements(0, renderCount);
    } while (++world < endWorld);

    this.helper.finalizeDraw(
      frameState,
      this.dispatchPreComposeEvent,
      this.dispatchPostComposeEvent
    );
    const canvas = this.helper.getCanvas();

    if (this.hitDetectionEnabled_) {
      this.renderHitDetection(frameState, startWorld, endWorld, worldWidth);
      this.hitRenderTarget_.clearCachedData();
    }

    this.postRender(gl, frameState);

    return canvas;
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrameInternal(frameState) {
    const layer = this.getLayer();
    const vectorSource = layer.getSource();
    const viewState = frameState.viewState;
    const viewNotMoving =
      !frameState.viewHints[ViewHint.ANIMATING] &&
      !frameState.viewHints[ViewHint.INTERACTING];
    const extentChanged = !equals(this.previousExtent_, frameState.extent);
    const sourceChanged = this.sourceRevision_ < vectorSource.getRevision();

    if (sourceChanged) {
      this.sourceRevision_ = vectorSource.getRevision();
    }

    if (viewNotMoving && (extentChanged || sourceChanged)) {
      const projection = viewState.projection;
      const resolution = viewState.resolution;

      const renderBuffer =
        layer instanceof BaseVector ? layer.getRenderBuffer() : 0;
      const extent = buffer(frameState.extent, renderBuffer * resolution);
      vectorSource.loadFeatures(extent, resolution, projection);

      this.rebuildBuffers_(frameState);
      this.previousExtent_ = frameState.extent.slice();
    }

    this.helper.useProgram(this.program_, frameState);
    this.helper.prepareDraw(frameState);

    // write new data
    this.helper.bindBuffer(this.verticesBuffer_);
    this.helper.bindBuffer(this.indicesBuffer_);
    this.helper.enableAttributes(this.attributes);

    return true;
  }

  /**
   * Rebuild internal webgl buffers based on current view extent; costly, should not be called too much
   * @param {import("../../Map").FrameState} frameState Frame state.
   * @private
   */
  rebuildBuffers_(frameState) {
    // saves the projection transform for the current frame state
    const projectionTransform = createTransform();
    this.helper.makeProjectionTransform(frameState, projectionTransform);

    // here we anticipate the amount of render instructions that we well generate
    // this can be done since we know that for normal render we only have x, y as base instructions,
    // and x, y, r, g, b, a and featureUid for hit render instructions
    // and we also know the amount of custom attributes to append to these
    const totalInstructionsCount =
      (2 + this.customAttributes.length) * this.featureCount_;
    if (
      !this.renderInstructions_ ||
      this.renderInstructions_.length !== totalInstructionsCount
    ) {
      this.renderInstructions_ = new Float32Array(totalInstructionsCount);
    }
    if (this.hitDetectionEnabled_) {
      const totalHitInstructionsCount =
        (7 + this.customAttributes.length) * this.featureCount_;
      if (
        !this.hitRenderInstructions_ ||
        this.hitRenderInstructions_.length !== totalHitInstructionsCount
      ) {
        this.hitRenderInstructions_ = new Float32Array(
          totalHitInstructionsCount
        );
      }
    }

    // loop on features to fill the buffer
    let featureCache, geometry;
    const tmpCoords = [];
    const tmpColor = [];
    let renderIndex = 0;
    let hitIndex = 0;
    let hitColor;
    for (const featureUid in this.featureCache_) {
      featureCache = this.featureCache_[featureUid];
      geometry = /** @type {import("../../geom").Point} */ (
        featureCache.geometry
      );
      if (!geometry || geometry.getType() !== 'Point') {
        continue;
      }

      tmpCoords[0] = geometry.getFlatCoordinates()[0];
      tmpCoords[1] = geometry.getFlatCoordinates()[1];
      applyTransform(projectionTransform, tmpCoords);

      hitColor = colorEncodeId(hitIndex + 6, tmpColor);

      this.renderInstructions_[renderIndex++] = tmpCoords[0];
      this.renderInstructions_[renderIndex++] = tmpCoords[1];

      // for hit detection, the feature uid is saved in the opacity value
      // and the index of the opacity value is encoded in the color values
      if (this.hitDetectionEnabled_) {
        this.hitRenderInstructions_[hitIndex++] = tmpCoords[0];
        this.hitRenderInstructions_[hitIndex++] = tmpCoords[1];
        this.hitRenderInstructions_[hitIndex++] = hitColor[0];
        this.hitRenderInstructions_[hitIndex++] = hitColor[1];
        this.hitRenderInstructions_[hitIndex++] = hitColor[2];
        this.hitRenderInstructions_[hitIndex++] = hitColor[3];
        this.hitRenderInstructions_[hitIndex++] = Number(featureUid);
      }

      // pushing custom attributes
      let value;
      for (let j = 0; j < this.customAttributes.length; j++) {
        value = this.customAttributes[j].callback(
          featureCache.feature,
          featureCache.properties
        );
        this.renderInstructions_[renderIndex++] = value;
        if (this.hitDetectionEnabled_) {
          this.hitRenderInstructions_[hitIndex++] = value;
        }
      }
    }

    /** @type {import('../../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
    const message = {
      id: ++this.lastSentId,
      type: WebGLWorkerMessageType.GENERATE_POINT_BUFFERS,
      renderInstructions: this.renderInstructions_.buffer,
      customAttributesCount: this.customAttributes.length,
    };
    // additional properties will be sent back as-is by the worker
    message['projectionTransform'] = projectionTransform;
    this.ready = false;
    this.worker_.postMessage(message, [this.renderInstructions_.buffer]);
    this.renderInstructions_ = null;

    /** @type {import('../../render/webgl/constants.js').WebGLWorkerGenerateBuffersMessage} */
    if (this.hitDetectionEnabled_) {
      const hitMessage = {
        id: 0,
        type: WebGLWorkerMessageType.GENERATE_POINT_BUFFERS,
        renderInstructions: this.hitRenderInstructions_.buffer,
        customAttributesCount: 5 + this.customAttributes.length,
      };
      hitMessage['projectionTransform'] = projectionTransform;
      hitMessage['hitDetection'] = true;
      this.worker_.postMessage(hitMessage, [
        this.hitRenderInstructions_.buffer,
      ]);
      this.hitRenderInstructions_ = null;
    }
  }

  /**
   * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback.
   * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
   * @return {T|undefined} Callback result.
   * @template T
   */
  forEachFeatureAtCoordinate(
    coordinate,
    frameState,
    hitTolerance,
    callback,
    matches
  ) {
    assert(this.hitDetectionEnabled_, 66);
    if (!this.hitRenderInstructions_) {
      return undefined;
    }

    const pixel = applyTransform(
      frameState.coordinateToPixelTransform,
      coordinate.slice()
    );

    const data = this.hitRenderTarget_.readPixel(pixel[0] / 2, pixel[1] / 2);
    const color = [data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255];
    const index = colorDecodeId(color);
    const opacity = this.hitRenderInstructions_[index];
    const uid = Math.floor(opacity).toString();

    const source = this.getLayer().getSource();
    const feature = source.getFeatureByUid(uid);
    if (feature) {
      return callback(feature, this.getLayer(), null);
    }
    return undefined;
  }

  /**
   * Render the hit detection data to the corresponding render target
   * @param {import("../../Map.js").FrameState} frameState current frame state
   * @param {number} startWorld the world to render in the first iteration
   * @param {number} endWorld the last world to render
   * @param {number} worldWidth the width of the worlds being rendered
   */
  renderHitDetection(frameState, startWorld, endWorld, worldWidth) {
    // skip render entirely if vertex buffers not ready/generated yet
    if (!this.hitVerticesBuffer_.getSize()) {
      return;
    }

    let world = startWorld;

    this.hitRenderTarget_.setSize([
      Math.floor(frameState.size[0] / 2),
      Math.floor(frameState.size[1] / 2),
    ]);

    this.helper.useProgram(this.hitProgram_, frameState);
    this.helper.prepareDrawToRenderTarget(
      frameState,
      this.hitRenderTarget_,
      true
    );

    this.helper.bindBuffer(this.hitVerticesBuffer_);
    this.helper.bindBuffer(this.indicesBuffer_);
    this.helper.enableAttributes(this.hitDetectionAttributes);

    do {
      this.helper.makeProjectionTransform(frameState, this.currentTransform_);
      translateTransform(this.currentTransform_, world * worldWidth, 0);
      multiplyTransform(this.currentTransform_, this.invertRenderTransform_);
      this.helper.applyUniforms(frameState);

      const renderCount = this.indicesBuffer_.getSize();
      this.helper.drawElements(0, renderCount);
    } while (++world < endWorld);
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    this.worker_.terminate();
    this.layer_ = null;
    this.sourceListenKeys_.forEach(function (key) {
      unlistenByKey(key);
    });
    this.sourceListenKeys_ = null;
    super.disposeInternal();
  }
}

export default WebGLPointsLayerRenderer;
