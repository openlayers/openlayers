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
};

/**
 * @typedef {Object} WebGLWorkerGenerateBuffersMessage
 * This message will trigger the generation of a vertex and an index buffer based on the given render instructions.
 * When the buffers are generated, the worked will send a message of the same type to the main thread, with
 * the generated buffers in it.
 * Note that any addition properties present in the message *will* be sent back to the main thread.
 * @property {WebGLWorkerMessageType} type Message type
 * @property {ArrayBufferLike} renderInstructions render instructions raw binary buffer.
 * @property {number} [customAttributesSize] Amount of hit detection + custom attributes count in the render instructions.
 * @property {ArrayBuffer} [indicesBuffer] Indices array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [vertexAttributesBuffer] Vertex attributes array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [instanceAttributesBuffer] Instance attributes array raw binary buffer (sent by the worker).
 * @property {import("../../transform.js").Transform} [renderInstructionsTransform] Transformation matrix used to project the instructions coordinates
 * @property {number} [id] Message id; will be used both in request and response as a means of identification
 */

/**
 * @typedef {Object} TextOverlayWorkerMessage
 * These messages are used to prepare text rendering on the text overlay worker:
 * - BUILD_INSTRUCTIONS is used to transform render instructions into canvas text rendering batches
 * - RENDER is used to actually draw all current text rendering batches on the offscreen canvas; the render list is cleared after each render
 * @property {TextOverlayWorkerMessageType} type Message type
 * @property {ArrayBuffer} [polygonRenderInstructions] Polygon render instructions array buffer
 * @property {ArrayBuffer} [lineStringRenderInstructions] Line string render instructions array buffer
 * @property {ArrayBuffer} [pointRenderInstructions] Point render instructions array buffer
 * @property {ImageBitmap} [imageData] Rendered canvas
 * @property {import("../../Map.js").FrameState} [frameState] Frame state of the rendered image
 * @property {string} [instructionsSetKey] Key corresponding to a generated text instructions set
 * @property {import('../../style/flat.js').FlatStyleLike} [style] Flat style
 * @property {Uint8Array} [labelsArray] Labels array
 * @property {Object<string, number>} [customAttributesSizes] Size of each custom attribute (by name)
 * @property {import("../../transform.js").Transform} [renderInstructionsTransform] Transformation matrix used to project the instructions coordinates
 * @property {number} [resolution]
 * @property {number} [id] Message id; will be used both in request and response as a means of identification
 */
