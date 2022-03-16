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
 * @typedef {Object} WebGLWorkerGenerateBuffersMessage
 * This message will trigger the generation of a vertex and an index buffer based on the given render instructions.
 * When the buffers are generated, the worked will send a message of the same type to the main thread, with
 * the generated buffers in it.
 * Note that any addition properties present in the message *will* be sent back to the main thread.
 * @property {number} id Message id; will be used both in request and response as a means of identification
 * @property {WebGLWorkerMessageType} type Message type
 * @property {ArrayBuffer} renderInstructions Polygon render instructions raw binary buffer.
 * @property {number} [customAttributesCount] Amount of custom attributes count in the polygon render instructions.
 * @property {ArrayBuffer} [vertexBuffer] Vertices array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [indexBuffer] Indices array raw binary buffer (sent by the worker).
 * @property {import("../../transform").Transform} [renderInstructionsTransform] Transformation matrix used to project the instructions coordinates
 */
