/**
 * @module ol/style/flat
 */

/**
 * @api
 * @fileoverview Vector layers can be styled with an object literal containing properties for
 * stroke, fill, image, and text styles.  The types below can be composed into a single object.
 * For example, a style with both stroke and fill properties could look like this:
 *
 *     const style = {
 *       'stroke-color': 'yellow',
 *       'stroke-width': 1.5,
 *       'fill-color': 'orange',
 *     };
 *
 * See details about the available properties depending on what type of symbolizer should be applied:
 *  * {@link module:ol/style/flat~FlatStroke Stroke} - properties for applying a stroke to lines and polygons
 *  * {@link module:ol/style/flat~FlatFill Fill} - properties for filling polygons
 *  * {@link module:ol/style/flat~FlatText Text} - properties for labeling points, lines, and polygons
 *  * {@link module:ol/style/flat~FlatIcon Icon} - properties for rendering points with an icon
 *  * {@link module:ol/style/flat~FlatCircle Circle} - properties for rendering points with a circle
 *  * {@link module:ol/style/flat~FlatShape Shape} - properties for rendering points with a regular shape
 *
 * To conditionally apply styles based on a filter, a list of {@link module:ol/style/flat~Rule rules} can be used.
 * For example, to style points with a big orange circle if the population is greater than 1 million and
 * a smaller blue circle otherwise:
 *
 *     const rules = [
 *       {
 *         filter: ['>', ['get', 'population'], 1_000_000],
 *         style: {
 *           'circle-radius': 10,
 *           'circle-fill-color': 'red',
 *         }
 *       },
 *       {
 *         else: true,
 *         style: {
 *           'circle-radius': 5,
 *           'circle-fill-color': 'blue',
 *         },
 *       },
 *     ];
 */

/**
 * A literal boolean (e.g. `true`) or an expression that evaluates to a boolean (e.g. `['>', ['get', 'population'], 1_000_000]`).
 *
 * @typedef {boolean|Array} BooleanExpression
 */

/**
 * A literal string (e.g. `'hello'`) or an expression that evaluates to a string (e.g. `['get', 'greeting']`).
 *
 * @typedef {string|Array} StringExpression
 */

/**
 * A literal number (e.g. `42`) or an expression that evaluates to a number (e.g. `['+', 40, 2]`).
 *
 * @typedef {number|Array} NumberExpression
 */

/**
 * A CSS named color (e.g. `'blue'`), an array of 3 RGB values (e.g. `[0, 255, 0]`), an array of 4 RGBA values
 * (e.g. `[0, 255, 0, 0.5]`), or an expression that evaluates to one of these color types (e.g. `['get', 'color']`).
 *
 * @typedef {import("../color.js").Color|string|Array} ColorExpression
 */

/**
 * An array of numbers (e.g. `[1, 2, 3]`) or an expression that evaluates to the same (e.g. `['get', 'values']`).
 *
 * @typedef {Array<number>|Array} NumberArrayExpression
 */

/**
 * An array of two numbers (e.g. `[10, 20]`) or an expression that evaluates to the same (e.g. `['get', 'size']`).
 *
 * @typedef {number|Array<number>|Array} SizeExpression
 */

/**
 * For static styling, the [layer.setStyle()]{@link module:ol/layer/Vector~VectorLayer#setStyle} method
 * can be called with an object literal that has fill, stroke, text, icon, regular shape, and/or circle properties.
 * @api
 *
 * @typedef {FlatFill & FlatStroke & FlatText & FlatIcon & FlatShape & FlatCircle} FlatStyle
 */

/**
 * A flat style literal or an array of the same.
 *
 * @typedef {FlatStyle|Array<FlatStyle>|Array<Rule>} FlatStyleLike
 */

/**
 * Fill style properties applied to polygon features.
 *
 * @typedef {Object} FlatFill
 * @property {ColorExpression} [fill-color] The fill color.
 */

