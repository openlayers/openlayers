/**
 * @module ol/render/webgl/constants
 */

/**
 * @enum {string}
 */
export const WebGLWorkerMessageType = {
  GENERATE_POLYGON_BUFFERS: 'GENERATE_POLYGON_BUFFERS',
  GENERATE_POINT_BUFFERS: 'GENERATE_POINT_BUFFERS',
  GENERATE_LINE_STRING_BUFFERS: 'GENERATE_LINE_STRING_BUFFERS',
};

/**
 * @enum {string}
 */
export const TextOverlayWorkerMessageType = {
  INIT: 'INIT',
  LOAD_FEATURES: 'LOAD_FEATURES',
  UNLOAD_FEATURES: 'UNLOAD_FEATURES',
  RENDER: 'RENDER',
  RENDERED: 'RENDERED',
};

/**
 * @typedef {Object} WebGLWorkerGenerateBuffersMessage
 * This message will trigger the generation of a vertex and an index buffer based on the given render instructions.
 * When the buffers are generated, the worked will send a message of the same type to the main thread, with
 * the generated buffers in it.
 * Note that any addition properties present in the message *will* be sent back to the main thread.
 * @property {number} id Message id; will be used both in request and response as a means of identification
 * @property {WebGLWorkerMessageType} type Message type
 * @property {ArrayBuffer} renderInstructions render instructions raw binary buffer.
 * @property {number} [customAttributesSize] Amount of hit detection + custom attributes count in the render instructions.
 * @property {ArrayBuffer} [vertexBuffer] Vertices array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [indexBuffer] Indices array raw binary buffer (sent by the worker).
 * @property {import("../../transform").Transform} [renderInstructionsTransform] Transformation matrix used to project the instructions coordinates
 */

/**
 * @typedef {Object} TextOverlayWorkerMessage
 * TODO
 * @property {TextOverlayWorkerMessageType} type Message type
 * @property {string} [batchId]
 * @property {Array<string>} [batchesId]
 * @property {Array<Feature>} [features]
 * @property {ImageBitmap} [imageData]
 */
