/**
 * Literal Style objects differ from standard styles in that they cannot
 * be functions and are made up of simple objects instead of classes.
 * @module ol/style/LiteralStyle
 */

/**
 * @typedef {Object} LiteralStyle
 * @property {LiteralSymbolStyle} [symbol] Symbol representation.
 */

/**
 * @enum {string}
 */
export const SymbolType = {
  CIRCLE: 'circle',
  SQUARE: 'square',
  TRIANGLE: 'triangle',
  IMAGE: 'image'
};


/**
 * @typedef {Object} LiteralSymbolStyle
 * @property {number|Array.<number, number>} size Size, mandatory.
 * @property {SymbolType} symbolType Symbol type to use, either a regular shape or an image.
 * @property {string} [src] Path to the image to be used for the symbol. Only required with `symbolType: 'image'`.
 * @property {import("../color.js").Color|string} [color='#FFFFFF'] Color used for the representation (either fill, line or symbol).
 * @property {number} [opacity=1] Opacity.
 * @property {Array.<number, number>} [offset] Offset on X and Y axis for symbols. If not specified, the symbol will be centered.
 * @property {Array.<number, number, number, number>} [textureCoord] Texture coordinates. If not specified, the whole texture will be used (range for 0 to 1 on both axes).
 * @property {boolean} [rotateWithView=false] Specify whether the symbol must rotate with the view or stay upwards.
 */
