/**
 * @module ol/render/webgl/BatchRenderer
 */
import {WebGLWorkerMessageType} from './constants.js';
import {abstract} from '../../util.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
  translate as translateTransform,
} from '../../transform.js';

/**
 * @typedef {Object} CustomAttribute A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {string} name Attribute name.
 * @property {function(import("../../Feature").default):number} callback This callback computes the numerical value of the
 * attribute for a given feature.
 */

let workerMessageCounter = 0;

/**
 * @classdesc Abstract class for batch renderers.
 * Batch renderers are meant to render the geometries contained in a {@link module:ol/render/webgl/GeometryBatch}
 * instance. They are responsible for generating render instructions and transforming them into WebGL buffers.
 */
class AbstractBatchRenderer {
  /**
   * @param {import("../../webgl/Helper.js").default} helper WebGL helper instance
   * @param {Worker} worker WebGL worker instance
   * @param {string} vertexShader Vertex shader
   * @param {string} fragmentShader Fragment shader
   * @param {Array<CustomAttribute>} customAttributes List of custom attributes
   */
  constructor(helper, worker, vertexShader, fragmentShader, customAttributes) {
    /**
     * @type {import("../../webgl/Helper.js").default}
     * @private
     */
    this.helper_ = helper;

    /**
     * @type {Worker}
     * @private
     */
    this.worker_ = worker;

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.program_ = this.helper_.getProgram(fragmentShader, vertexShader);

    /**
     * A list of attributes used by the renderer.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     * @protected
     */
    this.attributes = [];

    /**
     * @type {Array<CustomAttribute>}
     * @protected
     */
    this.customAttributes = customAttributes;
  }

  /**
   * Rebuild rendering instructions and webgl buffers based on the provided frame state
   * Note: this is a costly operation.
   * @param {import("./MixedGeometryBatch.js").GeometryBatch} batch Geometry batch
   * @param {import("../../Map").FrameState} frameState Frame state.
   * @param {import("../../geom/Geometry.js").Type} geometryType Geometry type
   * @param {function(): void} callback Function called once the render buffers are updated
   */
  rebuild(batch, frameState, geometryType, callback) {
    // store transform for rendering instructions
    batch.renderInstructionsTransform = this.helper_.makeProjectionTransform(
      frameState,
      createTransform()
    );
    this.generateRenderInstructions(batch);
    this.generateBuffers_(batch, geometryType, callback);
  }

  /**
   * Render the geometries in the batch. This will also update the current transform used for rendering according to
   * the invert transform of the webgl buffers
   * @param {import("./MixedGeometryBatch.js").GeometryBatch} batch Geometry batch
   * @param {import("../../transform.js").Transform} currentTransform Transform
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} offsetX X offset
   */
  render(batch, currentTransform, frameState, offsetX) {
    // multiply the current projection transform with the invert of the one used to fill buffers
    this.helper_.makeProjectionTransform(frameState, currentTransform);
    translateTransform(currentTransform, offsetX, 0);
    multiplyTransform(currentTransform, batch.invertVerticesBufferTransform);

    // enable program, buffers and attributes
    this.helper_.useProgram(this.program_, frameState);
    this.helper_.bindBuffer(batch.verticesBuffer);
    this.helper_.bindBuffer(batch.indicesBuffer);
    this.helper_.enableAttributes(this.attributes);

    const renderCount = batch.indicesBuffer.getSize();
    this.helper_.drawElements(0, renderCount);
  }

  /**
   * Rebuild rendering instructions based on the provided frame state
   * This is specific to the geometry type and has to be implemented by subclasses.
   * @param {import("./MixedGeometryBatch.js").GeometryBatch} batch Geometry batch
   * @protected
   */
  generateRenderInstructions(batch) {
    abstract();
  }

  /**
   * Rebuild internal webgl buffers for rendering based on the current rendering instructions;
   * This is asynchronous: webgl buffers wil _not_ be updated right away
   * @param {import("./MixedGeometryBatch.js").GeometryBatch} batch Geometry batch
   * @param {import("../../geom/Geometry.js").Type} geometryType Geometry type
   * @param {function(): void} callback Function called once the render buffers are updated
   * @private
   */
  generateBuffers_(batch, geometryType, callback) {
    const messageId = workerMessageCounter++;

    let messageType;
    switch (geometryType) {
      case 'Polygon':
        messageType = WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS;
        break;
      case 'Point':
        messageType = WebGLWorkerMessageType.GENERATE_POINT_BUFFERS;
        break;
      case 'LineString':
        messageType = WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS;
        break;
      default:
      // pass
    }

    /** @type {import('./constants.js').WebGLWorkerGenerateBuffersMessage} */
    const message = {
      id: messageId,
      type: messageType,
      renderInstructions: batch.renderInstructions.buffer,
      renderInstructionsTransform: batch.renderInstructionsTransform,
      customAttributesCount: this.customAttributes.length,
    };
    this.worker_.postMessage(message, [batch.renderInstructions.buffer]);

    // leave ownership of render instructions
    batch.renderInstructions = null;

    const handleMessage =
      /**
       * @param {*} event Event.
       */
      (event) => {
        const received = event.data;

        // this is not the response to our request: skip
        if (received.id !== messageId) {
          return;
        }

        // we've received our response: stop listening
        this.worker_.removeEventListener('message', handleMessage);

        // store transform & invert transform for webgl buffers
        batch.verticesBufferTransform = received.renderInstructionsTransform;
        makeInverseTransform(
          batch.invertVerticesBufferTransform,
          batch.verticesBufferTransform
        );

        // copy & flush received buffers to GPU
        batch.verticesBuffer.fromArrayBuffer(received.vertexBuffer);
        this.helper_.flushBufferData(batch.verticesBuffer);
        batch.indicesBuffer.fromArrayBuffer(received.indexBuffer);
        this.helper_.flushBufferData(batch.indicesBuffer);

        // take back ownership of the render instructions for further use
        batch.renderInstructions = new Float32Array(
          received.renderInstructions
        );

        callback();
      };

    this.worker_.addEventListener('message', handleMessage);
  }
}

export default AbstractBatchRenderer;
