/**
 * @module ol/render/webgl/BatchRenderer
 */
import GeometryType from '../../geom/GeometryType.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
  multiply as multiplyTransform,
} from '../../transform.js';
import {abstract} from '../../util.js';
import {WebGLWorkerMessageType} from './constants.js';

/**
 * @typedef {Object} CustomAttribute A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {string} name Attribute name.
 * @property {function(import("../../Feature").default, Object<string, *>):number} callback This callback computes the numerical value of the
 * attribute for a given feature (properties are available as 2nd arg for quicker access).
 */

let workerMessageCounter = 0;

/**
 * @classdesc Abstract class for batch renderers.
 * Batch renderers are meant to render the geometries contained in a {@link module:ol/render/webgl/GeometryBatch}
 * instance. They are responsible for generating render instructions and transforming them into WebGL buffers.
 */
class AbstractBatchRenderer {
  /**
   * @param {import("../../webgl/Helper.js").default} helper
   * @param {Worker} worker
   * @param {string} vertexShader
   * @param {string} fragmentShader
   * @param {Array<CustomAttribute>} customAttributes
   */
  constructor(helper, worker, vertexShader, fragmentShader, customAttributes) {
    /**
     * @type {import("../../webgl/Helper.js").default}
     * @protected
     */
    this.helper_ = helper;

    /**
     * @type {Worker}
     * @protected
     */
    this.worker_ = worker;

    /**
     * @type {WebGLProgram}
     * @protected
     */
    this.program_ = this.helper_.getProgram(fragmentShader, vertexShader);

    /**
     * A list of attributes used by the renderer.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     * @protected
     */
    this.attributes_ = [];

    /**
     * @type {Array<CustomAttribute>}
     * @protected
     */
    this.customAttributes_ = customAttributes;
  }

  /**
   * Rebuild rendering instructions and webgl buffers based on the provided frame state
   * Note: this is a costly operation.
   * @param {import("./MixedGeometryBatch.js").AbstractGeometryBatch} batch
   * @param {import("../../PluggableMap").FrameState} frameState Frame state.
   * @param {import("../../geom/GeometryType.js").default} geometryType
   */
  rebuild(batch, frameState, geometryType) {
    // store transform for rendering instructions
    batch.renderInstructionsTransform = this.helper_.makeProjectionTransform(
      frameState,
      createTransform()
    );
    this.generateRenderInstructions_(batch);
    this.generateBuffers_(batch, geometryType);
  }

  /**
   * Render the geometries in the batch. This will also update the current transform used for rendering according to
   * the invert transform of the webgl buffers
   * @param {import("./MixedGeometryBatch.js").AbstractGeometryBatch} batch
   * @param {import("../../transform.js").Transform} currentTransform
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   */
  render(batch, currentTransform, frameState) {
    // multiply the current projection transform with the invert of the one used to fill buffers
    this.helper_.makeProjectionTransform(frameState, currentTransform);
    multiplyTransform(currentTransform, batch.invertVerticesBufferTransform);

    // enable program, buffers and attributes
    this.helper_.useProgram(this.program_, frameState);
    this.helper_.bindBuffer(batch.verticesBuffer);
    this.helper_.bindBuffer(batch.indicesBuffer);
    this.helper_.enableAttributes(this.attributes_);

    const renderCount = batch.indicesBuffer.getSize();
    this.helper_.drawElements(0, renderCount);
  }

  /**
   * Rebuild rendering instructions based on the provided frame state
   * This is specific to the geometry type and has to be implemented by subclasses.
   * @param {import("./MixedGeometryBatch.js").default} batch
   * @protected
   */
  generateRenderInstructions_(batch) {
    abstract();
  }

  /**
   * Rebuild internal webgl buffers for rendering based on the current rendering instructions;
   * This is asynchronous: webgl buffers wil _not_ be updated right away
   * @param {import("./MixedGeometryBatch.js").AbstractGeometryBatch} batch
   * @param {import("../../geom/GeometryType.js").default} geometryType
   * @protected
   */
  generateBuffers_(batch, geometryType) {
    const messageId = workerMessageCounter++;

    let messageType;
    switch (geometryType) {
      case GeometryType.POLYGON:
        messageType = WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS;
        break;
      case GeometryType.POINT:
        messageType = WebGLWorkerMessageType.GENERATE_POINT_BUFFERS;
        break;
      case GeometryType.LINE_STRING:
        messageType = WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS;
        break;
    }

    /** @type {import('./constants.js').WebGLWorkerGenerateBuffersMessage} */
    const message = {
      id: messageId,
      type: messageType,
      renderInstructions: batch.renderInstructions.buffer,
      renderInstructionsTransform: batch.renderInstructionsTransform,
      customAttributesCount: this.customAttributes_.length,
    };
    // additional properties will be sent back as-is by the worker
    message['projectionTransform'] = batch.renderInstructionsTransform;
    this.worker_.postMessage(message, [batch.renderInstructions.buffer]);

    // leave ownership of render instructions
    batch.renderInstructions = null;

    const handleMessage =
      /**
       * @param {*} event Event.
       * @this {AbstractBatchRenderer}
       */
      function (event) {
        const received = event.data;

        // this is not the response to our request: skip
        if (received.id !== messageId) {
          return;
        }

        // we've received our response: stop listening
        this.worker_.removeEventListener('message', handleMessage);

        // store transform & invert transform for webgl buffers
        batch.verticesBufferTransform = received.projectionTransform;
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

        // TODO: call layer.changed somehow for the layer to rerender!!!1
      }.bind(this);

    this.worker_.addEventListener('message', handleMessage);
  }
}

export default AbstractBatchRenderer;
