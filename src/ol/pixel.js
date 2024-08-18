/**
 * @module ol/pixel
 */

import {createCanvasContext2D} from './dom.js';

/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 * @typedef {Array<number>} Pixel
 * @api
 */

/** @type {undefined} */
export let nothing;

/**
 * @type {CanvasRenderingContext2D}
 */
let pixelContext = null;

function createPixelContext() {
  pixelContext = createCanvasContext2D(1, 1, undefined, {
    willReadFrequently: true,
  });
}

/**
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} image The input image.
 * @param {number} renderCol The column index (in rendered tile space).
 * @param {number} renderRow The row index (in rendered tile space).
 * @param {import('./size.js').Size} [renderSize] The size of rendered tile.
 * @param {number} [gutter] The gutter.
 * @return {Uint8ClampedArray|null} The data.
 */
export function getImagePixelData(
  image,
  renderCol,
  renderRow,
  renderSize,
  gutter,
) {
  if (!pixelContext) {
    createPixelContext();
  }
  pixelContext.clearRect(0, 0, 1, 1);

  gutter = gutter || 0;
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const sourceWidthWithoutGutter = sourceWidth - 2 * gutter;
  const sourceHeightWithoutGutter = sourceHeight - 2 * gutter;

  const renderWidth = renderSize ? renderSize[0] : sourceWidth;
  const renderHeight = renderSize ? renderSize[1] : sourceHeight;

  const sourceCol =
    gutter + Math.floor(sourceWidthWithoutGutter * (renderCol / renderWidth));

  const sourceRow =
    gutter + Math.floor(sourceHeightWithoutGutter * (renderRow / renderHeight));

  let data;
  try {
    pixelContext.drawImage(image, sourceCol, sourceRow, 1, 1, 0, 0, 1, 1);
    data = pixelContext.getImageData(0, 0, 1, 1).data;
  } catch (err) {
    pixelContext = null;
    data = null;
  }
  return data;
}

/**
 * @param {Uint8Array|Uint8ClampedArray|Float32Array|DataView} data The input data.
 * @param {number} bandCount The band count.
 * @param {Array<number>} sourceSize The size of the input data.
 * @param {number} renderCol The column index (in rendered tile space).
 * @param {number} renderRow The row index (in rendered tile space).
 * @param {import('./size.js').Size} [renderSize] The size of rendered tile.
 * @param {number} [gutter] The gutter.
 * @return {Uint8Array|Uint8ClampedArray|Float32Array} The data.
 */
export function getArrayPixelData(
  data,
  bandCount,
  sourceSize,
  renderCol,
  renderRow,
  renderSize,
  gutter,
) {
  gutter = gutter || 0;
  const sourceWidthWithoutGutter = sourceSize[0];
  const sourceHeightWithoutGutter = sourceSize[1];
  const sourceWidth = sourceWidthWithoutGutter + 2 * gutter;
  const sourceHeight = sourceHeightWithoutGutter + 2 * gutter;

  const renderWidth = renderSize ? renderSize[0] : sourceWidth;
  const renderHeight = renderSize ? renderSize[1] : sourceHeight;

  const sourceCol =
    gutter + Math.floor(sourceWidthWithoutGutter * (renderCol / renderWidth));

  const sourceRow =
    gutter + Math.floor(sourceHeightWithoutGutter * (renderRow / renderHeight));

  if (data instanceof DataView) {
    const bytesPerPixel = data.byteLength / (sourceWidth * sourceHeight);
    const offset =
      data.byteOffset + bytesPerPixel * (sourceRow * sourceWidth + sourceCol);
    return new Uint8ClampedArray(
      data.buffer.slice(offset, offset + bytesPerPixel),
    );
  }

  const offset = bandCount * (sourceRow * sourceWidth + sourceCol);
  return data.slice(offset, offset + bandCount);
}
