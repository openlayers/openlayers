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
  BUILD_INSTRUCTIONS: 'BUILD_INSTRUCTIONS',
  DISPOSE_INSTRUCTIONS: 'DISPOSE_INSTRUCTIONS',
  RENDER: 'RENDER',
  GIVE_BACK_CANVAS: 'GIVE_BACK_CANVAS',
  ADD_TO_RENDER_LIST: 'ADD_TO_RENDER_LIST',
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
 * @property {ArrayBuffer} [indicesBuffer] Indices array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [vertexAttributesBuffer] Vertex attributes array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [instanceAttributesBuffer] Instance attributes array raw binary buffer (sent by the worker).
 * @property {import("../../transform").Transform} [renderInstructionsTransform] Transformation matrix used to project the instructions coordinates
 */

/**
 * @typedef {Object} TextOverlayWorkerMessage
 * TODO
 * @property {TextOverlayWorkerMessageType} type Message type
 * @property {number} id Message id; will be used both in request and response as a means of identification
 * @property {ArrayBuffer} [polygonRenderInstructions] Polygon render instructions array buffer
 * @property {ArrayBuffer} [lineStringRenderInstructions] Line string render instructions array buffer
 * @property {ArrayBuffer} [pointRenderInstructions] Point render instructions array buffer
 * @property {ImageBitmap} [imageData] Rendered canvas
 * @property {import("../../Map.js").FrameState} [frameState] Frame state of the rendered image
 * @property {string} [instructionsSetKey] Key corresponding to a generated text instructions set
 * @property {import('../../style/flat.js').FlatStyleLike} [style] Flat style
 */
