/**
 * Literal Style objects differ from standard styles in that they cannot
 * be functions and are made up of simple objects instead of classes.
 * @module ol/style/LiteralStyle
 */

/**
 * Base type used for literal style parameters; can be a number literal or the output of an operator,
 * which in turns takes {@link ExpressionValue} arguments.
 *
 * The following operators can be used:
 *
 * * Reading operators:
 *   * `['get', 'attributeName']` fetches a feature attribute (it will be prefixed by `a_` in the shader)
 *     Note: those will be taken from the attributes provided to the renderer
 *   * `['var', 'varName']` fetches a value from the style variables, or 0 if undefined
 *   * `['time']` returns the time in seconds since the creation of the layer
 *
 * * Math operators:
 *   * `['*', value1, value1]` multiplies `value1` by `value2`
 *   * `['+', value1, value1]` adds `value1` and `value2`
 *   * `['clamp', value, low, high]` clamps `value` between `low` and `high`
 *   * `['stretch', value, low1, high1, low2, high2]` maps `value` from [`low1`, `high1`] range to
 *     [`low2`, `high2`] range, clamping values along the way
 *
 * * Color operators:
 *   * `['interpolate', ratio, color1, color2]` returns a color through interpolation between `color1` and
 *     `color2` with the given `ratio`
 *
 * * Logical operators:
 *   * `['<', value1, value2]` returns `1` if `value1` is strictly lower than value 2, or `0` otherwise.
 *   * `['<=', value1, value2]` returns `1` if `value1` is lower than or equals value 2, or `0` otherwise.
 *   * `['>', value1, value2]` returns `1` if `value1` is strictly greater than value 2, or `0` otherwise.
 *   * `['>=', value1, value2]` returns `1` if `value1` is greater than or equals value 2, or `0` otherwise.
 *   * `['==', value1, value2]` returns `1` if `value1` equals value 2, or `0` otherwise.
 *   * `['!', value1]` returns `0` if `value1` strictly greater than `0`, or `1` otherwise.
 *   * `['between', value1, value2, value3]` returns `1` if `value1` is contained between `value2` and `value3`
 *     (inclusively), or `0` otherwise.
 *
 * Values can either be literals or another operator, as they will be evaluated recursively.
 * Literal values can be of the following types:
 * * `number`
 * * `string`
 * * {@link module:ol/color~Color}
 *
 * @typedef {Array<*>|import("../color.js").Color|string|number} ExpressionValue
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
  IMAGE: 'image'
};


/**
 * @typedef {Object} LiteralSymbolStyle
 * @property {ExpressionValue|Array<ExpressionValue, ExpressionValue>} size Size, mandatory.
 * @property {SymbolType} symbolType Symbol type to use, either a regular shape or an image.
 * @property {string} [src] Path to the image to be used for the symbol. Only required with `symbolType: 'image'`.
 * @property {import("../color.js").Color|Array<ExpressionValue>|string} [color='#FFFFFF'] Color used for the representation (either fill, line or symbol).
 * @property {ExpressionValue} [opacity=1] Opacity.
 * @property {Array<ExpressionValue, ExpressionValue>} [offset] Offset on X and Y axis for symbols. If not specified, the symbol will be centered.
 * @property {Array<ExpressionValue, ExpressionValue, ExpressionValue, ExpressionValue>} [textureCoord] Texture coordinates. If not specified, the whole texture will be used (range for 0 to 1 on both axes).
 * @property {boolean} [rotateWithView=false] Specify whether the symbol must rotate with the view or stay upwards.
 */