/**
 * Stroke style properties applied to line strings and polygon boundaries.  To apply a stroke, at least one of
 * `stroke-color` or `stroke-width` must be provided.
 *
 * @typedef {Object} FlatStroke
 * @property {ColorExpression} [stroke-color] The stroke color.
 * @property {NumberExpression} [stroke-width] Stroke pixel width.
 * @property {StringExpression} [stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {StringExpression} [stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {NumberArrayExpression} [stroke-line-dash] Line dash pattern.
 * @property {NumberExpression} [stroke-line-dash-offset=0] Line dash offset.
 * @property {NumberExpression} [stroke-miter-limit=10] Miter limit.
 * @property {NumberExpression} [z-index] The zIndex of the style.
 */

/**
 * Label style properties applied to all features.  At a minimum, a `text-value` must be provided.
 *
 * @typedef {Object} FlatText
 * @property {StringExpression} [text-value] Text content (with `\n` for line breaks).
 * @property {StringExpression} [text-font='10px sans-serif'] Font style as [CSS `font`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font) value.
 * @property {NumberExpression} [text-max-angle=Math.PI/4] When `text-placement` is set to `'line'`, allow a maximum angle between adjacent characters.
 * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
 * @property {NumberExpression} [text-offset-x=0] Horizontal text offset in pixels. A positive will shift the text right.
 * @property {NumberExpression} [text-offset-y=0] Vertical text offset in pixels. A positive will shift the text down.
 * @property {BooleanExpression} [text-overflow=false] For polygon labels or when `placement` is set to `'line'`, allow text to exceed
 * the width of the polygon at the label position or the length of the path that it follows.
 * @property {StringExpression} [text-placement='point'] Text placement.
 * @property {NumberExpression} [text-repeat] Repeat interval in pixels. When set, the text will be repeated at this interval. Only available when
 * `text-placement` is set to `'line'`. Overrides `text-align`.
 * @property {SizeExpression} [text-scale] Scale.
 * @property {BooleanExpression} [text-rotate-with-view=false] Whether to rotate the text with the view.
 * @property {NumberExpression} [text-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {StringExpression} [text-align] Text alignment. Possible values: `'left'`, `'right'`, `'center'`, `'end'` or `'start'`.
 * Default is `'center'` for `'text-placement': 'point'`. For `'text-placement': 'line'`, the default is to let the renderer choose a
 * placement where `text-max-angle` is not exceeded.
 * @property {StringExpression} [text-justify] Text justification within the text box.
 * If not set, text is justified towards the `textAlign` anchor.
 * Otherwise, use options `'left'`, `'center'`, or `'right'` to justify the text within the text box.
 * **Note:** `text-justify` is ignored for immediate rendering and also for `'text-placement': 'line'`.
 * @property {StringExpression} [text-baseline='middle'] Text base line. Possible values: `'bottom'`, `'top'`, `'middle'`, `'alphabetic'`,
 * `'hanging'`, `'ideographic'`.
 * @property {NumberArrayExpression} [text-padding=[0, 0, 0, 0]] Padding in pixels around the text for decluttering and background. The order of
 * values in the array is `[top, right, bottom, left]`.
 * @property {ColorExpression} [text-fill-color] The fill color. Specify `'none'` to avoid hit detection on the fill.
 * @property {ColorExpression} [text-background-fill-color] The fill color.
 * @property {ColorExpression} [text-stroke-color] The stroke color.
 * @property {StringExpression} [text-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {StringExpression} [text-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {NumberArrayExpression} [text-stroke-line-dash] Line dash pattern.
 * @property {NumberExpression} [text-stroke-line-dash-offset=0] Line dash offset.
 * @property {NumberExpression} [text-stroke-miter-limit=10] Miter limit.
 * @property {NumberExpression} [text-stroke-width] Stroke pixel width.
 * @property {ColorExpression} [text-background-stroke-color] The stroke color.
 * @property {StringExpression} [text-background-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {StringExpression} [text-background-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {NumberArrayExpression} [text-background-stroke-line-dash] Line dash pattern.
 * @property {NumberExpression} [text-background-stroke-line-dash-offset=0] Line dash offset.
 * @property {NumberExpression} [text-background-stroke-miter-limit=10] Miter limit.
 * @property {NumberExpression} [text-background-stroke-width] Stroke pixel width.
 * @property {NumberExpression} [z-index] The zIndex of the style.
 */

