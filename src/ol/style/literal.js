/**
 * Literal style objects differ from standard styles in that they cannot
 * be functions and are made up of simple objects instead of classes.
 * @module ol/style/literal
 */

/**
 * @typedef {import("./expressions.js").ExpressionValue} ExpressionValue
 */
/**
 * @typedef {import("../color.js").Color|string|Array<ExpressionValue>} ColorExpression
 */

/**
 * @typedef {Object} BaseProps
 * @property {ExpressionValue} [filter] Filter expression. If it resolves to a number strictly greater than 0, the
 * point will be displayed. If undefined, all points will show.
 * @property {Object<string, number | Array<number> | string | boolean>} [variables] Style variables; each variable must hold a number.
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
 * @property {ExpressionValue|Array<ExpressionValue>} size Size, mandatory.
 * @property {SymbolType} symbolType Symbol type to use, either a regular shape or an image.
 * @property {string} [src] Path to the image to be used for the symbol. Only required with `symbolType: 'image'`.
 * @property {string} [crossOrigin='anonymous'] The `crossOrigin` attribute for loading `src`.
 * @property {ColorExpression} [color] Color used for the representation (either fill, line or symbol).
 * @property {ExpressionValue} [opacity=1] Opacity.
 * @property {ExpressionValue} [rotation=0] Symbol rotation in radians.
 * @property {Array<ExpressionValue, ExpressionValue>} [offset] Offset on X and Y axis for symbols. If not specified, the symbol will be centered.
 * @property {Array<ExpressionValue, ExpressionValue, ExpressionValue, ExpressionValue>} [textureCoord] Texture coordinates. If not specified, the whole texture will be used (range for 0 to 1 on both axes).
 * @property {boolean} [rotateWithView=false] Specify whether the symbol must rotate with the view or stay upwards.
 */

/**
 * @typedef {Object} FillProps
 * @property {ColorExpression} [fill-color] The fill color.
 */

/**
 * @typedef {Object} StrokeProps
 * @property {ColorExpression} [stroke-color] The stroke color.
 * @property {number|ExpressionValue} [stroke-width] Stroke pixel width.
 */

/**
 * @typedef {Object} IconProps
 * @property {string} [icon-src] Image source URI.
 * @property {HTMLImageElement|HTMLCanvasElement} [icon-img] Image object for the icon. If the `icon-src` option is not provided then the
 * provided image must already be loaded. And in that case, it is required
 * to provide the size of the image, with the `icon-img-size` option.
 * @property {import("../size.js").Size} [icon-img-size] Image size in pixels. Only required if `icon-img` is set and `icon-src` is not.
 * The provided size needs to match the actual size of the image.
 * @property {Array<number>} [icon-anchor=[0.5, 0.5]] Anchor. Default value is the icon center.
 * @property {import("./Icon.js").IconOrigin} [icon-anchor-origin='top-left'] Origin of the anchor: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {import("./Icon.js").IconAnchorUnits} [icon-anchor-x-units='fraction'] Units in which the anchor x value is
 * specified. A value of `'fraction'` indicates the x value is a fraction of the icon. A value of `'pixels'` indicates
 * the x value in pixels.
 * @property {import("./Icon.js").IconAnchorUnits} [icon-anchor-y-units='fraction'] Units in which the anchor y value is
 * specified. A value of `'fraction'` indicates the y value is a fraction of the icon. A value of `'pixels'` indicates
 * the y value in pixels.
 * @property {ColorExpression} [icon-color] Color to tint the icon. If not specified,
 * the icon will be left as is.
 * @property {null|string} [icon-cross-origin] The `crossOrigin` attribute for loaded images. Note that you must provide a
 * `icon-cross-origin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {Array<number>|Array<ExpressionValue>} [icon-offset=[0, 0]] Offset, which, together with the size and the offset origin, define the
 * sub-rectangle to use from the original icon image.
 * @property {Array<number>|Array<ExpressionValue>} [icon-displacement=[0,0]] Displacement of the icon.
 * @property {import("./Icon.js").IconOrigin} [icon-offset-origin='top-left'] Origin of the offset: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {number} [icon-opacity=1] Opacity of the icon.
 * @property {ExpressionValue|Array<ExpressionValue>|number|import("../size.js").Size} [icon-scale=1] Scale.
 * @property {ExpressionValue|number} [icon-width] Width of the icon. If not specified, the actual image width will be used. Cannot be combined
 * with `scale`.
 * @property {ExpressionValue|number} [icon-height] Height of the icon. If not specified, the actual image height will be used. Cannot be combined
 * with `scale`.
 * @property {ExpressionValue|number} [icon-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [icon-rotate-with-view=false] Whether to rotate the icon with the view.
 * @property {Array<ExpressionValue>|import("../size.js").Size} [icon-size] Icon size in pixel. Can be used together with `icon-offset` to define the
 * sub-rectangle to use from the origin (sprite) icon image.
 */

