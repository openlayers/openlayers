/**
 * Literal Style objects differ from standard styles in that they cannot
 * be functions and are made up of simple objects instead of classes.
 * @module ol/style/LiteralStyle
 */

/**
 * @typedef {import("./expressions.js").ExpressionValue} ExpressionValue
 */

/**
 * @typedef {Object} LiteralStyle
 * @property {ExpressionValue} [filter] Filter expression. If it resolves to a number strictly greater than 0, the
 * point will be displayed. If undefined, all points will show.
 * @property {Object<string, number>} [variables] Style variables; each variable must hold a number.
 * Note: **this object is meant to be mutated**: changes to the values will immediately be visible on the rendered features
 * @property {LiteralSymbolStyle} [symbol] Symbol representation.
 */

/**
 * @enum {string}
 */
export const SymbolType = {
  CIRCLE: 'circle',
  SQUARE: 'square',
  TRIANGLE: 'triangle',
  IMAGE: 'image',
};

/**
 * @typedef {Object} LiteralSymbolStyle
 * @property {ExpressionValue|Array<ExpressionValue, ExpressionValue>} size Size, mandatory.
 * @property {SymbolType} symbolType Symbol type to use, either a regular shape or an image.
 * @property {string} [src] Path to the image to be used for the symbol. Only required with `symbolType: 'image'`.
 * @property {import("../color.js").Color|Array<ExpressionValue>|string} [color='#FFFFFF'] Color used for the representation (either fill, line or symbol).
 * @property {ExpressionValue} [opacity=1] Opacity.
 * @property {ExpressionValue} [rotation=0] Symbol rotation in radians.
 * @property {Array<ExpressionValue, ExpressionValue>} [offset] Offset on X and Y axis for symbols. If not specified, the symbol will be centered.
 * @property {Array<ExpressionValue, ExpressionValue, ExpressionValue, ExpressionValue>} [textureCoord] Texture coordinates. If not specified, the whole texture will be used (range for 0 to 1 on both axes).
 * @property {boolean} [rotateWithView=false] Specify whether the symbol must rotate with the view or stay upwards.
 */