/**
 * Icon style properties applied to point features. `icon-src` must be provided to render
 * points with an icon.
 *
 * @typedef {Object} FlatIcon
 * @property {string} [icon-src] Image source URI.
 * @property {NumberArrayExpression} [icon-anchor=[0.5, 0.5]] Anchor. Default value is the icon center.
 * @property {import("./Icon.js").IconOrigin} [icon-anchor-origin='top-left'] Origin of the anchor: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {import("./Icon.js").IconAnchorUnits} [icon-anchor-x-units='fraction'] Units in which the anchor x value is
 * specified. A value of `'fraction'` indicates the x value is a fraction of the icon. A value of `'pixels'` indicates
 * the x value in pixels.
 * @property {import("./Icon.js").IconAnchorUnits} [icon-anchor-y-units='fraction'] Units in which the anchor y value is
 * specified. A value of `'fraction'` indicates the y value is a fraction of the icon. A value of `'pixels'` indicates
 * the y value in pixels.
 * @property {import("../color.js").Color|string} [icon-color] Color to tint the icon. If not specified,
 * the icon will be left as is.
 * @property {null|string} [icon-cross-origin] The `crossOrigin` attribute for loaded images. Note that you must provide a
 * `icon-cross-origin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {Array<number>} [icon-offset=[0, 0]] Offset, which, together with the size and the offset origin, define the
 * sub-rectangle to use from the original icon image.
 * @property {NumberArrayExpression} [icon-displacement=[0,0]] Displacement of the icon.
 * @property {import("./Icon.js").IconOrigin} [icon-offset-origin='top-left'] Origin of the offset: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {NumberExpression} [icon-opacity=1] Opacity of the icon.
 * @property {SizeExpression} [icon-scale=1] Scale.
 * @property {number} [icon-width] Width of the icon. If not specified, the actual image width will be used. Cannot be combined
 * with `scale`.
 * @property {number} [icon-height] Height of the icon. If not specified, the actual image height will be used. Cannot be combined
 * with `scale`.
 * @property {NumberExpression} [icon-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {BooleanExpression} [icon-rotate-with-view=false] Whether to rotate the icon with the view.
 * @property {import("../size.js").Size} [icon-size] Icon size in pixel. Can be used together with `icon-offset` to define the
 * sub-rectangle to use from the origin (sprite) icon image.
 * @property {"declutter"|"obstacle"|"none"|undefined} [icon-declutter-mode] Declutter mode
 * @property {NumberExpression} [z-index] The zIndex of the style.
 */

/**
 * Regular shape style properties for rendering point features.  At least `shape-points` must be provided.
 *
 * @typedef {Object} FlatShape
 * @property {number} [shape-points] Number of points for stars and regular polygons. In case of a polygon, the number of points
 * is the number of sides.
 * @property {ColorExpression} [shape-fill-color] The fill color.
 * @property {ColorExpression} [shape-stroke-color] The stroke color.
 * @property {NumberExpression} [shape-stroke-width] Stroke pixel width.
 * @property {StringExpression} [shape-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {StringExpression} [shape-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {NumberArrayExpression} [shape-stroke-line-dash] Line dash pattern.
 * @property {NumberExpression} [shape-stroke-line-dash-offset=0] Line dash offset.
 * @property {NumberExpression} [shape-stroke-miter-limit=10] Miter limit.
 * @property {number} [shape-radius] Radius of a regular polygon.
 * @property {number} [shape-radius1] First radius of a star. Ignored if radius is set.
 * @property {number} [shape-radius2] Second radius of a star.
 * @property {number} [shape-angle=0] Shape's angle in radians. A value of 0 will have one of the shape's point facing up.
 * @property {NumberArrayExpression} [shape-displacement=[0,0]] Displacement of the shape
 * @property {NumberExpression} [shape-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {BooleanExpression} [shape-rotate-with-view=false] Whether to rotate the shape with the view.
 * @property {SizeExpression} [shape-scale=1] Scale. Unless two dimensional scaling is required a better
 * result may be obtained with appropriate settings for `shape-radius`, `shape-radius1` and `shape-radius2`.
 * @property {"declutter"|"obstacle"|"none"|undefined} [shape-declutter-mode] Declutter mode.
 * @property {NumberExpression} [z-index] The zIndex of the style.
 */