/**
 * @typedef {Object} ShapeProps
 * @property {number} [shape-points] Number of points for stars and regular polygons. In case of a polygon, the number of points
 * is the number of sides.
 * @property {ColorExpression} [shape-fill-color] The fill color.
 * @property {ColorExpression} [shape-stroke-color] The stroke color.
 * @property {ExpressionValue|number} [shape-stroke-width] Stroke pixel width.
 * @property {ExpressionValue|number} [shape-radius] Radius of a regular polygon.
 * @property {ExpressionValue|number} [shape-radius1] First radius of a star. Ignored if radius is set.
 * @property {ExpressionValue|number} [shape-radius2] Second radius of a star.
 * @property {ExpressionValue|number} [shape-angle=0] Shape's angle in radians. A value of 0 will have one of the shape's point facing up.
 * @property {Array<ExpressionValue>|Array<number>} [shape-displacement=[0,0]] Displacement of the shape
 * @property {ExpressionValue|number} [shape-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [shape-rotate-with-view=false] Whether to rotate the shape with the view.
 * @property {ExpressionValue|Array<ExpressionValue>|number|import("../size.js").Size} [shape-scale=1] Scale. Unless two dimensional scaling is required a better
 * result may be obtained with appropriate settings for `shape-radius`, `shape-radius1` and `shape-radius2`.
 */

/**
 * @typedef {Object} CircleProps
 * @property {ExpressionValue|number} [circle-radius] Circle radius.
 * @property {ColorExpression} [circle-fill-color] The fill color.
 * @property {ColorExpression} [circle-stroke-color] The stroke color.
 * @property {ExpressionValue|number} [circle-stroke-width] Stroke pixel width.
 * @property {Array<ExpressionValue>|Array<number>} [circle-displacement=[0,0]] displacement
 * @property {ExpressionValue|Array<ExpressionValue>|number|import("../size.js").Size} [circle-scale=1] Scale. A two dimensional scale will produce an ellipse.
 * Unless two dimensional scaling is required a better result may be obtained with an appropriate setting for `circle-radius`.
 * @property {ExpressionValue|number} [circle-rotation=0] Rotation in radians
 * (positive rotation clockwise, meaningful only when used in conjunction with a two dimensional scale).
 * @property {boolean} [circle-rotate-with-view=false] Whether to rotate the shape with the view
 * (meaningful only when used in conjunction with a two dimensional scale).
 */

// FIXME Present in flat style but not implemented in literal webgl style:
//  - color like (fill patterns etc.)
//  - stroke line cap/join/miter limit
//  - stroke dash pattern/offset
//  - icon declutter mode
//  - circle line cap/join/miter limit
//  - circle dash pattern/offset
//  - circle declutter mode
//  - shape line cap/join/miter limit
//  - shape dash pattern/offset
//  - shape declutter mode
//  - text style

/**
 * @typedef {BaseProps & IconProps & StrokeProps & FillProps & CircleProps & ShapeProps} LiteralStyle
 */
