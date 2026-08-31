/**
 * @module ol/render/webgpu/drawOrder
 */

/**
 * Canvas class order from `ExecutorGroup.ALL`: polygons, then circles, then
 * lines, then icons, then text. A higher `z-index` still paints later.
 * @type {number}
 */
export const CLASS_POLYGON = 0;

/**
 * @type {number}
 */
export const CLASS_CIRCLE = 1;

/**
 * @type {number}
 */
export const CLASS_LINE = 2;

/**
 * @type {number}
 */
export const CLASS_IMAGE = 3;

/**
 * @type {number}
 */
export const CLASS_TEXT = 4;

/**
 * @typedef {'fill'|'stroke'|'symbol'|'glyph'} DrawPipeline
 */

/**
 * One range of a fill, stroke, symbol, or glyph draw.
 *
 * @typedef {Object} DrawCommand
 * @property {number} zIndex Style z-index. Higher paints later.
 * @property {number} classRank Canvas class order.
 * @property {number} sequence Render sequence within the class.
 * @property {DrawPipeline} pipeline Draw pipeline.
 * @property {number} start First index or instance.
 * @property {number} count Index or instance count.
 * @property {number} featureRef Feature ref.
 * @property {number} [labelIndex] Index into the label array.
 */

/**
 * Metadata copied onto every job and label a style produces.
 *
 * @typedef {Object} DrawStamp
 * @property {number} zIndex Style z-index.
 * @property {number} classRank Canvas class order.
 * @property {number} sequence Render sequence.
 * @property {number} featureRef Feature ref.
 */

/**
 * @param {DrawPipeline} pipeline Pipeline.
 * @return {number} Fill, then stroke, then symbol, then glyph.
 */
export function pipelineRank(pipeline) {
  if (pipeline === 'fill') {
    return 0;
  }
  if (pipeline === 'stroke') {
    return 1;
  }
  if (pipeline === 'symbol') {
    return 2;
  }
  return 3;
}

/**
 * Order inside one tile. Fill and stroke of one polygon share a sequence, so
 * the pipeline rank puts the stroke between that fill and the next polygon.
 *
 * @param {DrawCommand} a A.
 * @param {DrawCommand} b B.
 * @return {number} Negative when `a` paints first.
 */
export function compareDraw(a, b) {
  if (a.zIndex !== b.zIndex) {
    return a.zIndex - b.zIndex;
  }
  if (a.classRank !== b.classRank) {
    return a.classRank - b.classRank;
  }
  if (a.sequence !== b.sequence) {
    return a.sequence - b.sequence;
  }
  return pipelineRank(a.pipeline) - pipelineRank(b.pipeline);
}

/**
 * Order across tiles. Each tile's sequence restarts at zero, so the tile's
 * place in the current draw list is the tie-break before that sequence.
 *
 * @param {DrawCommand} a A.
 * @param {number} tileA Tile order of `a`.
 * @param {DrawCommand} b B.
 * @param {number} tileB Tile order of `b`.
 * @return {number} Negative when `a` paints first.
 */
export function comparePaint(a, tileA, b, tileB) {
  if (a.zIndex !== b.zIndex) {
    return a.zIndex - b.zIndex;
  }
  if (a.classRank !== b.classRank) {
    return a.classRank - b.classRank;
  }
  if (tileA !== tileB) {
    return tileA - tileB;
  }
  if (a.sequence !== b.sequence) {
    return a.sequence - b.sequence;
  }
  return pipelineRank(a.pipeline) - pipelineRank(b.pipeline);
}