/**
 * Circle style properties for rendering point features.  At least `circle-radius` must be provided.
 *
 * @typedef {Object} FlatCircle
 * @property {number} [circle-radius] Circle radius.
 * @property {ColorExpression} [circle-fill-color] The fill color.
 * @property {ColorExpression} [circle-stroke-color] The stroke color.
 * @property {NumberExpression} [circle-stroke-width] Stroke pixel width.
 * @property {StringExpression} [circle-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {StringExpression} [circle-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {NumberArrayExpression} [circle-stroke-line-dash] Line dash pattern.
 * @property {NumberExpression} [circle-stroke-line-dash-offset=0] Line dash offset.
 * @property {NumberExpression} [circle-stroke-miter-limit=10] Miter limit.
 * @property {NumberArrayExpression} [circle-displacement=[0,0]] displacement
 * @property {SizeExpression} [circle-scale=1] Scale. A two dimensional scale will produce an ellipse.
 * Unless two dimensional scaling is required a better result may be obtained with an appropriate setting for `circle-radius`.
 * @property {NumberExpression} [circle-rotation=0] Rotation in radians
 * (positive rotation clockwise, meaningful only when used in conjunction with a two dimensional scale).
 * @property {BooleanExpression} [circle-rotate-with-view=false] Whether to rotate the shape with the view
 * (meaningful only when used in conjunction with a two dimensional scale).
 * @property {"declutter"|"obstacle"|"none"|undefined} [circle-declutter-mode] Declutter mode
 * @property {NumberExpression} [z-index] The zIndex of the style.
 */

/**
 * These default style properties are applied when no other style is given.
 *
 * @typedef {Object} DefaultStyle
 * @property {string} fill-color `'rgba(255,255,255,0.4)'`
 * @property {string} stroke-color `'#3399CC'`
 * @property {number} stroke-width `1.25`
 * @property {number} circle-radius `5`
 * @property {string} circle-fill-color `'rgba(255,255,255,0.4)'`
 * @property {number} circle-stroke-width `1.25`
 * @property {string} circle-stroke-color `'#3399CC'`
 */

/**
 * @return {DefaultStyle} The default flat style.
 */
export function createDefaultStyle() {
  return {
    'fill-color': 'rgba(255,255,255,0.4)',
    'stroke-color': '#3399CC',
    'stroke-width': 1.25,
    'circle-radius': 5,
    'circle-fill-color': 'rgba(255,255,255,0.4)',
    'circle-stroke-width': 1.25,
    'circle-stroke-color': '#3399CC',
  };
}

/**
 * A rule is used to conditionally apply a style.  If the rule's filter evaluates to true,
 * the style will be applied.
 *
 * @typedef {Object} Rule
 * @property {FlatStyle|Array<FlatStyle>} style The style to be applied if the filter matches.
 * @property {import("../expr/expression.js").EncodedExpression} [filter] The filter used
 * to determine if a style applies.  If no filter is included, the rule always applies
 * (unless it is an else rule).
 * @property {boolean} [else] If true, the rule applies only if no other previous rule applies.
 * If the else rule also has a filter, the rule will not apply if the filter does not match.
 */
